# Design standards

These are the rules for Radiate's web UI (`web/`). The same UI runs standalone on port 8099, in the Home Assistant sidebar through ingress, and in the demo. It is a dashboard people glance at many times a day, so it should be crisp, fast and quiet, and explain what the heating is doing.

The approach follows Emil Kowalski's design-engineering principles. The values below are the ones in `web/app.css` today; change the CSS and this page together.

## Principles

- **Explain the house.** Every room says, in words, why Radiate is doing what it does.
- **Motion only where it explains a state change.** A valve bar moving to its new opening limit, or the burn guard filling, tells the reader something. Decoration that people see dozens of times a day becomes friction.
- **Good defaults over options.** No theme picker or layout settings. Light and dark follow the system.
- **Get the small details right.** Tabular numbers that don't jiggle, press feedback on every button, and hover effects that don't fire on touch.
- **Update in place.** Elements are created once and updated, so transitions retarget smoothly instead of restarting.

## Colour

All colours are CSS custom properties on `:root`, with a dark set under `@media (prefers-color-scheme: dark)`. Use the tokens; never hard-code a colour in a rule.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#f6f4f1` | `#151412` | Page background |
| `--surface` | `#ffffff` | `#1e1c1a` | Cards, header |
| `--surface-2` | `#f1eee9` | `#26231f` | Tracks, segmented control, neutral chips |
| `--text` | `#1d1b19` | `#f1ede8` | Body text |
| `--muted` | `#67615b` | `#a39b92` | Secondary text, labels |
| `--line` | `#e6e1da` | `#34302b` | Borders |
| `--heat` | `#d95f24` | `#f08a4b` | Burns, valve bars, the brand mark |
| `--heat-soft` | `#fbe3d6` | `#3d2618` | Background for heating, topping up and fire states |
| `--ember` | `#b53c0b` | `#f5a06a` | Text on `--heat-soft` |
| `--cool` | `#386787` | `#7fb2d6` | Rest, store, demo banner, focus ring, the sign-in button, a held setpoint |
| `--cool-soft` | `#dde9f2` | `#1d2c37` | Background for rest, heat sink, demo and a held setpoint |
| `--ok` | `#2a7253` | `#6cc59c` | Comfortable |
| `--ok-soft` | `#dcefe5` | `#17302a` | Background for comfortable |
| `--warn` | `#975300` | `#f0b45a` | Lead, preheating, a room waiting for a burn, alerts, dry run, stale data, a stuck valve, short-cycling |
| `--warn-soft` | `#fbecd2` | `#36290f` | Background for those states |

Colour carries meaning, so keep it consistent: heat colours for anything burning or calling, cool for resting and hot water, green for comfortable, amber for waiting or needing attention. Every coloured state also has a text label, so colour is never the only signal.

These text pairs meet WCAG 2.1 AA for small text (4.5:1). Badges, chips and the pressed button use them at 0.72rem to 0.9rem.

| Text on background | Light | Dark |
|---|---|---|
| `--ember` on `--heat-soft` | 4.7:1 | 6.8:1 |
| `--warn` on `--warn-soft` | 5.1:1 | 7.7:1 |
| `--ok` on `--ok-soft` | 4.8:1 | 6.8:1 |
| `--cool` on `--cool-soft` | 4.9:1 | 6.3:1 |
| `--muted` on `--surface-2` | 5.3:1 | 5.7:1 |
| `--muted` on `--cool-soft` (demo banner note) | 4.9:1 | 5.2:1 |
| `--surface` on `--cool` (sign-in button) | 6.1:1 | 7.5:1 |

Bars meet 3:1 against their track: `--heat` on `--surface-2` is 3.2:1 in light mode and 6.3:1 in dark mode.

## Type

- System font stack: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. No web fonts.
- Body line height 1.4.
- Every number uses `font-variant-numeric: tabular-nums`, so live values don't shift sideways as they change.
- Headings and labels use sentence case. Section headings (`.section-h`) are the one exception: 0.85rem, uppercase, 0.06em letter spacing, weight 600.

