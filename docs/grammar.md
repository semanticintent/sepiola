# The grammar

*Generated from `src/grammar.js` by `npm run docs:grammar`. Do not edit; a test fails if this file drifts.*

Every move is one thing an analyst would do with a pen in hand. Each returns a structured ack of what it drew.

| Move | Tool | Input | Example | Touches | Sequence | On screen |
|---|---|---|---|---|---|---|
| Load the board | `cue_roster` | `text: string?`, `fixture: string?`, `opponent_text: string?` | `cue_roster cgy-week1` | chrome, chrome-panel, chrome-hand, chrome-replay, rink, spot, strips, panel, hand | — | Load a roster onto the rink. Give `text`, the pasted lineup (any format, one player per line), when an analyst is configured; or `fixture`, the name of a read in fixtures/. `opponent_text`, the other side's lineup, gives games in hand its second bar. |
| Read the ice | `read_ice` | `look_ahead_days: number?`, `start: string?` | `read_ice 7 2026-10-05` | chrome, chrome-panel, chrome-hand, chrome-replay, rink, spot, strips, panel, hand, replay | `read_ice` | Reveal the read: ice quality under the skates, badges, the calls, games in hand. `start` (YYYY-MM-DD) moves the window; the analyst defaults to today. |
| Circle him | `circle` | `ids: id[]`, `reason: string?` | `circle zary 2 games, back-to-back` | spot, board | `circle` | Spotlight one skater with the reason pinned above. Without a reason, the analyst's own line is used. |
| Run it back | `replay` | `id: id` | `replay gridin` | replay, chrome-replay | `replay` | Stage the reasoning behind one skater: his week, the analyst's line, his projected points, and the call if the analyst made one. |
| Split screen | `split` | `a: id`, `b: id` | `split gridin zary` | replay, chrome-replay | `replay` | Two skaters' weeks side by side, then the analyst's call on who gets the start, if the analyst made one. |
| Cut to | `cut_to` | `view: view` | `cut_to panel` |  | — | Bring a window forward: rink, panel, hand, replay, or console. |
| Put up the board | `cue_board` | `drafted_text: string?`, `mine_text: string?`, `playoff_start_week: number?`, `playoff_end_week: number?`, `fixture: string?` | `cue_board board-sample` | board | — | Put up the draft board: the analyst's tiers by position from last season, one note per prospect, and where each position thins out. Give `drafted_text`, the players already taken by anyone (one per line, any format), and the analyst crosses them off. Give `mine_text`, your own picks, and the analyst also says who to take next: its top three are marked on the board in its order. `playoff_start_week` and `playoff_end_week` (your league's fantasy playoff weeks; week 1 is the week of the NHL opener) let that pick weigh each club's games in them. `fixture` loads a saved board. |
| Wipe | `wipe` | — | — | chrome, chrome-panel, chrome-hand, chrome-replay, rink, spot, strips, replay, panel, hand, board | `wipe` | Clean the screen. The roster stays cued; the read, the circle, and the replay are cleared. |

8 moves. Producer verbs (`ready`, `roll`, `caption`, `layer`) are designed but not built.
