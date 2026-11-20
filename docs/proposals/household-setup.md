# Proposal: household setup

**Status:** proposed, 20 November 2026. Not built.

Radiate should ask how a household lives and build the heating schedules from the answers. People shouldn't write schedules, and they shouldn't set a temperature for every room and time slot.

## Why

Today a house file holds named weekly schedules in the TRVZB format, one per kind of room:

```yaml
schedules:
  office:
    weekdays: "00:00/14 07:30/19 18:00/14"
    weekend: "00:00/14"
```

That format is what the valve stores. Setting up the reference house took a conversation like this:

> One of us is up at 06:30 and out until 18:00. I'm up at 08:00 and work from home in the office, but I travel sometimes. We're usually out at weekends. The spare bedroom and lounge aren't used. The downstairs toilet is only used at weekends.

Someone then turned that into eight schedules of up to six transitions each. Commercial thermostats make people do the same with a time-slot grid per zone, and people find it hard. Schedules written this way also go stale as soon as a routine changes.

Everything below the schedule already exists: the schedule itself (`WeekSchedule`), overrides, the heating mode, the schedule mirror into each TRV and the Home Assistant climate entities. This proposal adds a layer above them.

## Goals

- Set up a house by answering questions about people and rooms, in a few minutes, with no times typed for individual rooms.
- Change one thing in one place. "Unused rooms at 13 °C" changes every unused room. "I'm away until Tuesday" changes every room that depends on you.
- Show the result as a week per room that can be adjusted, so nothing is hidden.
- Keep the valves' fallback behaviour. The answers compile to ordinary `WeekSchedule`s, so the schedule mirror and everything downstream are unchanged.

## Not in scope

- Learning occupancy from motion or phones. Presence comes from people saying so or from Home Assistant `person` entities.
- Per-day exceptions beyond "away". A one-off evening out is an override, which already exists.

## The model

Four ideas, each a candidate glossary term once accepted.

**Person.** Someone who lives in the house. Has a name (shown only in the UI, never exported), an optional Home Assistant `person` entity, and a routine.

**Routine.** When a person is up, out and home, for weekdays and for weekends:

| Field | Example (early riser) | Example (home worker) |
|---|---|---|
| Up | 06:30 | 08:00 |
| Out | 07:30 to 18:00 weekdays | never |
| Bed | 22:30 | 22:30 |
| Works from | none | Office |

Weekends have their own routine, which can be "usually out" (mornings and evenings only).

**Use level.** Every room has one: **in use**, **occasional** or **unused**. Each level has one house-wide temperature, defaulting to 19, 16 and 14 °C. A level can be different at weekends, for example the toilet is unused on weekdays and occasional at weekends. Overnight, every room drops to the **night** temperature (default 14 °C).

**Who uses a room.** In-use rooms are linked to the people who use them: the bedroom to the people who sleep there, an office to the person who works from it, shared rooms to everyone. A room is warm when at least one of its people is up, home and expected to use it.

## Compiling to schedules

A pure function in `radiate.config` turns people, routines, levels and room links into one `WeekSchedule` per room:

1. For each room and day, find the intervals when at least one linked person is up and at home. Bedrooms are warm from shortly before up until the person leaves the room, and again before bed. Offices are warm through working hours. Shared rooms are warm whenever anyone is up and home.
2. Inside those intervals the room gets its level's temperature. Outside them it gets the night temperature, or the unused temperature during the day.
3. Start each warm interval early by the room's arrival lag once Radiate has learned it, so the room reaches its temperature by that time. Until then, use a fixed 30 minutes.
4. Merge intervals closer than 30 minutes, then fit the TRVZB's limit of six transitions a day, the first at 00:00. If a day still has too many, drop the shortest warm intervals and report it in the week view.

The output is the same `WeekSchedule` the house file produces today, so `radiate check-config`, the schedule mirror and the simulator need no changes. Rooms that set a `schedule` by hand keep it.

## Away

- **With Home Assistant:** when a person's `person` entity is `not_home`, their part of the routine is dropped. The office of someone travelling falls to unused; a bedroom stays warm if the other person is home.
- **Without Home Assistant:** an "Away" control per person takes an end date: "Away until Tuesday".
- **Everyone away:** the house uses the existing `frost` heating mode until the first person is due back, then returns to `auto` early enough to be warm on arrival.

Presence never bypasses the boiler guards or the frost threshold, and it never sits in the control loop through the cloud (ADR-0002).

## Setup in the UI

Setup is a short wizard in the web UI, also reachable from Home Assistant through ingress:

1. **People:** names and, optionally, their Home Assistant `person` entities.
2. **Routines:** one screen per person: when you get up, whether you go out on weekdays and when you're back, when you go to bed, and whether weekends are different.
3. **Rooms:** set each room's use level, pick who uses it, and mark offices. Rooms come from the house file or Home Assistant areas.
4. **Temperatures:** the four house-wide values (in use, occasional, unused, night), with the damp guidance below.
5. **Result:** a week view per room showing the compiled schedule, with any warm intervals that were dropped to fit the TRV called out in words.

Afterwards, the same screens edit the answers. Dragging an edge in the week view creates a room-level adjustment that survives recompiling, so a person can say "the kitchen stays warm until 23:00" without rewriting routines.

**Copy and defaults** follow the [design standards](../standards/design.md): plain words ("Away until Tuesday", "Unused rooms"), sentence case, 24-hour times. Setting the unused or night temperature below 12 °C shows a note: "Below 12° walls and window frames can get damp, especially in older houses."

## Where it lives

| Piece | Location |
|---|---|
| People, routines, levels and room links | New `household` section of the house file, written by the wizard |
| Compile to `WeekSchedule`s | `radiate.config.household`, pure, tested on the reference house |
| Presence from `person` entities | The Home Assistant integration passes presence to the server through the API, alongside existing overrides |
| Away without Home Assistant | Server state in SQLite, like overrides |
| Wizard and week view | `web/` |

## Worked example

The reference household, with roles instead of names:

| Room | Level | Used by | Weekday result | Weekend result |
|---|---|---|---|---|
| Bedroom 1 | in use | both | 19° 06:00 to 08:30 and 21:30 to 22:30 | 19° 07:30 to 09:30 and 21:30 to 22:30 |
| Bedroom 3 | in use (office) | home worker | 19° 07:30 to 18:00 | 14° |
| Dining room, Kitchen | in use | both | 19° 06:00 to 08:30 and 17:30 to 22:30 | 19° 08:00 to 10:00 and 17:30 to 22:30 |
| Bathroom | occasional | both | 16° mornings and evenings | 16° mornings and evenings |
| Bedroom 2, Lounge | unused | none | 14° | 14° |
| Toilet | unused weekdays, occasional weekends | both | 14° | 15° 08:00 to 22:30 |

When the home worker travels, Bedroom 3 drops to 14° on weekdays and the rest is unchanged.

## Open questions

- Should the kitchen and dining room stay warm through the day when someone works from home, or only when they are "used"? A per-room "warm while anyone is home" option may cover it.
- How should the compiler treat rooms with a continuous heat source, such as a kitchen with a range cooker? They may not need scheduling at all.
- Does Home Assistant presence need a delay before it counts someone as away, so a short trip to the shops does not cool their office?