| Role | Size | Weight |
|---|---|---|
| Room temperature (`.temp .now`) | 2rem (1.7rem under 560 px) | 650, -0.02em tracking |
| Statistic value (`.stats dd`) | 1.15rem | 600 |
| Boiler heading | 1rem | default heading weight |
| Room name | 0.98rem | 600 |
| Status line | 0.95rem | 400 |
| Buttons, segmented control, alerts | 0.9rem | 400 |
| Demand mode note | 0.8rem | 400 |
| Banner, reason text | 0.84rem to 0.85rem | 400 |
| Chips, labels, metadata, timeline ticks | 0.72rem to 0.8rem | 400 to 600 |

## Spacing and shape

| Token or value | Use |
|---|---|
| 16px | Page gutter at every width, main padding, header padding |
| 20px | Gap between main sections |
| 12px | Gap in the room grid and statistics grid |
| 14px to 18px | Card padding |
| 1180px | Maximum content width |
| `--radius` 14px | Cards and the alerts panel |
| 10px | Buttons, segmented control, banner |
| 999px | Chips and badges |
| 4px to 6px | Bars and timeline lanes |
| `--shadow` | Cards in light mode; `none` in dark mode, where borders do the work |

## Motion

| Rule | How it is done today |
|---|---|
| Animate movement with `transform` and `opacity` only | Valve bars and the burn guard scale with `transform: scaleX()` from the left. Never animate `width`, `height`, margins or padding. |
| Strong ease-out for anything the user caused or that moves | `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`. Never `ease-in`. |
| Stay under 300 ms | Press feedback 160 ms, bars 240 ms, colour changes 150 ms with plain `ease`. |
| Press feedback on everything pressable | `transform: scale(0.97)` on `:active` for `.btn`, the segmented control and text links; `scale(0.95)` for the small setpoint buttons, so the press still shows. |
| Hover only for real pointers | Hover styles live inside `@media (hover: hover) and (pointer: fine)`. |
| Respect reduced motion | Under `prefers-reduced-motion: reduce`, movement and press scaling stop; opacity and colour fades stay. |
| No animation on keyboard-driven changes | Keyboard actions apply instantly. |
| Name exact properties | List each transitioned property. Never `transition: all`. |
| Use transitions, not keyframes, for live data | Values change every tick; transitions retarget, keyframes restart. |

New UI that enters or leaves (a sheet, a toast) starts from `scale(0.95)` and `opacity: 0`, never from `scale(0)`. The sign-in card enters from `scale(0.98)` and `opacity: 0` with `@starting-style`. Stale data fades to `opacity: 0.55` over 200 ms.

## Accessibility

- The page declares `lang="en-GB"` and `color-scheme: light dark`.
- Text meets WCAG 2.1 AA contrast: 4.5:1 for body and small text, 3:1 for text at 24 px, or 19 px bold, and above. Check both themes when you add or change a token.
- Every interactive element is a real `<button>` with a visible label. Toggles use `aria-pressed`; the heating mode and the demand mode are each a `radiogroup` of `role="radio"` buttons with `aria-checked`. The demand mode group is described by its note (`aria-describedby`).
- The focus ring is `outline: 2px solid var(--cool)` with a 2px offset on `:focus-visible`. Never remove it.
- The status line is `aria-live="polite"`, so screen readers hear the boiler state change without being interrupted.
- Decorative graphics (the brand mark, the guard bar) are `aria-hidden="true"`. Graphics that carry data, such as the timeline, have an `aria-label`.
- Touch targets are at least 44 px tall on touch screens. Under `(pointer: coarse)`, buttons, the segmented controls and the token field get `min-height: 44px` (segment buttons also `min-width: 44px`), the setpoint buttons grow to 44 by 44 px, and text links get 13 px of padding above and below, cancelled by a negative margin, so the hit area grows without moving the layout. Desktop buttons stay about 32 px tall.
- The alerts toggle is a `<button>` with `aria-expanded` and `aria-controls`. Sign-in errors use `role="alert"`.
- The setpoint stepper is a `role="group"` labelled with the room name. Each button has its own label ("Raise Lounge setpoint by 0.5°") and the value is `aria-live="polite"`, so each press is read out. A button is disabled at 5° or 28°.

