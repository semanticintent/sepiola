<img src="public/sepiola.svg" width="88" align="right" alt="">

# Sepiola

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.22387039.svg)](https://doi.org/10.5281/zenodo.22387039)

**A WebMCP telestrator: a page that draws an analyst's read onto a persistent screen.** The analyst decides. The agent draws. The screen has no opinions.

The first analyst is [CHIRP](https://github.com/semanticintent/semantic-chirp-intelligence-mcp), a fantasy-hockey intelligence MCP server. Its read of your week — who plays, who sits on a back-to-back, who to stream, games in hand — used to arrive as a paragraph in a chat window. Here it arrives as a rink.

**Live:** https://sepiola.semanticintent.dev

![Sepiola: rink, panel, games in hand, replay, and the talkback console, drawn from a real pasted lineup](docs/images/telestrator-live.png)

**Why the name.** *Sepiola* is the bobtail squid. A cuttlefish's skin is a display of millions of pigment cells driven directly by its brain: a neuron fires and a pixel shows, the neuron stops and the skin clears. The skin decides nothing. And the passing cloud, a dark band that travels across the body to hold prey still, is a spotlight done by an animal. That is this page: a skin for an analyst's brain, with a circle move nature got to first.

## Try it in a minute

1. Open the live page. After a one-second ident, the welcome offers two doors.
2. **I play fantasy hockey:** press **Watch a sample week**. For about fifteen seconds the page plays the moves an agent makes — circle a skater, run his week back, split two weeks side by side — with a caption for each. Skip at any time, then click any skater yourself. Or press **Paste your lineup**, paste a roster from any platform, and read a real week (`read_ice 7 2026-10-12` in the Talkback before opening night).
3. **I build with agents:** press **Connect your agent** for three ways in — Chrome with WebMCP enabled, the Codex desktop browser, or any MCP client pointed at `https://chirp-mcp.semanticintent.dev/mcp`:

```
claude mcp add --transport http chirp https://chirp-mcp.semanticintent.dev/mcp
```

It works on a phone too, as a single column. Add `?analyst=fixtures` to run without the analyst.

## The idea

Television spent sixty years learning how to show reasoning: circle the defender, run it back, split screen. That vocabulary is what this page exposes as tools. Three roles, kept apart:

| Role | Who | Does | Never |
|---|---|---|---|
| **Analyst** | CHIRP, over HTTP | Computes, decides, explains; returns a structured *read* | Draws, holds screen state |
| **Pen** | Any WebMCP agent, or a human in the console | Turns the viewer's question into moves; adds the take | Reads the graphic aloud |
| **Screen** | This page | Draws, remembers, lets the viewer touch | Forms an opinion |

The invariant that makes it work: **every number and every sentence on screen comes from the analyst's read or from the interface copy.** A test enforces it. If the screen ever ranks, sums, compares, or composes a sentence, something has leaked.

The pattern is called *the telestrator* and is written up in [docs/pattern.md](docs/pattern.md). Sepiola is its first worked example.

## The eight moves

| Move | Tool | On screen |
|---|---|---|
| Load the board | `cue_roster(text \| fixture)` | Resolve a lineup onto the rink |
| Read the ice | `read_ice(look_ahead_days?, start?)` | Fetch the read; reveal ice quality, badges, the panel, games in hand |
| Circle him | `circle(ids, reason?)` | Spotlight one skater with the reason pinned above; stays until wiped |
| Run it back | `replay(id)` | His week as tiles, his line, his projected points, the analyst's verdict |
| Split screen | `split(a, b)` | Two skaters' weeks side by side; the analyst's call on who starts |
| Cut to | `cut_to(view)` | Bring a window forward: rink, panel, hand, replay, console |
| Put up the board | `cue_board(drafted_text?, mine_text?, categories?)` | The draft board: tiers by position, drafted players crossed off by the analyst; with your picks, the analyst's next pick marked on it; with your league's categories, ranked for them |
| Wipe | `wipe()` | Clean the screen; the roster stays cued |

Every move returns a structured acknowledgment of what it drew. The table is generated from `src/grammar.js` into [docs/grammar.md](docs/grammar.md) and a test fails if it drifts. Producer moves (`ready`, `roll`, `caption`, `layer`) are designed and deliberately not built until a second analyst exists.

<p align="center"><img src="docs/images/circle.png" alt="Circle him: the spotlight on one skater with the analyst's reason" width="49%"> <img src="docs/images/split.png" alt="Split screen: two weeks side by side and the analyst's verdict" width="49%"></p>

## For an agent

The page registers the eight moves with `navigator.modelContext` (falling back to `document.modelContext`) using the W3C Community Group draft's descriptor shape — `name`, `title`, `description`, `inputSchema`, `annotations`, `execute`. Registration is derived from the grammar, so a tool exists in exactly one place. `execute` returns the same acknowledgment the console shows. Every agent call lands in the talkback transcript, so the viewer sees what the pen did.

Hosts today: Chrome 146+ behind the `enable-webmcp-testing` flag, and the Codex / ChatGPT desktop app's embedded browser. The menubar pill says whether tools registered.

```js
// what a pen does, in the browser
const tool = (n) => navigator.modelContext.tools.find((t) => t.name === n);
await tool('cue_roster').execute({ text: pastedLineup });
await tool('read_ice').execute({ look_ahead_days: 7 });
await tool('circle').execute({ ids: ['8478397'], reason: '4 games, back-to-back' });
```

## The read contract

[`contracts/read.schema.json`](contracts/read.schema.json) is what the analyst returns and the only thing the screen may draw. Per skater: id, name, jersey number, position, slot, club, one game bit per day, back-to-back, a schedule value 0–100, a flag, a one-line reason, points per game, projected points. Per read: the start / sit / stream / IR calls, games in hand for you and the opponent, the closing line for every replay, the take, and the sources. Optional `notes` carry what the analyst could not resolve, so nothing vanishes silently.

The contract lives here because the screen defines what it can draw; the analyst adapts. CHIRP vendors a copy and byte-diffs it in its tests. Two fixtures in [`fixtures/`](fixtures/) are instances of it; the page validates every live read against the schema before a handler sees it.

Any analyst that returns this shape gets this screen.

## How it is built

Everything that has meaning is data. Only rendering is code.

| Meaning | Lives in |
|---|---|
| What the analyst can say | `contracts/read.schema.json` |
| What the pen can do | `src/grammar.js` — one array; handlers are pure `(state, input) → state` |
| What is on screen right now | `src/state.js` — one object; nothing hidden in the DOM |
| How things move | `src/motion/sequences/*.json` — timed steps over a small verb vocabulary, run by `src/motion/runner.js` (GSAP) |

Views are pure `(state) → markup` and re-render only what a move touched. The transcript is state too. Vanilla ES modules, SVG, GSAP, Vite; no framework, because Sepiola already has a grammar and a framework would be a second one to hold. Fonts are inlined; the whole page is one 250 kB file.

Verification a model can run without eyes:

```
npm test            # contract (Ajv), views idempotent, no-opinions (every text node ∈ read ∪ copy), console, grammar doc, WebMCP descriptors
npm run scenarios   # scenarios/*.txt played through Playwright, screenshots to test/shots/, a fake modelContext, a mocked analyst
```

[ARCHITECTURE.md](ARCHITECTURE.md) has the full picture; [docs/decisions.md](docs/decisions.md) has every choice and why.

## Running it

```
npm install
npm run dev          # http://localhost:5173 — fixture mode; add ?analyst=<url> for a live analyst
npm test
npm run scenarios
npm run build        # dist/sepiola.html (one file) + dist/index.html for Pages
npm run deploy       # Cloudflare Pages
```

Production builds default to the hosted analyst, `chirp-edge`, a Cloudflare Worker face of CHIRP. The same host is also a stateless MCP server at `https://chirp-mcp.semanticintent.dev/mcp`, so an agent can reach the analyst's 23 tools directly and this page's 7 moves through WebMCP: two faces, one analyst, no proxying (D38). Override with `ANALYST_URL=... npm run build`. To run the analyst yourself: in the CHIRP repo, `npm run build && npm run serve:http` gives you `POST /read` on `localhost:3200`.

## Layout

```
contracts/read.schema.json   the contract
fixtures/                    reads the screen can run without an analyst
scenarios/                   one move per line; console and tests both speak them
src/grammar.js               the eight moves
src/state.js                 the whole show
src/views/                   rink spot strips chrome panel hand replay console
src/motion/                  runner.js + sequences/*.json
src/analyst.js               the only line to the analyst (fixtures or POST /read)
src/contract.js              validates a live read against the schema file
src/webmcp.js                registration derived from the grammar
src/talkback.js              console convenience: a surname stands in for an id
docs/                        overview, pattern, decisions, plan, grammar (generated)
reference/telestrator-v0.html   the original mockup; the visual target, never edited
```

## Status

Built and live: the screen at sepiola.semanticintent.dev, the analyst at chirp-mcp.semanticintent.dev, CHIRP `read_ice` on npm (4.3.0). Jerseys carry all 32 clubs' colours. Open: the producer layer when a second analyst arrives. See [docs/plan.md](docs/plan.md).

## Documents

- [docs/overview.md](docs/overview.md) — what we're after
- [docs/pattern.md](docs/pattern.md) — the telestrator pattern, which Sepiola implements
- [ARCHITECTURE.md](ARCHITECTURE.md) — how it's built
- [docs/decisions.md](docs/decisions.md) — D1–D31, what was decided and why
- [docs/plan.md](docs/plan.md) — the two tracks, what's done, what's next
- [CLAUDE.md](CLAUDE.md) — working instructions for a model in this repo

## Essay, paper, and citation

The story of building it is an essay on semanticintent.dev: [The Screen That Has No Opinions](https://semanticintent.dev/writing/sepiola-screen-has-no-opinions). The pattern is written up as a short paper, [docs/paper/telestrator-pattern.md](docs/paper/telestrator-pattern.md): context, forces, the pattern, this worked example, and six things building it taught. Cite the software with [CITATION.cff](CITATION.cff) (GitHub shows a "Cite this repository" button). Archived on Zenodo: concept DOI [10.5281/zenodo.22387039](https://doi.org/10.5281/zenodo.22387039) for all versions, [10.5281/zenodo.22387040](https://doi.org/10.5281/zenodo.22387040) for 0.1.0.

## Licence

MIT. Barlow and Barlow Condensed are by Jeremy Tribby under the SIL Open Font License 1.1 (`src/fonts/OFL.txt`). No team logos, wordmarks, or jersey designs: generic shapes in club colours only.
