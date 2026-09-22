// The draft board (D48): the analyst's tiers per position, drafted players crossed off by the analyst, a circled prospect
// with its note, where each position thins out, and what the board cannot know. The screen ranks nothing.
import { html } from '../html.js';
import { copy, fill } from '../copy.js';

const POS = ['C', 'LW', 'RW', 'D', 'G'];

export function board(state) {
  const b = state.board;
  if (!b) return html`<p class="empty">${copy.board.empty}</p>`;
  const spot = state.boardSpot;
  const focus = new Set([state.menu?.id, state.pick?.a].filter(Boolean));
  const row = (p) => html`<button type="button" class="prospect${p.taken ? ' taken' : ''}${spot?.id === p.id ? ' circled' : ''}${focus.has(p.id) ? ' focused' : ''}" data-id="${p.id}" title="${p.note}">
      <span class="rk">${p.rank}</span><span class="nm">${p.name}</span><span class="cl">${p.club}</span>${p.flags.length ? html`<i class="flag" title="${p.flags[0]}">${copy.glyph.warn}</i>` : ''}
    </button>${spot?.id === p.id ? html`<p class="spot-note">${spot.reason ?? p.note}</p>` : ''}`;
  return html`<p class="board-take">${b.take}</p>
    <div class="board-cols">${POS.map((pos) => html`<section class="board-col">
      <h4>${pos}</h4>
      ${b.positions[pos].map((t) => html`<div class="tier"><span class="tier-label">${fill(copy.board.tier, { tier: t.tier })}</span>${t.players.map(row)}</div>`)}
      <p class="dries">${b.dries_up[pos]}</p>
    </section>`)}</div>
    <div class="board-foot">
      <details class="source"><summary>${copy.board.unknowns}</summary>${b.not_included.map((n) => html`<span>${n}</span>`)}</details>
      <details class="source"><summary>${copy.panel.source}</summary><span>${b.source.analyst}</span>${b.source.data.map((d) => html`<span>${d}</span>`)}</details>
      ${(b.notes ?? []).map((n) => html`<p class="note">${n}</p>`)}
    </div>`;
}
