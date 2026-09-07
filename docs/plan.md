# Plan

*Two tracks. The screen track runs on fixtures and never waits. The analyst track makes the fixtures true.*

Last updated 2026-09-04. Decisions referenced as Dn are in `docs/decisions.md`.

---

## Where things stand

- Design docs, pattern, and a visual mockup exist (from a Claude Desktop session that had not seen the CHIRP codebase).
- The read contract is drafted at `contracts/read.schema.json` v0.1 and two fixtures validate against it.
- **S1 done 2026-09-04.** Scaffold, contract test, rink/spot/strips/chrome views, `cue_roster` `read_ice` `circle` `wipe`, runner with three sequence files, no-opinions text-node test, three scenarios with screenshots, single-file build. 161 unit tests, 5 scenarios, all green. Runner-as-data held: no sequence needed a value.
- **S2 done 2026-09-04.** `replay`, `split`, the replay view, `flip`/`drop` verbs, verdict lookup by id set. 298 unit tests, 7 scenarios, green. `docs/grammar.md` now generated and drift-tested.
- **S3 done 2026-09-04.** Panel (calls in the analyst's order, take, source footer), games in hand (one bar when no opponent), `cut_to`, talkback console with the transcript in state and surname convenience. 7 moves, 8 views, 9 scenarios.
- **S4 built 2026-09-04.** `src/webmcp.js` registers the grammar with the draft-spec descriptor shape; `?analyst=<url>` switches `cue_roster`/`read_ice` to `POST /read` with a runtime contract check; fonts inlined; Pages deploy scaffold. 13 scenarios incl. a fake modelContext and a mocked analyst. **Not deployed** (D24).
- **A2 + A3 done 2026-09-04** on the same CHIRP branch: `ReadIceService` emits the contract from the NHL schedule, club stats, and club rosters (jersey numbers); MCP tool `read_ice`; `src/http.ts` serves `POST /read` on localhost:3200. Proven end to end: the built single file with `?analyst=http://localhost:3200` and a real pasted Flames lineup for the week of 2026-10-12.
- **A1 done 2026-09-04** on a CHIRP branch: vendored schema + README + a test that pins the version and byte-diffs against a sibling checkout.
- CHIRP today returns analysis objects as JSON in a text block. It has no output schemas and no per-skater-per-day schedule shape. Its schedule service is club-level and its lineup analysis checks only today. That gap is the analyst track.

## Screen track (this repo)

### S1 — Prove every layer once — done

Read `CLAUDE.md`, `ARCHITECTURE.md`, `docs/` in that order. Then:

- Scaffold the layout in `ARCHITECTURE.md` with working `npm run dev`, `npm test`, `npm run scenarios`, `npm run build` (D13).
- `test/contract.spec.js`: both fixtures validate against the schema.
- `src/state.js`, `src/grammar.js` with `cue_roster`, `read_ice`, `circle`, `wipe` only. `cue_roster` loads a fixture by name (D7). `read_ice` under fixtures is a no-op fetch that reveals what `cue_roster` loaded.
- `src/views/rink.js` and `src/render.js` with partial re-render by `touches` (D9).
- `src/motion/runner.js` with the verbs `reveal`, `fade_in`, `sweep` and `src/motion/sequences/read_ice.json`, `circle.json` (D8). Reduced motion runs at duration zero.
- `src/tokens.css` with the warm palette from the reference and the `--club-XXX` map (D12).
- `test/no-opinions.spec.js` as the text-node test from D4.
- Scenarios: `scenarios/read-ice.txt`, `scenarios/circle.txt`. Screenshots to `test/shots/`.
- Match `reference/telestrator-v0.html` visually for the rink window, menubar, dock, and desktop. Do not port logic from its `read_ice`, `drawWhy`, or `cue_roster`.

Done when: tests green, both scenarios produce screenshots, and the report describes what the screenshots show. If the runner-as-data idea has a flaw, S1 finds it before five views depend on it.

### S2 — Replay and split — done 2026-09-04

`replay`, `split` in the grammar (D6). `src/views/replay.js`. Sequence verbs `flip`, `count_up`, `fill`, `drop`. Verdict lookup by id set. Scenario with a single replay, a split with a matching pair verdict, and a split with no matching verdict.

### S3 — Panel, games in hand, cut_to, console — done 2026-09-04

`src/views/panel.js`, `src/views/hand.js`, `src/views/console.js`. `cut_to`. Panel footer shows `source`. `games_in_hand.opp === null` draws one bar and the analyst's take. Console parses one move per line and offers name-to-id convenience (D3). Draggable windows write to `state.windows`.

### S4 — WebMCP, live transport, publish — built 2026-09-04; deploy waits on A3

Verify the API surface (D16). `src/webmcp.js` derives registration from `grammar.js`. `read_ice` and `cue_roster` switch from fixtures to `POST /read` when an analyst URL is configured (D11). Single-file build. Host (D15). Record the demo.

## Analyst track (CHIRP repo, `semantic-chirp-intelligence-mcp`)

### A1 — Vendor the contract — done 2026-09-04 (CHIRP branch `feat/read-contract`, not yet pushed)

Copy `contracts/read.schema.json` into CHIRP and add the byte-diff test (D2). Small PR, no behaviour change.

### A2 — `read_ice` analysis — done 2026-09-04 (CHIRP branch `feat/read-contract`)

New `ReadIceAnalysis` on the existing `AnalysisTemplate`, emitting a Read:

- `skaters[].games` from `NhlScheduleService.hasGameOn` per club per day over the window.
- `b2b` from the existing back-to-back counter.
- `schedule_value` from `ScheduleValueAnalysis`'s club rating, rescaled to the window.
- `ppg` and `projected_pts` from `NhlStatsService` club stats.
- `calls`, `reason`, `verdicts`, `take`, `games_in_hand.take` from CHIRP's existing chirp voice, now as structured fields.
- `games_in_hand.opp` null unless an opponent roster is supplied.
- `source` from the data-source reporting CHIRP already does.

Expose it as an MCP tool too, so the text clients get the same read. Validate output against the vendored schema in tests.

### A3 — `chirp-http` — done 2026-09-04 (same branch)

A second entry point, same core: `POST /read` with `{ roster_text, look_ahead_days, opponent_text? }`, stateless, CORS for the page origin, localhost by default (D11). The screen already speaks this: open it with `?analyst=http://localhost:<port>` and paste a lineup in the console.

### S5 — First deploy — deployed 2026-09-04; reading live since 2026-09-05

Live at https://sepiola.semanticintent.dev, defaulting to the hosted analyst `chirp-edge` (https://chirp-mcp.semanticintent.dev, CHIRP PR `feat/chirp-edge`). Paste a lineup in the talkback and `read_ice 7 2026-10-12`. `?analyst=fixtures` for fixture mode. Repo public since 2026-09-05 (MIT). CHIRP 4.2.0 on npm; the analyst's CORS allowlist names the Pages origin and localhost. Open: publish the single file to a ChatGPT Site for the Codex embedded browser (D26) and add that origin to the analyst's `CORS_ORIGIN`; a custom domain in the `semanticintent.dev` zone.

## Sequence

```
S1 ──▶ S2 ──▶ S3 ──▶ S4
A1 ──▶ A2 ──▶ A3 ────┘
```

A1 can happen today. A2 is the long pole; start it as soon as S1 confirms the contract needs no shape change.

### S6 — Front door — done 2026-09-05

Welcome window with a sample-week button, About window with quick start and legal sections addressable by hash, menubar consolidated into Sepiola and Windows menus with a GitHub mark (D34).

## Sprint: opening night (started 2026-09-05)

Four items, in order. Each lands with tests, a deploy, and a line here. Status: ☐ not started · ◐ in progress · ☑ done.

| # | Item | Scope | Status |
|---|---|---|---|
| 1 | **Real WebMCP host** | A Playwright project that launches Chromium with `--enable-features=WebMCP` and runs the agent scenario against Chrome's real `document.modelContext`; adapter looks at `document` first; signal copy stops naming `navigator`; D16 addendum. Done when `npm run scenarios` proves 7 registrations on the real API. | ☑ 2026-09-05 — Chromium 153, `document.modelContext`, 7 accepted |
| 2 | **Opponent's lineup** | Second box in the paste window; `cue_roster` and `read_ice` carry `opponent_text` to the analyst; `state.source` remembers it for re-reads; games in hand shows both bars and the analyst's edge line. Done when the live scenario posts both rosters and the hand window draws two bars. | ☑ 2026-09-05 |
| 3 | **CHIRP 4.3.1** | Version, changelog (Unreleased → 4.3.1), tag, GitHub release from main. `npm publish` needs the user's OTP. Done when npm shows 4.3.1. | ☑ 2026-09-05 — on npm |
| 4 | **Write-up** | `docs/paper/` — the telestrator pattern as a paper (abstract, the pattern, the worked example, what was learned, references) ready for Zenodo; `CITATION.cff`; a `v0.1.0` release tag so Zenodo's GitHub integration can mint a DOI; a LinkedIn launch draft in `docs/launch/` in the product-launch voice. Done when the user has three files to read and one button to press. | ☑ 2026-09-05 — paper, CITATION.cff + .zenodo.json, v0.1.0 release, LinkedIn draft; **Zenodo DOI 10.5281/zenodo.22387039** (v0.1.0: 10.5281/zenodo.22387040) |

Out of this sprint: remote MCP face for `read_ice` behind Signet; producer verbs; the spotlight dim (D5); mobile.

## Sprint: the analyst's MCP face (started 2026-09-05)

Stateless remote MCP at `chirp-mcp.semanticintent.dev/mcp`, so an agent anywhere gets the analyst's tools and an agent in a browser gets both halves from one host. No sessions, no Signet (D38).

| # | Item | Scope | Status |
|---|---|---|---|
| 1 | **Tool registry** (CHIRP) | Pull the 23 definitions and the call switch out of `src/index.ts` into `src/tools.ts`; `src/server.ts` builds a Server from them; stdio entry becomes thin. Same list from one source, like Sepiola's grammar. | ☑ 2026-09-06 |
| 2 | **Roster in arguments** (CHIRP) | Every roster-dependent tool accepts optional `roster_text` / `opponent_text`; a request-scoped override (AsyncLocalStorage) makes analyses read the pasted roster instead of disk for that call. On the Worker the `set_*` tools answer "this endpoint keeps no state; pass roster_text". | ☑ 2026-09-06 |
| 3 | **`/mcp` on the Worker** (CHIRP) | SDK web-standard Streamable HTTP transport, stateless, JSON responses; one server per request; `/health` reports the endpoint and tool count; same pacing, cache, rate limit. Proven with a real MCP client against the live host. | ☑ 2026-09-06 |
| 4 | **Sepiola shows it** | The analyst card in the signal panel reads `/health` and shows the MCP endpoint and tool count; README and paper availability updated. | ☑ 2026-09-06 |

## Sprint: Codex feedback (started 2026-09-06)

An agent in Codex drove the screen through WebMCP and the analyst through MCP, then reviewed the screen from the viewer's seat. Six points, all fair. Bugs first.

| # | Item | Scope | Status |
|---|---|---|---|
| 1 | **Stale spotlight after a re-read** | `read_ice` touches every view that shows read data (spot, replay too); the ack names the window it read. | ☑ 2026-09-06 |
| 2 | **`read_ice 2026-09-29` read the wrong week** | Console: a date where days were expected slides to `start`; nonsense is refused with the move's example; `look_ahead_days` must be 1–14 whole days. Grammar entries carry an `example`. | ☑ 2026-09-06 |
| 3 | **The week, unmistakable** | Analyst returns `window.label`; every window showing week data shows it; previous/next-week controls issue `read_ice` moves. | ☑ 2026-09-06 (CHIRP PR #49, D39) |
| 4 | **Player actions on click** | Click a skater → Spotlight · Replay · Compare with… (two-click pick). Moves stay the moves. | ☑ 2026-09-06 (D41) |
| 5 | **Talkback as history** | Reads kept in state; readable entries from copy templates filled with ack values; click restores, Run again re-issues; raw JSON expandable. Seed of `state()`. | ☑ 2026-09-06 (D40) |
| 6 | **Comparison on demand** | Optional `games_in_hand.counted` + `detail` (still 0.1): per-skater games/b2b/projected for both rosters; who counts, in the analyst's words. CHIRP PR alongside. | ☑ 2026-09-06 (D42) — sprint complete |

## Not in scope

Producer verbs (`ready`, `roll`, `caption`, `layer`), a `state()` tool, multiple circles, remote hosting behind auth, any second analyst, any Yahoo integration.

## Fixture notes

`fixtures/cgy-week1.json` is the reference mock's roster, made schema-true by an authoring script that played the analyst. `fixtures/thin-week-no-opp.json` is a light week with no opponent, two on IR, one D slot short, and a goalie on a back-to-back. Their schedule bits are illustrative, not the 2026-27 NHL schedule, and the fixtures say so in `source.data`.
