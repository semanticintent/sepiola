// The draft board (D48): the analyst's tiers per position, drafted players crossed off by the analyst, a circled prospect
// with its note, where each position thins out, and what the board cannot know. With the analyst's pick (D49), a strip
// names who to take next and those cards carry the pen's numbered marks, in the analyst's order. The screen ranks nothing.
import { html } from '../html.js';
import { copy, fill } from '../copy.js';

const POS = ['C', 'LW', 'RW', 'D', 'G'];

export function board(state) {
  const b = state.board;
  if (!b) return html`<p class="empty">${copy.board.empty}</p>`;
  const spot = state.boardSpot;
  const focus = new Set([state.menu?.id, state.pick?.a].filter(Boolean));
  const marks = new Map((b.pick?.picks ?? []).map((p, i) => [p.id, i + 1]));
  const row = (p) => html`<button type="button" class="prospect${p.taken ? ' taken' : ''}${spot?.id === p.id ? ' circled' : ''}${focus.has(p.id) ? ' focused' : ''}${marks.has(p.id) ? ' marked' : ''}" data-id="${p.id}"${marks.has(p.id) ? html` data-mark="${marks.get(p.id)}"` : ''} title="${p.note}">
      <span class="rk">${p.rank}</span><span class="nm">${p.name}</span><span class="cl">${p.club}</span>${p.flags.length ? html`<i class="flag" title="${p.flags[0]}">${copy.glyph.warn}</i>` : ''}
    </button>${spot?.id === p.id ? html`<p class="spot-note">${spot.reason ?? p.note}</p>` : ''}`;
  return html`${b.pick ? yourPick(b.pick) : ''}${b.scoring ? rankedFor(b.scoring) : ''}<p class="board-take">${b.take}</p>
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

/** What the analyst ranked for (D51): the league's categories as chips, and how, in its words. */
function rankedFor(scoring) {
  return html`<div class="ranked-for">
    <p class="cats"><span>${copy.board.rankedFor}</span>${scoring.categories.map((c) => html`<b>${c}</b>`)}</p>
    <details class="source"><summary>${copy.board.method}</summary><span>${scoring.method}</span>${scoring.too_few_games ? html`<span>${fill(copy.board.tooFew, { n: scoring.too_few_games })}</span>` : ''}</details>
  </div>`;
}

/** The analyst's pick, in its order. Numbers are drawn by CSS from each item's place, so the screen writes none. */
function yourPick(pick) {
  return html`<section class="your-pick">
    <h4>${fill(copy.board.pickHead, { on_clock: pick.on_clock })}</h4>
    <p class="pick-take">${pick.take}</p>
    ${pick.needs.length ? html`<p class="pick-needs"><span>${copy.board.needs}</span>${pick.needs.map((n) => html`<b>${n}</b>`)}</p>` : ''}
    <ol class="pick-list">${pick.picks.map((p) => html`<li>
      ${p.on_board
        ? html`<button type="button" class="pick-who" data-id="${p.id}"><span class="nm">${p.name}</span><span class="cl">${p.club}</span><span class="ps">${p.pos}</span></button>`
        : html`<span class="pick-who"><span class="nm">${p.name}</span><span class="cl">${p.club}</span><span class="ps">${p.pos}</span><i class="off">${copy.board.offBoard}</i></span>`}
      <span class="why">${p.why}</span>
    </li>`)}</ol>
  </section>`;
}
