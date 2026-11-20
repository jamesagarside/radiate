# Proposal: household setup

**Status:** compiler, away, household settings, the week view with room adjustments, and the setup wizard built. 20 November 2026. The `household` section of the house file and `radiate schedules` are described in [configuration](../configuration.md#household), its settings in [household settings](../configuration.md#household-settings), room adjustments in [room adjustments](../configuration.md#room-adjustments), away in [configuration](../configuration.md#away), and where the wizard saves in [set up in the web UI](../configuration.md#set-up-in-the-web-ui).

Not built yet:

- Mapping people to Home Assistant `person` entities in the wizard. The integration's options do it instead.
- Rooms from Home Assistant areas or Zigbee2MQTT devices. The wizard lists the rooms in the house file.
- Checking the wizard visually in a browser. Its logic and markup are tested; the layout hasn't been seen on screen.

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

## Settings

The rules below describe one household. None of them is fixed: every duration, temperature and choice is a setting with a default, so another household can describe how it lives. The defaults are the values in this proposal.

- House-wide: `household.timing` (fixed preheat, live preheat, getting-up time, bedtime, merge gap), `household.away` (presence delay, stale limit, return warm-up, what everyone away does), `household.weekend_days` and `household.temperatures`.
- Per person: getting-up time, bedtime and weekend days, for someone who takes an hour to get ready or works weekends.
- Per room: preheat, night temperature and unused temperature, for a slow room or a warmer nursery.
- Room kinds: `shared`, `bedroom`, `office`, `while_home` and `all_day`.

Only safety and sanity limits stay fixed: the 60-day cap on away until, the TRVZB's six changes a day and 4 to 35 °C range, and the allowed range of each setting. Below 12 °C, Radiate only adds a note about damp. `GET /api/v1/house` returns every setting with its default filled in and its allowed range, ready for the wizard.

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

A pure function, `compile_household` in `radiate.config.household`, turns people, routines, levels and room links into one `WeekSchedule` per room:

1. For each room and each day, find the intervals when the room is in use. Weekend days (Saturday and Sunday by default) use the weekend routine and the weekend use level. Each room has a kind:
   - **Bedroom:** the getting-up time (30 minutes) after each of its people gets up, and the bedtime (30 minutes) before they go to bed.
   - **Office:** its people's working hours.
   - **Shared** (the default): while any of its people is up, at home and not working, plus the getting-up time after they get up, even if they then go out or start work.
   - **While home:** while any of its people is up and at home, working or not.
   - **All day:** from the first of its people getting up to the last going to bed, whether or not anyone is home.
2. Inside those intervals the room gets its level's temperature, or its own temperature if it sets one. Outside them it gets the unused temperature between the first person up and the last in bed, and the night temperature overnight. An unused room has no intervals.
3. Merge intervals the merge gap (30 minutes) or less apart, measured after starting each one by the fixed preheat.
4. Build two weeks per room. The valve schedule starts each interval by the fixed preheat (30 minutes) and fits the TRVZB's limit of six transitions a day, the first at 00:00, by dropping the shortest warm intervals; `radiate check-config` and `radiate schedules` report them, and `CompiledHousehold.dropped` carries them as data for the week view. The live schedule starts each interval when the room is needed and keeps every interval; optimum start decides how early to heat.

The output is ordinary `WeekSchedule`s, so `radiate check-config`, the schedule mirror and the simulator need no changes. Rooms that set a `schedule` by hand keep it.

## Away

- **With Home Assistant:** when a person's `person` entity is `not_home`, their part of the routine is dropped. The office of someone travelling falls to unused; a bedroom stays warm if the other person is home.
- **Without Home Assistant:** an "Away" control per person takes an end date: "Away until Tuesday".
- **Everyone away:** the house uses the existing `frost` heating mode until the first person is due back, and optimum start warms it in time for them. A household can keep rooms at their unused temperature instead.

Presence never bypasses the boiler guards or the frost threshold, and it never sits in the control loop through the cloud (ADR-0002).

How it was built:

- `radiate.config.away` decides who counts as away, as a pure function of each person's state and the wall clock. Away until counts at once and, with optimum start, right up to the return; with a fixed preheat it stops counting the preheat before it. Home Assistant `not_home` counts after the presence delay, unless it has gone stale. Away until wins over a `home` reported before it was set, so a person can set it before leaving; arriving home after it was set ends it.
- The runtime keeps each person's away until and presence in SQLite. When the set of people away changes, it recompiles the household and hands both weeks to the live driver: it follows the live weeks, and the schedule mirror and the Shelly fallback use the valve weeks.
- Everyone away doesn't switch the heating mode. The runtime runs the core in `frost` while everyone is away and the chosen mode is `auto`, so a mode of `off` or `frost` still wins and `auto` returns by itself. With presence only, there is no return time, so it lasts until someone is home.
- Within the return warm-up before a known return, the runtime runs the core in `auto` with every room still held at frost and the return as each room's next setpoint, so optimum start warms the house in time.
- The Home Assistant integration maps Radiate people to `person` entities in its options, reports their state as it changes and every 15 minutes, and adds an away binary sensor per person and the services `radiate.set_away` and `radiate.clear_away`. The server makes every decision.
- The web UI has a People section with an "Away until" control per person.

## Setup in the UI

Setup is a short wizard in the web UI, also reachable from Home Assistant through ingress. Without a household, the web UI shows a "Set up your household" card above the rooms; with one, "Change household setup" sits beside the People heading.

1. **People:** names, adding and removing people. Mapping them to Home Assistant `person` entities stays in the integration's options.
2. **Routines:** one screen per person: when you get up, whether you go out on weekdays and when you're back, when you go to bed, and whether weekends are different.
3. **Rooms:** set each room's use level, pick who uses it, and mark offices. Rooms come from the house file or Home Assistant areas.
4. **Temperatures:** the four house-wide values (in use, occasional, unused, night), with the damp guidance below.
5. **Result:** a week view per room showing the compiled schedule, with any warm intervals that were dropped to fit the TRV called out in words.

How it was built:

- The answers are prefilled, from the household in use or, for a new one, one person and every room in use (a room with "bed" in its name starts as a bedroom), so a household can click straight through and adjust later.
- Each step has an "Advanced" disclosure for the settings behind it, each with a one-line explanation and its default: away and presence on People; getting-up time, bedtime and weekend days for each person on Routines; a room's own temperatures and preheat on Rooms; the house-wide timing and weekend days on Temperatures.
- Before moving on, the server checks the step with the same parser and limits as the house file (`POST /api/v1/household/preview`). Each error comes back with its path and shows next to its answer, with a summary at the top of the step.
- The Result step shows the compiled week for every room with `web/week.js`, warm periods dropped to fit the TRV in words, and **Save**.
- Saving never touches the house file. The household goes to `<data_dir>/household.yaml` and replaces the house file's `household` section; "Use the house file's setup instead" deletes it. The server recompiles and hands the new weeks to the driver, as when someone goes away.
- Leaving part-way keeps a draft in the browser, and the wizard picks up from it next time.

The week view is built as the web UI's Schedules section. It reads `GET /api/v1/schedules` and draws each room's week as seven 24-hour bars, with the temperature written above each warm period, hour ticks, a now marker and each day in words. A room that someone being away has changed says so ("Bedroom 3 stays at 14° while Home worker is away.") and shows its usual week. Rooms with a hand-written schedule show it too. The bar comes from pure helpers in `web/week.js`, which the wizard's Result step reuses read-only.

Afterwards, the same screens edit the answers. Dragging an edge in the week view creates a room-level adjustment that survives recompiling, so a person can say "the kitchen stays warm until 23:00" without rewriting routines.

How it was built:

- A room adjustment is part of the household section: `household.rooms.<id>.adjust`, a list of `days`, `keep` (`warm` or `cold`), `from` and `to`. The wizard keeps the list as it is when it saves.
- The compiler applies adjustments in order after the routine rules, so a later one wins where two overlap. Their times are the live schedule's, "warm by" times; the valve schedule then adds the fixed preheat and is fitted to the TRVZB, so the note about warm periods left out of the valve still works. On a day the room is unused, keeping it warm uses the in-use temperature.
- Away: adjustments apply whenever the room's normal week does. When everyone who uses the room is away, it drops to its unused level and its adjustments don't apply.
- In the Schedules section, each warm period's start and end is a grip. Dragging it, or moving it with the arrow keys, moves the edge on every day of its run of identical days in 15 minute steps. The change is previewed through `POST /api/v1/household/preview`, then saved with `PUT /api/v1/household`. A later end or an earlier start keeps the room warm; the other way keeps it cold. Moving an edge back to where the routine had it removes the adjustment instead of adding another.
- An "Adjust" form does the same without dragging, and each room lists its adjustments in words with "Remove" and "Reset to routine".
- The first change to a household from the house file saves a copy in `<data_dir>/household.yaml`, as the wizard does, and the web UI says so before saving.

**Copy and defaults** follow the [design standards](../standards/design.md): plain words ("Away until Tuesday", "Unused rooms"), sentence case, 24-hour times. Setting the unused or night temperature below 12 °C shows a note: "Below 12° walls and window frames can get damp, especially in older houses."

## Where it lives

| Piece | Location |
|---|---|
| People, routines, levels and room links | `household` section of the house file, or `<data_dir>/household.yaml` saved by the wizard, which replaces it (built) |
| Compile to `WeekSchedule`s | `radiate.config.household`, pure, tested on the reference house (built). It takes the people who are away as an argument, ready for presence |
| Print the result | `radiate schedules`, with `--trvzb` for the payload each TRV receives (built) |
| Presence from `person` entities | The Home Assistant integration passes presence to the server through the API, alongside existing overrides (built) |
| Away without Home Assistant | Server state in SQLite, like overrides, set from the web UI (built) |
| Week view and room adjustments | `web/week.js`, read from `GET /api/v1/schedules`; adjustments saved with the household (built) |
| Wizard | `web/setup.js` and `web/household.js`, through `GET`, `PUT` and `DELETE /api/v1/household` and `POST /api/v1/household/preview` in `radiate.server.setup` (built) |

## Worked example

The reference household, with roles instead of names. It is [`examples/household.yaml`](../../examples/household.yaml), and `tests/config/test_household.py` checks the result.

| Person | Weekdays | Weekend |
|---|---|---|
| Early riser | Up 06:30, out 07:30 to 18:00, bed 22:30 | Up 08:30, out 10:00 to 18:00, bed 22:30 |
| Home worker | Up 08:00, works in Bedroom 3 08:00 to 18:00, bed 22:30 | Up 08:30, out 10:00 to 18:00, bed 22:30 |

The weekend routine is an assumption: "usually out at weekends" with no times given.

| Room | Level | Kind and people | Weekday result | Weekend result |
|---|---|---|---|---|
| Bedroom 1 | in use | bedroom, both | 19° 06:00 to 08:30 and 21:30 to 22:30 | 19° 08:00 to 09:00 and 21:30 to 22:30 |
| Bedroom 3 | in use | office, home worker | 19° 07:30 to 18:00 | 14° |
| Dining room, Kitchen | in use | shared, both | 19° 06:00 to 08:30 and 17:30 to 22:30 | 19° 08:00 to 10:00 and 17:30 to 22:30 |
| Bathroom | occasional | shared, both | 16° 06:00 to 08:30 and 17:30 to 22:30 | 16° 08:00 to 10:00 and 17:30 to 22:30 |
| Bedroom 2, Lounge | unused | not set | 14° | 14° |
| Toilet | unused weekdays, occasional weekends, 15° | all day, both | 14° | 15° 08:00 to 22:30 |

These are the valve schedules, with the fixed 30-minute preheat. In the live schedules each warm period starts 30 minutes later, for example the dining room at 06:30 and 18:00 on weekdays. Every room is at 14° outside the times shown. All of it matches the schedules set by hand for the reference house, except Bedroom 1 at the weekend: by hand it was 19° 07:30 to 09:30. With both people up at 08:30, the bedroom rule gives 08:00 to 09:00. A weekend routine with one person up at 08:00 and the other at 09:00 matches Bedroom 1, but then the shared rooms and the toilet start at 07:30, not 08:00.

When the home worker travels, Bedroom 3 drops to 14° on weekdays. Bedroom 1 stays warm for the early riser, from 06:00 to 07:00 instead of 08:30, and the shared rooms end their morning at 07:30. Weekends are unchanged, because both people have the same weekend routine.

## Resolved questions

- **Does Home Assistant presence need a delay before it counts someone as away?** Yes: 60 minutes by default, set with `household.away.presence_delay_min` (0 to 720). An hour is longer than a trip to the shops or the school run, and shorter than a working day or an evening out. A room cools slowly, so turning it down for a short trip saves little heat and costs an extra boiler start to warm it again. Arriving home counts at once.
- **Should the kitchen and dining room stay warm while someone works from home?** The household decides. The `while_home` room kind keeps a room warm whenever any of its people is home, working or not. `shared` keeps today's behaviour.
- **How should the compiler treat a room with a continuous heat source, such as a range cooker?** No differently. Its use level and kind decide its schedule like any other room, and `heat_source: continuous` lets Radiate learn the steady heat, so the room calls for less. A household that never wants it heated can set it to `unused`.
- **Optimum start and the fixed preheat both start a room early. Should the runtime use the schedule without the preheat?** Yes. Each room compiles to two weeks. Radiate follows the live schedule, whose warm periods start when the room is needed, and optimum start decides how early to heat. The schedule mirror and the Shelly fallback use the valve schedule, which keeps the fixed preheat because a valve on its own can't start early. `household.timing.live_preheat: fixed` makes Radiate follow the valve schedule instead.
- **After a long absence at frost, is a 30-minute lead before the first return enough?** No, so there is no fixed lead. Within the return warm-up (`household.away.return_warmup_min`, 180 minutes by default, up to 360) before a known return, the core runs in `auto` with every room still held at frost, and the return is each room's next setpoint. Optimum start then begins as early as each room needs from its learned heating rate and arrival lag: early for a cold house, late for a warm one. The boiler guards and frost protection apply as always. The person counts as away until the time they gave.
- **What if Home Assistant stops reporting and a `not_home` is left behind?** The integration reports each person's presence every 15 minutes, and the server treats presence not reported within `household.away.presence_stale_after_min` (60 minutes by default) as unknown, which is not away. 0 turns this off.

## Open questions

- Presence takes over when an away until ends: if Home Assistant still says not home at the time the person gave, they count as away again straight away. The house has warmed for the return by then. Should a stated return start the presence delay again, so a late arrival finds the house still warm?
- Until Radiate has learned a room, optimum start can begin as soon as the return warm-up opens. Should an unlearned room use a shorter warm-up?
