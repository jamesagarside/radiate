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
| `--muted` | `#6e6862` | `#a39b92` | Secondary text, labels |
| `--line` | `#e6e1da` | `#34302b` | Borders |
| `--heat` | `#e0662b` | `#f08a4b` | Burns, valve bars, the brand mark |
| `--heat-soft` | `#fbe3d6` | `#3d2618` | Background for heating and fire states |
| `--ember` | `#c2410c` | `#c2410c` (no dark value) | Text on `--heat-soft` |
| `--cool` | `#3c6e91` | `#7fb2d6` | Rest, store, demo banner, focus ring |
| `--cool-soft` | `#dde9f2` | `#1d2c37` | Background for rest, heat sink and demo |
| `--ok` | `#2f7d5b` | `#6cc59c` | Comfortable |
| `--ok-soft` | `#dcefe5` | `#17302a` | Background for comfortable |
| `--warn` | `#a35a00` | `#f0b45a` | Lead, preheating, alerts |
| `--warn-soft` | `#fbecd2` | `#36290f` | Background for those states |

Colour carries meaning, so keep it consistent: heat colours for anything burning or calling, cool for resting and hot water, green for comfortable, amber for waiting or needing attention. Every coloured state also has a text label, so colour is never the only signal.

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
| Press feedback on everything pressable | `transform: scale(0.97)` on `:active` for `.btn` and the segmented control. |
| Hover only for real pointers | Hover styles live inside `@media (hover: hover) and (pointer: fine)`. |
| Respect reduced motion | Under `prefers-reduced-motion: reduce`, movement and press scaling stop; opacity and colour fades stay. |
| No animation on keyboard-driven changes | Keyboard actions apply instantly. |
| Name exact properties | List each transitioned property. Never `transition: all`. |
| Use transitions, not keyframes, for live data | Values change every tick; transitions retarget, keyframes restart. |

New UI that enters or leaves (a sheet, a toast) starts from `scale(0.95)` and `opacity: 0`, never from `scale(0)`.

## Accessibility

- The page declares `lang="en-GB"` and `color-scheme: light dark`.
- Text meets WCAG 2.1 AA contrast: 4.5:1 for body and small text, 3:1 for text at 24 px, or 19 px bold, and above. Check both themes when you add or change a token.
- Every interactive element is a real `<button>` with a visible label. Toggles use `aria-pressed`; the heating mode is a `radiogroup` of `role="radio"` buttons with `aria-checked`.
- The focus ring is `outline: 2px solid var(--cool)` with a 2px offset on `:focus-visible`. Never remove it.
- The status line is `aria-live="polite"`, so screen readers hear the boiler state change without being interrupted.
- Decorative graphics (the brand mark, the guard bar) are `aria-hidden="true"`. Graphics that carry data, such as the timeline, have an `aria-label`.
- Touch targets aim for at least 44 by 44 px on phones.

Known gaps against these rules, as of this page:

- Dark mode `--ember` on `--heat-soft` measures about 2.7:1, below AA. `--ember` needs a dark value.
- In light mode the small badge and chip text on its soft background measures 4.2:1 to 4.5:1. That passes for large text only, and badges are 0.72rem to 0.8rem.
- Buttons are about 32 px tall, under the 44 px target on phones.

## Copy

UI text follows the same writing rules as the docs: UK English, metric units, no em or en dashes as punctuation, plain words.

- **Point first.** Say the state, then the detail: "Burner on for 12 min." then "Heating Lounge, Bedroom 3."
- **Room name first in reasons**: "Lounge: fire lit, radiator closed and learning paused". Reasons come from the core's `Reason.message`, so write them there with the UI in mind.
- **Plain words over internal terms.** "Opening valves" for the `lead` state, "Resting" for `rest`, "learning paused: hot water" for the `store_recovery` gate. Glossary terms appear where the reader needs them, such as "Opening limit" and "Supply factor".
- **Sentence case** for labels and buttons: "Boost hot water", "Fire lit".
- **Units every time**: `20.5°` for temperatures, `35%` for openings, `12 min` for durations, `K/h` for rates. Times are 24-hour local time (`07:10`).
- **Missing values** show a single placeholder glyph, `–`, never `0` or blank. This is the only place a dash character appears.
- **Errors say what happened and what Radiate is doing about it**: "Cannot reach Radiate. Retrying…".
- No exclamation marks, no blame, no marketing words.

## States to design for

Every view has to make sense in each of these states. When you add a component, decide what it shows in each one.

| State | What the reader must see | How it shows today |
|---|---|---|
| Loading | That the page is connecting | Status line "Connecting…" until the first state arrives |
| Offline | That the data is stale and Radiate is retrying | Partly. "Cannot reach Radiate. Retrying…" appears only when a poll fails. When the WebSocket drops, the page reconnects every 2 s but keeps showing the last state with no stale marker |
| Demo | That nothing is real | Cool banner with the simulated time and boiler, store and stairs temperatures |
| Dry run | That Radiate is not writing to devices | Not shown yet. The state's `telemetry.dry_run` is true. It needs a persistent banner, like the demo one, with the count of intended writes |
| Alerts | What needs attention, in words | Amber alerts panel under the rooms |
| Safe mode | That the boiler is stopping and why | Shown as an alert |
| Boiler states | Idle, opening valves, firing, resting, with minimum burn and minimum off progress | Chip, status line and guard bar |
| Room states | Heating, preheating, heat sink, fire lit, comfortable, waiting, bypass | Badge per room card |
| Learning paused | Why the room is not learning | Metadata line under each room, for example "learning paused: window" |
| Passive room | That Radiate observes but does not control it | Badge "Bypass, not controlled"; the valve bar is hidden |
| Missing data | Which values are unknown | `–` placeholder |

## Phone width

- Design for 360 px wide first. The page never scrolls sideways.
- The 16px gutter holds at every width.
- The room grid uses `repeat(auto-fill, minmax(230px, 1fr))`, so it drops to one column on a phone.
- Under 560 px the status line moves to its own row and the room temperature shrinks to 1.7rem.
- The header wraps; the mode control stays reachable without scrolling.
- Long room names and reasons wrap or clamp (reasons clamp at two lines); they never push the layout wider.
