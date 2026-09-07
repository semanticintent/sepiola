# Decisions

*Short records of the choices that shape everything downstream. One entry per decision. Append; do not rewrite history. Status is `decided`, `open`, or `superseded by Dn`.*

Last updated 2026-09-04 (evening).

---

## D1 — Separate repo, never imports CHIRP — decided

`sepiola` is its own repo. The screen reaches the analyst over HTTP or from `fixtures/`; the shape is identical either way. No import, no shared build. A separate repo enforces the boundary for free and keeps the page's dependencies out of the MCP server's.

## D2 — The read contract lives here, CHIRP vendors it — decided

`contracts/read.schema.json` is owned by the consumer: the screen defines what it can draw. CHIRP keeps a vendored copy under its own `contracts/` and runs a test that diffs the two files byte for byte. Publishing the schema as an npm package is deferred until a second consumer exists.

Why here and not in CHIRP: the schema is the list of things the screen knows how to draw, and it changes when a view changes. The analyst adapts to the screen's vocabulary, not the other way round.

## D3 — Ids are opaque strings — decided

`skater.id` is whatever the analyst assigns. Live CHIRP uses the NHL player id. Fixtures use slugs (`zary`, `gridin`) so scenarios stay readable. The screen never parses, slugifies, or matches names against ids. The producer console may offer name-to-id convenience for humans typing; that convenience is not a tool and is not registered with WebMCP.

## D4 — The screen computes nothing; the contract carries every line — decided

The v0 mockup computed start/sit by sorting, projected points by multiplication, replay verdict lines, the games-in-hand caption, and an automatic replay comparator. None of that is ported. The contract now carries `projected_pts`, `verdicts[]`, `games_in_hand.take`, `take`, `reason`, and `window.labels` so that views only lay out what they are given. Layout math on read values (scaling a 0–100 to a bar width) is allowed. Deriving a new fact (a comparison, a sum, a sort across skaters, a sentence) is not.

Test that enforces it: every rendered text node must appear either in the fixture or in `src/copy.js` (static interface copy). See ARCHITECTURE.md → Verification.

## D5 — A circle persists until wiped or replaced — decided

The pattern doc says the screen remembers; the mockup faded the circle after 4.2 s. State wins. `state.circle` stays until `wipe()` or the next `circle()`. Motion may dim the spotlight to a ring after a few seconds; the callout stays. Only one circle at a time in v1 (`ids[0]`); multi-circle waits for layers.

## D6 — `replay(id)` shows one; `split(a, b)` shows two; no auto-comparator — decided

Choosing the foil is the pen's move or the analyst's call, never the screen's. `replay` with one id draws one row and the matching single-id verdict, if any. `split` draws two rows and the matching pair verdict. No verdict match means the sequence runs without a closing line.

## D7 — `cue_roster` under fixtures loads a fixture; live, it posts text to the analyst — decided

Roster resolution (names → players, ambiguity reporting) is CHIRP's job and already exists there (`RosterStore`). The screen never parses roster text. In fixture mode `cue_roster` takes a fixture name. In live mode it posts the pasted text and receives `skaters[]` with slots.

## D8 — Views emit end values; sequences own only time — decided

A view renders every element in its final state, with `data-*` attributes for anything a sequence needs (`data-to-width`, `data-cx`, `data-cy`, `data-r`). A sequence step is `{ at, target, do, duration?, ease?, stagger? }` and never contains a computed value. The runner reads the end value from the element. This keeps sequence JSON free of expressions and keeps meaning out of motion.

## D9 — Partial re-render driven by `touches` — decided

`render(state)` rebuilds only the views named in the last move's `touches`. A full rebuild on every move would destroy in-flight tweens and spotlight targets. Idempotency is tested by rendering the same state twice and comparing markup per view.

## D10 — Fixtures first; the analyst track runs in parallel — decided

