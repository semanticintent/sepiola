# CLAUDE.md

Working instructions for this repo. Read this before touching anything.

## What this is

Sepiola: a WebMCP telestrator that draws CHIRP's fantasy-hockey reads onto a persistent visual surface. Named for the bobtail squid, whose skin is a display driven by its brain and whose passing-cloud wave is a spotlight done by an animal. CHIRP is the analyst. Any WebMCP agent is the pen. This page is the screen.

Read `docs/overview.md` for what we're after, `docs/pattern.md` for the idea, `ARCHITECTURE.md` for how it's built, `docs/decisions.md` for what is settled, `docs/plan.md` for what is next. In that order, once.

## The invariant

The screen has no opinions. It never ranks, scores, projects, or decides. Every number and every sentence on screen comes from a read that validates against `contracts/read.schema.json`, or from `src/copy.js`. If you find yourself computing a verdict, a comparison, a sum, or a sentence in a view, stop; that belongs in CHIRP.

`reference/telestrator-v0.html` is the visual target only. Its `read_ice`, `drawWhy`, and `cue_roster` compute things the screen must never compute. Do not port their logic.

## Where things live

- What CHIRP can say → `contracts/read.schema.json`
- What the pen can do → `src/grammar.js` (the only place a tool is defined)
- What is on screen → `src/state.js` (one object, nothing hidden in the DOM)
- How things move → `src/motion/sequences/*.json` (data, not GSAP calls)
- How data becomes pixels → `src/views/*.js` (pure functions of state)
- Colours, type, glass → `src/tokens.css`
- Every static string the interface shows → `src/copy.js`

If a change seems to need code in a place not listed here, re-read `ARCHITECTURE.md` before writing it.

## The grammar

Eight verbs. Do not add analysis verbs.

| Tool | Move |
|---|---|
| `cue_roster(text)` | Load the board |
| `read_ice(look_ahead)` | Read the ice |
| `circle(ids, reason)` | Circle him |
| `replay(id)` | Run it back |
| `split(a, b)` | Split screen |
| `cut_to(view)` | Cut to |
| `cue_board(drafted_text, mine_text)` | Put up the board (D48, D49) |
| `wipe()` | Wipe |

Producer verbs (`ready`, `roll`, `caption`, `layer`) are designed but not built. Do not build them until a second analyst source exists.

## Rules

- Handlers are pure: `(state, input) → state`. No DOM access in handlers.
- Ids are opaque strings. Never parse, slugify, or name-match them in a view or handler.
- Sequences carry no values. Views put end values on elements as `data-*`; sequences say when and how.
- `render` rebuilds only the views in the move's `touches`.
- Views are pure: `(state) → markup`. No tool calls, no DOM reads, no cross-view imports.
- Motion is data. If you are writing `gsap.to(...)` outside `src/motion/runner.js`, move it to a sequence file.
- One source of truth per fact. Tool definitions live only in `grammar.js`; WebMCP registration, the console, and `docs/grammar.md` derive from it.
- `dist/sepiola.html` is a build output. Never edit it.
- Respect `prefers-reduced-motion`: every sequence must run correctly at duration zero.
- No team logos, wordmarks, or jersey designs. Generic jersey shapes in team colours only.
- Keep the warm, bright look. Tokens are in `tokens.css`; do not introduce colours inline.

## How to verify

You cannot see the screen. Use the eyes the repo gives you:

```
npm test              schema validation, view rendering, no-opinions grep
npm run scenarios     runs scenarios/*.txt through Playwright, screenshots to test/shots/
npm run dev           local dev server
npm run build         single-file dist/sepiola.html
```

A change is done when tests are green and the screenshots for the affected scenario look right. Describe what you see in the screenshots in your summary.

## Adding a broadcast move

1. Data needed from the analyst? Extend `read.schema.json` and one fixture.
2. Add one entry to `grammar.js`.
3. New drawing? Add or extend a view.
4. Movement? Add a sequence file.
5. Add a scenario in `scenarios/`.
6. `npm test && npm run scenarios`. Regenerate `docs/grammar.md`.

## Style

- Vanilla ES modules, SVG, GSAP. No framework.
- Small files. A view over ~150 lines is probably two views.
- Names follow the broadcast: circle, replay, split, panel, cue. Not highlight, showWhy, compare, verdictPanel, setRoster.
- Copy in the interface is plain and in the analyst's register. Sentence case. No labels above things that explain themselves.

## When unsure

Prefer the smaller change. Prefer data over code. Ask before adding a dependency, a framework, a new top-level directory, or any verb that sounds like thinking.
