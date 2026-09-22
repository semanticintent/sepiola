// The panel: the analyst's calls, each with his line, and the take. Renders into <div data-view="panel">.
// Row order is the analyst's (calls.start, sit, ir, stream). Nothing is ranked here.
import { html } from '../html.js';
import { copy } from '../copy.js';
import { skater } from '../state.js';

const ORDER = ['start', 'sit', 'ir', 'stream'];

export function panel(state) {
  const read = state.read;
  if (!read || !state.ice) return html`<p class="empty">${copy.panel.empty}</p>`;
  const rows = ORDER.flatMap((kind) => read.calls[kind].map((id) => skater(state, id)).filter(Boolean).map((s) => html`
    <div class="row" data-seq="call">
      <span class="tag ${kind}">${copy.panel[kind]}</span>
      <span><b>${s.name}</b><br><small>${kind === 'ir' && s.note ? s.note : s.reason}</small></span>
      <button class="why" data-replay="${s.id}">${copy.panel.why}</button>
    </div>`));
  return html`${rows}
    <p class="quote" data-seq="take">${read.take}</p>
    <details class="source"><summary>${copy.panel.source}</summary><span>${read.source.analyst}</span>${read.source.data.map((d) => html`<span>${d}</span>`)}</details>
    ${(read.notes ?? []).map((n) => html`<p class="note">${n}</p>`)}`;
}
