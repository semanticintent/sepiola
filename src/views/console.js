// The producer's talkback: the transcript of every move made on this screen, by anyone, and the moves available.
// Renders into <div data-view="console">. This view echoes; it is the one view exempt from the no-opinions test (D19).
import { html } from '../html.js';
import { copy, fill } from '../copy.js';
import { grammar } from '../grammar.js';

export const hint = (g) => [g.name, ...g.positional.map((p) => `<${p.replace(/(\[\]|\.\.\.)$/, '')}>`)].join(' ');

export function consoleView(state) {
  const raw = (e) => html`<div class="in">&gt; ${e.line}</div><div class="${e.ack.error ? 'err' : 'ok'}">${e.ack.error ? `✗ ${e.ack.error}` : `✓ ${JSON.stringify(e.ack)}`}</div>`;
  const card = (e, r) => {
    const g = r.read.games_in_hand;
    const games = g.opp == null ? fill(copy.history.gamesSolo, { you: g.you }) : fill(copy.history.games, { you: g.you, opp: g.opp });
    return html`<div class="hist">
      <button type="button" class="hist-restore" data-restore="${r.id}"><b>${r.read.window.label ?? r.read.window.start}</b><small>${games}</small></button>
      <button type="button" class="hist-again" data-again="${r.id}">${copy.history.again}</button>
      <details class="hist-raw"><summary>${copy.history.raw}</summary>${raw(e)}</details>
    </div>`;
  };
  const lines = state.log.length
    ? state.log.map((e) => { const r = e.readId && state.reads.find((x) => x.id === e.readId); return r ? card(e, r) : raw(e); })
    : html`<div class="in">${copy.console.ready}</div>`;
  return html`<div class="log" aria-live="polite">${lines}</div>
    <div class="hint">${copy.console.hint} ${grammar.map((g) => html`<code>${hint(g)}</code>`)}</div>`;
}
