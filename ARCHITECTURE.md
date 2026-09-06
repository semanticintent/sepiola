# Architecture — Sepiola, the telestrator

*How the screen is built so that it stays predictable for people and models.*

Draft 0.2 — September 2026. Decisions referenced as Dn are in `docs/decisions.md`.

---

## The one idea

Everything that has meaning is data. Only rendering is code.

Rich visuals get expensive to change when the meaning is smeared across imperative code — a spotlight is forty lines of animation and selectors, and to alter it you must first reconstruct what those forty lines meant. So the telestrator pushes meaning into four kinds of data, and leaves the code with one job: turn data into pixels.

| Meaning | Lives in | Not in |
|---|---|---|
| What CHIRP can say | `contracts/read.schema.json` | view code |
| What the pen can do | `src/grammar.js` | scattered handlers |
| What is on screen right now | `src/state.js` | the DOM |
| How things move | `src/motion/sequences/*.json` | GSAP calls in views |

A model working here reads data first and code second, and most changes never touch code at all.

## Three roles, one invariant

The analyst (CHIRP) computes and explains. The pen (any agent) asks and draws. The screen (this project) renders and remembers.

**The screen has no opinions.** It never ranks, scores, projects, or decides. If a number or a sentence appears on screen that was not in a read from the analyst, something has leaked. Layout math on a read value (a 0–100 to a bar width) is fine. Deriving a new fact (a sort across skaters, a sum, a comparison, a sentence) is not. Tests enforce this: every rendered text node must come from the fixture or from `src/copy.js`.

## The four data layers

### 1. The read contract

`contracts/read.schema.json` is the source of truth for what the analyst returns. CHIRP validates its output against it; the screen validates input against it; fixtures are instances of it; the docs table is generated from it.

Shape, in outline (v0.1; the file is authoritative):

```
Read
  contract_version   "0.1"
  analysis_id        string      opaque; handed back to replay()
  generated_at       datetime
  window             { start, end, days, labels[] }     labels in the analyst's words
  skaters[]
    id, name, num, pos, slot, club    slot: L1 L2 D1 D2 G BN IR; club: NHL tricode or null
    games            bool[days]        one bit per day
    b2b              bool
    schedule_value   0–100             ice quality under the skates
    flag             warn | stream | ir | null
    reason           one line, the analyst's words
    ppg, projected_pts                 both analyst-computed
    note             string | null
  calls              { start[], sit[], stream[], ir[] }  skater ids, in display order
  games_in_hand      { you, opp | null, take }
  verdicts[]         { ids[1..2], line }   the line that drops at the end of a replay
  take               one line of chirp for the panel
  source             { analyst, data[] }
```

Every sentence the screen can show is in there: `reason`, `take`, `games_in_hand.take`, `verdicts[].line`. Every number is too. That is deliberate (D4): the mockup computed these on the page, and the first thing a port would do is copy that.

Change the schema and everything downstream tells you what broke.

### 2. The grammar

`src/grammar.js` exports one array. Each entry is a complete description of a broadcast move:

```js
{
  name: 'circle',
  move: 'Circle him',
  description: 'Spotlight one skater with the reason pinned above.',
  input: { ids: 'string[]', reason: 'string?' },
  touches: ['rink'],
  handler: (state, input) => ({ ...state, circle: { id: input.ids[0], reason: input.reason } }),
  sequence: 'circle',
  ack: (state) => ({ circled: state.circle.id })
}
```

WebMCP registration, the producer console, and the docs table all derive from this array. A tool exists in exactly one place. Handlers are pure: state in, state out. They never touch the DOM.

### 3. State

`src/state.js` holds the whole show as one plain object:

```
state
  read          the last Read, or null (cue_roster loads it; read_ice reveals it)
  ice           has read_ice revealed the read
  windows       { rink: {open, x, y, z}, panel: {...}, hand, replay, console }
  circle        { id, reason | null } | null      persists until wipe() or the next circle()
  replay        { ids: [a] | [a, b] } | null
  log           [{ line, ack, readId? }]           the transcript, appended by dispatch (D20)
  reads         [{ id, read, name, input, line, at }] the last 20 reads, for restore / run again (D40)
  layer         active layer name (future)
```

Nothing lives in the DOM that is not derivable from state. Reload the page with the same state and you get the same screen. This is what makes the screen inspectable by a second agent, and it is the seed of a future `state()` tool.

### 4. Motion

`src/motion/sequences/*.json` describe choreography as timed steps:

```json
{
  "name": "replay",
  "steps": [
    { "at": 0.10, "target": "tile.game",  "do": "reveal", "stagger": 0.12 },
    { "at": 1.00, "target": "count",      "do": "fade_in" },
    { "at": 1.20, "target": "points_bar", "do": "fill", "ease": "power3.out" },
    { "at": 1.50, "target": "verdict",    "do": "drop" }
  ]
}
```

`src/motion/runner.js` interprets a small fixed vocabulary of `do` verbs — `reveal`, `fade_in`, `fill`, `sweep`, `drop`, `flip`, `count_up` — against GSAP. A new broadcast move gets a new sequence file, not new animation code. Reduced motion runs every sequence at duration zero. `roll(sequence)` later plays several in a row.

Sequences carry no values (D8). A view renders every element in its final state and puts anything a sequence needs on the element as `data-*` (`data-to-width`, `data-cx`, `data-cy`, `data-r`). A step is `{ at, target, do, duration?, ease?, stagger? }` and nothing else. The runner reads the end value from the element. If a sequence seems to need an expression, the view is not emitting enough.