Stale data is the one deliberate exception to the contrast rule: it dims to 55% opacity so it reads as out of date, and the status line above it keeps full contrast and says how old it is.

## Copy

UI text follows the same writing rules as the docs: UK English, metric units, no em or en dashes as punctuation, plain words.

- **Point first.** Say the state, then the detail: "Burner on for 12 min." then "Heating Lounge and Bedroom 3."
- **Say why the burner is on.** When no room is calling, the status line names the rooms the heat is going to and why: "Burner on for 290 min, topping up Bedroom 2 and Dining room to save a second burn soon." or "Burner on for 6 min to finish its minimum burn, with the heat going to Toilet." When the hot-water store is on, it ends with "Hot water on."
- **Room name first in reasons**: "Lounge: fire lit, radiator closed and learning paused". Reasons come from the core's `Reason.message`, so write them there with the UI in mind.
- **Plain words over internal terms.** "Opening valves" for the `lead` state, "Resting" for `rest`, "learning paused: hot water" for the `store_recovery` gate. Glossary terms appear where the reader needs them, such as "Opening limit" and "Supply factor".
- **Sentence case** for labels and buttons: "Boost hot water", "Fire lit".
- **Units every time**: `20.5°` for temperatures, `35%` for openings, `12 min` for durations, `K/h` for rates. Times are 24-hour local time (`07:10`).
- **Missing values** show a single placeholder glyph, `–`, never `0` or blank. This is the only place a dash character appears.
- **Errors say what happened and what Radiate is doing about it**: "Cannot reach Radiate. Retrying… Showing data from 14:32.".
- No exclamation marks, no blame, no marketing words.

## States to design for

Every view has to make sense in each of these states. When you add a component, decide what it shows in each one.