Screen tasks 1–3 run entirely on fixtures. The CHIRP-side `read_ice` (a new analysis emitting this contract, plus an HTTP entry point) is a separate track in the CHIRP repo and is the true critical path. Wiring happens in screen task 4. See `docs/plan.md`.

## D11 — Live transport is stateless HTTP, local first — decided

CHIRP v4 is stdio and keeps the roster on disk. The screen path needs neither. A small `chirp-http` entry in the CHIRP repo exposes `POST /read` taking `{ roster_text, look_ahead_days, opponent_text? }` and returning a Read. No stored roster, no auth, CORS open to the page's origin. Runs on localhost for the demo. Remote hosting behind Signet is a later decision, not a blocker.

## D12 — Team colours come from `skater.club` via a token map — decided

The mockup hardcoded one club's jersey colours inline. `tokens.css` carries a `--club-XXX` pair per NHL tricode and a neutral pair. Generic jersey shapes only; no logos, wordmarks, or jersey designs.

## D13 — Stack — decided

Vanilla ES modules, SVG, GSAP (npm, bundled), Vite, `vite-plugin-singlefile` for `dist/sepiola.html`, Vitest for unit and contract tests, Playwright for scenarios, Ajv for schema validation. Barlow is inlined into the single-file build; the dev server may load it from Google Fonts. Check each package against the rules in the user's global CLAUDE.md before installing; report weekly downloads and last publish date for anything not already in the ecosystem.

## D14 — GitHub repo — open

Recommendation: public under `semanticintent/sepiola`, MIT, matching the CHIRP repo. Create after task 1 lands so the first public commit already runs. **Needs a yes.**

## D15 — Where the page is hosted — decided

Cloudflare Pages is the canonical URL (existing infra, same as the CHIRP docs site). The single-file `dist/sepiola.html` is what gets deployed. Registration with whichever WebMCP hosts are live happens at S4; the overview's ChatGPT Sites claim is verified then, not assumed.

## D16 — WebMCP API surface — verified against the primary spec, closed

**Re-checked 2026-09-04 against the W3C Community Group Draft Report itself (dated 4 September 2026).** Three corrections to the mockup's assumptions: `execute(input, { signal })` resolves to any JSON-serializable value, not MCP content blocks, so the ack goes back as-is; there is no `unregisterTool`, registration is undone by aborting the `signal` passed in the options; and descriptors carry optional `title` and `annotations` (`readOnlyHint`, `consequentialHint`, `untrustedContentHint`), which `src/webmcp.js` fills. The API needs a secure context. The adapter looks for `navigator.modelContext` and falls back to `document.modelContext`, since the draft's prose and the ecosystem's examples disagree on the attachment point. **Field evidence (Orbweaver, the user's previous WebMCP site, which ran in the Codex embedded browser):** it registers on `document.modelContext`, returns plain JSON objects from `execute`, and sets `annotations.readOnlyHint`. All three match this adapter. Orbweaver also prefixes its tool names (`orbweaver_*`); the telestrator keeps bare broadcast verbs on purpose, since the grammar is the product, but a host that merges tools across sites may want a prefix later. Earlier note, from secondary sources: checked 2026-09-04 against secondary sources on the W3C Community Group Draft Report (latest publication 23 April 2026). The mockup's shape is current: `navigator.modelContext.registerTool({ name, description, inputSchema, execute })`, with `unregisterTool(name)`. `provideContext()` and `clearContext()` were removed in the March 2026 revision. Chrome 146 stable (10 March 2026) ships WebMCP behind the `enable-webmcp-testing` flag, off by default. So S4 targets that flag for local demos and treats other hosts as verify-at-the-time. `src/webmcp.js` derives registration from `grammar.js`, so a later signature change is one adapter. Re-check the primary spec text at S4 before shipping.