## The code layers

```
render(state)
  └── views/rink.js     (state) → SVG
  └── views/panel.js    (state) → HTML
  └── views/hand.js
  └── views/replay.js
  └── views/console.js
```

Views are pure functions of state that return markup. They are idempotent: calling `render` twice with the same state produces the same screen. Views never call tools, never read the DOM, never talk to each other. After render, the runner plays whatever sequence the last move requested.

`render` rebuilds only the views named in the move's `touches` (D9). A full rebuild on every move would destroy in-flight tweens and the spotlight's targets. The idempotency test renders the same state twice and compares markup per view.

Tools flow one way:

```
input → [grammar.prepare(input, state)] → grammar.handler(state, input) → new state → ack → transcript → render(touches + console) → runner.play(sequence)
```

`prepare` is optional and is the one impure step: it asks the analyst (a fixture, or `POST /read`) and puts the Read into the input (D22). Handlers stay pure.

## Verification a model can run

A model cannot look at the screen. So the project gives it eyes:

- `fixtures/` — four or five reads that cover the interesting cases: light week, back-to-back heavy, IR-riddled, empty roster, opponent stronger.
- `scenarios/` — plain-text console scripts, one move per line: `cue_roster fixtures/cgy.txt`, `read_ice`, `circle zary`, `split gridin zary`.
- `test/scenarios.spec.js` — Playwright runs each scenario, checks every ack against the expected shape, and screenshots each step to `test/shots/`.
- `test/contract.spec.js` — every fixture validates against the schema; every view renders every fixture without throwing.
- `test/no-opinions.spec.js` — renders every fixture through every view and asserts each text node is a string from the fixture or from `src/copy.js`. This is the mechanical form of "the screen has no opinions" (D4).

Run all of it with one command. If it is green and the screenshots look right, the change is done.

## Stack

Vanilla ES modules, SVG, GSAP, Vite for dev and the single-file build. No framework: the telestrator already has a grammar, and a framework would be a second one for a model to hold. A ten-line `html` tagged template helper keeps views declarative. Tokens live in `src/tokens.css`.

## Adding a broadcast move

1. If it needs new data from the analyst, extend `read.schema.json` and a fixture.
2. Add one entry to `grammar.js`: name, move, description, input, touches, handler, sequence, ack.
3. If it draws something new, add or extend a view.
4. If it moves, add a sequence file.
5. Add a scenario that exercises it.
6. Run the suite. Regenerate the docs table.

Six steps, each in one predictable place.

## Layout

```
sepiola/
  CLAUDE.md
  ARCHITECTURE.md              this file
  index.html                   the shell: menubar, window frames, static ice sheet, dock
  docs/
    overview.md                what we're after
    pattern.md                 the telestrator pattern
    decisions.md               what is settled, what is open
    plan.md                    the two tracks
    grammar.md                 generated from grammar.js (not yet generated)
  contracts/read.schema.json
  fixtures/*.json
  scenarios/*.txt
  src/
    main.js                    boot; the viewer's touches; window.sepiola
    dispatch.js                the one path: handler → ack → transcript → render(touches + console) → play
    talkback.js                console convenience: surname → id (D21). Not a tool.
    analyst.js                 the only line to the analyst: fixtures, or POST /read when ?analyst= is set (D22)
    contract.js                validates a live Read against the schema file before a handler sees it (D23)
    webmcp.js                  registration derived from grammar.js (D16)
    fonts.css, fonts/          Barlow, inlined into the single file (D25)
    state.js
    grammar.js
    render.js
    layout.js                  the formation: where each slot stands
    fixtures.js                fixtures by name
    copy.js                    every static string the interface shows
    html.js                    template helper
    views/                     index.js chrome.js (4 header subtitles) rink.js spot.js strips.js replay.js panel.js hand.js console.js welcome.js about.js formats.js
    motion/runner.js
    motion/sequences/*.json    read_ice circle replay wipe
    tokens.css                 colours, type, glass
    screen.css                 the desktop, windows, dock, rink classes
  test/
    states.js                                            every state a view can render, from the fixtures
    contract.spec.js views.spec.js no-opinions.spec.js console.spec.js grammar.spec.js   (vitest)
    scenarios.spec.js                                    (playwright → test/shots/)
  dist/sepiola.html        single-file build for sharing
```

The rink window is three views, not one: `rink` (ice patches and jerseys), `spot` (the spotlight), `strips` (legend, bench, IR), plus `chrome` for the subtitle. `circle` touches only `spot`, so a circle never rebuilds the skaters under it.

## Boundaries

- The screen never imports from CHIRP. It reads over HTTP or from fixtures. Same shape either way, and every live read is checked against the contract before it is drawn (D23). The contract lives here; CHIRP vendors a copy and diffs it in its tests (D2).
- Ids are opaque. The screen never parses, slugifies, or name-matches them (D3).
- A circle persists in state until `wipe()` or the next `circle()`. Motion may dim it; state does not forget it (D5).
- `replay(id)` shows one row; `split(a, b)` shows two. The screen never picks a comparator (D6).
- `cue_roster` never parses roster text. Fixture mode loads a fixture; live mode posts the text to the analyst (D7).
- The grammar never grows analysis verbs. `rank`, `recommend`, `score` belong to the analyst.
- Producer moves (`ready`, `roll`, `caption`, `layer`) are not built until a second analyst exists.
- The single-file `dist/` is an output, never edited by hand.