| State | What the reader must see | How it shows today |
|---|---|---|
| Loading | That the page is connecting | Status line "Connecting…" until the first state arrives |
| Offline | That the data is stale and Radiate is retrying | When the WebSocket drops, the page polls once per reconnect attempt (2 s, backing off to 15 s). If the poll fails too, the page dims and the status line, in amber, says "Cannot reach Radiate. Retrying… Showing data from 14:32." The next state from either path clears it |
| Demo | That nothing is real | Cool banner with the simulated time and boiler, store and stairs temperatures |
| Dry run | That Radiate is not writing to devices | Persistent notice under the header with an amber "Dry run" tag, the held-back valve writes and boiler commands, and the latest five writes behind a disclosure |
| Alerts | What needs attention, in words | Amber "Needs attention" panel under the rooms, one alert per list item. A problem shared by several rooms is one line, for example "TRV not reachable (8 rooms): Bedroom 1, …". After four lines the rest sit behind "Show N more" |
| Sign-in | That the server needs its token | When the API answers 401, a sign-in card replaces the page. The token is kept in `localStorage` and sent as a Bearer header and as the stream's first message. Never shown through Home Assistant ingress or in the demo |
| Safe mode | That the boiler is stopping and why | Shown as an alert |
| Boiler states | Idle, opening valves, firing, resting, with minimum burn and minimum off progress, and why the burner is on | Chip, status line and guard bar. The guard bar and countdown use the effective minimum off from `state` |
| Short-cycling | That minimum off has been raised and for how long | Line under the guard bar with an amber "Short-cycling" tag: "Minimum off raised to 15 min for the next 23 h 30 min, so the burner starts less often." Hidden when `boiler.short_cycle` is absent or null |
| Daily accounting | Burner time and starts today, how well balanced yesterday was | "Burner today" (hours, starts, and litres and kWh when a nozzle rating is set) and "Balance, yesterday" (score out of 100, and "Last room 22 min after the first" for the median arrival spread) in the statistics. "No full day yet" until a day has closed. Servers without `accounting` show the old "Burner hours" total |
| Demand mode | Which mode is in effect, what it does, and whether it is the configured default | Eco and Comfort control beside the heating mode, with one muted line under it: "Default: fewer, longer burns. Rooms might warm a bit later." or "Every room held at its target, with more burns." A failed change reads "Not saved. Try again." in amber. Hidden when the server sends no `settings` |
| Room states | Heating, preheating, waiting for a burn, topping up, heat sink, fire lit, comfortable, waiting, bypass | Badge per room card. "Waiting for a burn" (amber) is a room calling in eco while it waits for other rooms (`reason_code` `demand.pooled`); its reason reads "Waiting to share a burn with other rooms." and, with the boiler idle, the status line names it: "Boiler idle. Toilet is waiting to share a burn with other rooms." "Topping up" (heat colours) is a burn extension, which keeps the burner on; "Heat sink" (cool) is a room opened only so the heat has somewhere to go. Each has a one-line reason on the card. A server without `extend` shows "Topped up" |
| Setpoint held | That the schedule is overridden, until when, and how to undo it | Stepper turns cool; the label reads "Held until 22:30", "Held for 1 h 20 min" or "Held until cleared", with a "Resume schedule" link. A failed change reads "Not saved. Try again." in amber |
| Stuck valve | That a radiator stays cold when it should heat | Amber line on the card: "Valve may be stuck: radiator stayed cold for 3 burns." Also in the alerts |
| Learning paused | Why the room is not learning | Metadata line under each room, for example "learning paused: window" |
| Passive room | That Radiate observes but does not control it | Badge "Bypass, not controlled"; the valve bar is hidden |
| Missing data | Which values are unknown | `–` placeholder |

## Components

**Room card.** Name and badge; the room temperature with the target after an arrow; the setpoint row; the stuck-valve line when it applies; the opening limit bar; one reason line; learned-model metadata; the fire button for rooms with an open fire.

**Setpoint row.** Shown for every controllable room. On the left, "Setpoint" or the hold; on the right, a stepper (minus, value, plus) in steps of 0.5 °C from 5 to 28 °C. Presses change the value at once and are sent together 600 ms after the last one, so several quick presses make one request. The page then asks for the state straight away, as the server only streams once a tick. The value stays as pressed until a state confirms it, or for 5 s. A hold ends at the next scheduled change by default.

**Demand mode control.** A segmented control (Eco, Comfort) after the heating mode, in the same style. The control already names the mode, so the note under it says what the mode does. It starts "Default:" while the server follows the configuration file, and that prefix is the only sign of the default. Picking the configured default sends `null`, so Radiate follows the file again. A press shows at once and is held until a state confirms it, or for 5 s. The note sits right-aligned under the controls on wide screens.

**Boiler statistics.** Burner today, starts in the last hour, predicted burn, yesterday's balance score and the supply factor. Secondary detail sits under a value in 0.75rem muted text. Every value is optional: a missing key or a null shows `–`.

## Phone width

- Design for 360 px wide first. The page never scrolls sideways.
- The 16px gutter holds at every width.
- The room grid uses `repeat(auto-fill, minmax(230px, 1fr))`, so it drops to one column on a phone.
- Under 560 px the room temperature shrinks to 1.7rem and the header becomes a grid of four rows: brand and outdoor temperature; heating mode and demand mode side by side; the demand mode note; the status line. Segment buttons drop to 10 px side padding there, so both controls fit at 360 px with 44 px touch targets.
- Above 560 px the header wraps; when the controls don't fit beside a status line of at least 280 px they move to their own row, right-aligned. Both mode controls stay reachable without scrolling.
- Long room names and reasons wrap or clamp (reasons clamp at two lines); they never push the layout wider.