**Addendum 2026-09-05, real host:** Chromium 153 launched with `--enable-features=WebMCP` exposes `document.modelContext` (nothing on `navigator`), and Sepiola's seven descriptors are all accepted by its `registerTool`. `test/webmcp-real.spec.js` runs this on every `npm run scenarios` as its own Playwright project. The `enable-webmcp-testing` flag name from secondary sources does nothing; the feature flag is the switch. The adapter now looks at `document` first.

## D17 — Generated docs live in `scripts/` — decided

`scripts/grammar-doc.mjs` writes `docs/grammar.md` from `grammar.js` (via Vite's SSR loader so `import.meta.glob` resolves). `test/grammar.spec.js` fails if the doc drifts. New top-level directory added under the standing "make your best call" on S1 follow-ups.

## D18 — Replay bars are one colour — decided

The mockup coloured the first skater's projected-points bar green and the second grey, which hints at a favourite. Under D6 the screen picks no favourite, so both bars are the same amber. The analyst's verdict line is the only place a call appears.

## D19 — The console echoes, and is the one view exempt from the no-opinions test — decided

The talkback console shows the transcript: every move made on this screen by anyone, and its ack. Those strings are not in the read and not in copy; they are what was said. So `test/no-opinions.spec.js` skips the console view, and `test/console.spec.js` holds it to exactly the transcript, the grammar-derived hints, and copy. Nothing else may appear there either.

## D20 — The transcript lives in state — decided

`state.log` is appended by `dispatch.call` after every move, from any caller (scenario runner, talkback, later WebMCP), never by a handler. `wipe` and `cue_roster` leave it alone. The console re-renders on every call regardless of the move's `touches`. Capped at 200 entries. Reload with the same state and the same transcript is on screen, which is what the pattern doc's screen-memory idea needs.

## D21 — Talkback surnames are a console convenience, not a tool — decided

Grammar inputs now have an `id` type (`id`, `id[]`). `src/talkback.js` swaps a typed surname for an id only where the grammar expects an id, only when it names exactly one skater in the read, and only on the console path. `run()` and `call()` never do this, so an agent must use ids (D3).

## D22 — `prepare` is the one impure step, and it lives beside the handler — decided

Live reads need a network call, and handlers are pure. A grammar entry may declare `prepare(input, state) → Promise<input>`, run by dispatch before the handler. It fetches from the analyst through `src/analyst.js` and puts the Read into the input; the handler then does what it always did. Only `cue_roster` and `read_ice` have one. Fixture mode and live mode meet at the same handler with the same input shape.

## D23 — The screen validates live reads with a validator that walks the schema file — decided

`src/contract.js` implements the JSON Schema subset the contract uses (type, required, enum, const, properties, additionalProperties, items, min/max, minLength, pattern, format for date and date-time, uniqueItems) plus the cross-field rules (bits per day, ids resolve). It reads `contracts/read.schema.json` directly, so there is still one source of truth. `test/contract.spec.js` holds it to agreement with Ajv on the fixtures and a dozen mutations. Ajv stays a dev dependency; it does not ship in the page.

## D24 — Deploy scaffold now, deploy when the analyst is live — superseded: deployed 2026-09-04

The user asked for the deploy ahead of the analyst. Pages project `chirp-telestrator` created; live at https://sepiola.pages.dev (fixture mode, so the demo path works without CHIRP). Pages config does not accept `account_id`; pass `CLOUDFLARE_ACCOUNT_ID` in the environment when wrangler needs it. The repo stays private until the analyst is live. Original decision follows.

### D24 as first written

`wrangler.jsonc` declares a Pages project `chirp-telestrator` with `pages_build_output_dir: dist` (the lesson from the CHIRP docs site: a Worker-shaped config against a Pages project deploys nowhere). `npm run deploy` builds and deploys. The build emits `dist/index.html` for Pages and the identical `dist/sepiola.html` for sharing. Not deployed yet: the repo is private until ready, and a page with no live analyst behind it is not ready. First deploy follows A3.

## D25 — Fonts are inlined — decided

Barlow and Barlow Condensed (latin subset, six faces, 104 kB, SIL OFL 1.1 with the licence in `src/fonts/`) are bundled as data URIs into the single file. No request leaves the page for type. The single file is 250 kB.

## D26 — What the agent hosts actually are — recorded (corrected 2026-09-05: no Site needed)

The Codex / ChatGPT desktop app has an embedded browser that can call WebMCP tools; ChatGPT Sites (`*.chatgpt.site`) is its hosting and test environment, where the user has published before (Orbweaver). So the demo path is: page on Cloudflare Pages (canonical); Chrome with the flag for local checks. **Correction:** a ChatGPT Site is not needed. Sites is part of Codex's own dev-and-test workflow and would only matter if the page were being developed inside Codex. Corrects the Desktop session's overview, which had this half right.

## D27 — `read_ice` takes a `start` date — decided

The analyst defaults the window to today, and today in September is preseason. `read_ice(look_ahead_days, start)` passes an optional YYYY-MM-DD through to the analyst so a week can be read ahead of time and the demo works before opening night. The screen still computes nothing about dates; the analyst returns the labels.

## D28 — Where the analyst's opinions live now — recorded

All of them are in CHIRP's `src/services/ReadIceService.ts`: schedule value (games in the window against four, less twenty for a back-to-back), flags (`warn` at two games or a back-to-back, `stream` for a four-game bench skater), the calls (Start needs at least half value; nothing is called when nobody plays), the verdict lines, the take, the games-in-hand take. Change a sentence there and every screen changes; change nothing here.

## D29 — The production build defaults to the hosted analyst — decided

The analyst has a hosted face: `chirp-edge` on Cloudflare Workers (KV-cached NHL data, CORS, per-address rate limit, anonymous). `vite build` in production mode bakes its URL in as the default, so https://sepiola.pages.dev reads live. Precedence: `?analyst=<url>`, then `?analyst=fixtures` to force fixture mode, then `window.SEPIOLA_ANALYST`, then the build default. Dev and tests have no default and stay on fixtures. Override the baked URL with `ANALYST_URL=... npm run build`.

## D30 — The brand is Telestrator; the repo keeps its ecosystem name — superseded by D32

The product and the pattern are called **Telestrator**. The page title, the menubar, and the README say so. CHIRP is the first analyst behind it and is named where an analyst belongs: in the panel's source line and in the docs. The repository stays `sepiola`, matching the `semantic-*` naming of the ecosystem and saying which analyst it was built for. If a second rink appears for a different analyst, the grammar and runner move to a `telestrator` core repo and this one becomes the CHIRP screen. Not before.

## D31 — Domain — open, with a recommendation

`telestrator.dev` is available (first year on promotion). Two honest options. **Canonical:** register it, add it as the Pages custom domain, keep it renewed; the brand and the URL are one word. **Redirect:** point it at a durable canonical and let it lapse later; not recommended, because a lapsed brand domain breaks every link that used it and hands the name to whoever registers it next. The durable canonical in either case is `telestrator.semanticintent.dev` in the zone already used by the ecosystem. Recommendation: register `telestrator.dev` only if it will be kept; otherwise use the subdomain and skip the promo. Registration and DNS are the user's; Pages custom-domain wiring follows.

## D32 — The product is Sepiola; the pattern is still the telestrator — decided

`telestrator.com` is FingerWorks Telestrators, an active Vancouver company since 1999 that calls itself the number one telestrator, and the word is the generic name of the device. Legally low risk, but the bare word could never be distinctively ours. So the product and repo are **Sepiola**, the bobtail squid: cuttlefish skin is a display of chromatophore pixels driven directly by the brain, a surface with no opinions of its own, and the passing-cloud wave that fixates prey is the circle move in nature. The pattern keeps the descriptive name *the telestrator*; a pattern named after its metaphor is normal. Repo renamed `semanticintent/sepiola` (GitHub redirects the old name), Pages project `sepiola` (the old `chirp-telestrator.pages.dev` stays up until the domain is wired), page title and menubar say Sepiola, `window.sepiola` and `dist/sepiola.html` follow. The mockup keeps its historical filename. **Correction 2026-09-05:** `sepiola.dev` is *not* available; Google Registry's RDAP shows it registered since 2025-02-12 (a generic whois lookup returned no .dev records and was misread as availability; the same error covered `hydrangea.dev`, registered 2021). No effect on the decision: the canonical hostnames are in the `semanticintent.dev` zone (D33). Known name collisions: a dormant Swiss backup client called sepiola, and whoever holds sepiola.dev.

## D33 — Domains — decided

The page is **https://sepiola.semanticintent.dev** (Pages custom domain; `sepiola.pages.dev` remains as the platform fallback). The analyst is **https://chirp-mcp.semanticintent.dev** (Worker custom domain, declared in CHIRP's `wrangler.jsonc`; `chirp-edge.michshat.workers.dev` remains as fallback). Both live in the zone the rest of the ecosystem uses, which is the durable choice from D31; `sepiola.dev` turned out to be registered by someone else (see D32 correction). Production builds bake the analyst hostname as the default (D29); the Worker's CORS allowlist names the page hostname. The old `chirp-telestrator.pages.dev` project can be deleted.

## D34 — The shell has a front door: welcome, about, legal, one menubar — decided

Two viewer-only windows join the five the pen can reach. **Welcome** opens when nothing is cued and closes itself when a roster lands; it offers a sample week (loaded through the same two moves an agent would make, so the transcript shows the grammar from the first click), the paste box, and the quick start. **About** holds About, Quick start, Privacy, Terms, Disclaimer, and Credits as sections in one scrollable window, each addressable by `#hash` so they can be linked from outside; a single-file product does not get separate legal pages. The menubar is now a menubar: a Sepiola menu (start, sample, about, quick start, GitHub, legal) and a Windows menu, with the GitHub mark at the right; the dock remains the window switcher, so nothing is listed twice. The legal text is plain language describing what actually happens (no accounts or cookies, the paste goes to the analyst and is not stored, Cloudflare request metadata, no NHL affiliation, entertainment not advice) and should be reviewed by a person; `cut_to` still reaches only the five broadcast windows.

## D35 — No SVG masks; motion end values always ride on the element — decided

The spotlight was a `<mask>` with an animated hole. WebKit does not repaint changes inside a mask, so in Safari the shade appeared and the hole never opened: the viewer saw a grey rink and a callout, and clicking a skater seemed to do nothing. The shade is now one circle with a stroke wide enough to cover the ice, its unstroked centre the hole, clipped to the ice by a static `clipPath` in the shell. Rule: no `<mask>` in views, and any element a sequence animates carries its end value as `data-*` (`data-to-r`, `data-to-width`), because GSAP applies from-values before it resolves function-based to-values, so reading the live attribute sweeps from the start to itself. Verified in WebKit and Chromium before deploy; the scenario suite runs in Chromium only, which is why this reached production.

## D36 — The signal: two lamps and a panel that explain the two sides — decided

The menubar's right side is two status pills, **WebMCP · n tools** (the pen side: tools this page registers in the browser) and **Analyst · live / fixtures** (the server side: CHIRP, the MCP server with an HTTP face), each with a lamp. Clicking either drops a panel with one card per side: what it is in a sentence, its state, the registered tool names, the analyst's URL and a live health check with version, season, and response time, and how to point the page elsewhere. The header line is the pattern in nine words. The panel is shell chrome (`src/signal.js`), reads the environment rather than the read, and says only what copy says plus the status it was given (tested). The old "Site tools" wording confused the two kinds of MCP; the two words that matter are now on screen with a lamp each.

## D37 — The mark — decided

A bobtail squid drawn as a crest, after the flat, bold-outlined style of national sports crests: sun-yellow mantle, amber side lobes, ink outline, two round eyes with a highlight, four heavy arms, and the passing cloud as an ember band across the mantle, the spotlight motif in the animal itself. One SVG (`public/sepiola.svg`) is the source; PNGs at 32, 180, 192, and 512 are rendered from it for browsers that ignore SVG favicons. The favicon travels as a data URI inside the single file; the menubar brand and the welcome title reuse the mark through one `<symbol>`. Palette only from tokens; no club colours, so it never resembles a team.

## D38 — The analyst's remote face is MCP, stateless, unauthenticated — decided

Sepiola will not proxy the analyst's tools through WebMCP: a proxied tool returns prose and draws nothing, which is the failure the pattern exists to fix; it would make the page a menu instead of a grammar; and it would be an open relay. Analyst capability enters the page only as a move that draws (D6, and `read_ice` is the precedent). Everything else is reached over MCP, hosted beside `/read` on the same Worker.

Stateless because the roster is cheap to send and the agent already holds it: every tool takes `roster_text` / `opponent_text` in its arguments, the way `read_ice` does, and nothing is stored. Sessions (the MCP session id in KV) and identity (Signet, as Wake does it) are deferred until there is something worth owning or protecting: saved leagues, a paid tier, abuse a rate limit cannot handle. The `AUTH_MODE` switch stays in the Worker config so that door remains one flip away.

## D39 — The week is labelled by the analyst; the controls make moves — decided

"Next 7 days" was written for the no-date case and was false for any other week. Rather than format start and end dates on the page, the read's `window` carries `label` ("Sep 29 – Oct 5") and the first days of the adjacent windows (`previous`, `next`), all optional in contract 0.1. Every header that shows week data shows the label: rink, panel, games in hand, and replay when a replay is up. Previous, next, and a date field in the rink header are viewer touches that issue `read_ice <days> <date>`; they hide in fixture mode, where a fixture is one fixed week. The screen still formats nothing and computes no dates.

## D40 — The transcript is history: restore is a touch, run again is a move — decided

The last twenty reads are kept in state beside the transcript, each with the move that produced it. A transcript entry that produced a read renders as a card: the analyst's week label, the game counts from the acknowledgment through a copy template, a Restore button, a Run again button, and the raw command and result folded beneath. Restore puts the kept read back on the board with no network and logs "restored · <label>"; it is a viewer touch, not a grammar verb, so the seven moves stand. Run again re-issues the original move for a fresh read. History lives in memory for the tab's life and nothing is written to the browser, so the privacy page stays true; a page reload starts clean. The week label (D39) is what marks a restored view as the week it is. This is the seed of a `state()` tool for a second pen.

## D41 — A skater's menu: the three moves about one skater, without ids — decided

Clicking a skater on the ice, or a chip on the bench or IR, opens a small menu at the click: Spotlight, Run it back, Compare with…. Spotlight is disabled off the ice, since a spotlight needs a spot. Compare with… enters a pick: a banner on the rink names the first skater and asks for the second, Escape or Cancel leaves it, and the second click issues `split a b`. The menu and the pick live in state (`menu`, `pick`), so nothing is hidden in the DOM; any move settles them. The moves are unchanged and the console and WebMCP remain equally capable; the menu only spares a viewer the ids. The skater the menu is about wears a thin dashed ring on its own SVG layer; the first pick of a compare keeps a solid ring until the second click; chips highlight the same way; jerseys highlight on hover without moving.

## D42 — The comparison opens to the analyst's tallies — decided

`games_in_hand` gains `counted`, a sentence in the analyst's words saying who the totals include, and `detail`, both rosters as one line per skater with the analyst's game count, back-to-back, and projected points (the opponent's is null when none was pasted). The games-in-hand window stays compact and opens with a toggle to two small tables. The counts are the analyst's; the screen sums nothing and renders the rows it was given. This closes the last of the six Codex review points. Contract 0.1 has now accreted optional fields four times (label, previous, next, counted, detail); the version bumps only for a breaking change.
