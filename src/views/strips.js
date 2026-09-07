// Under the rink: the legend, the bench, and the injured reserve. Renders into <div data-view="strips">.
import { html } from '../html.js';
import { copy } from '../copy.js';

const chip = (s, state) => html`<button class="chip${state.menu?.id === s.id || state.pick?.a === s.id ? ' focused' : ''}" data-id="${s.id}" title="${s.reason}"><b>${s.num ?? ''}</b>${s.name} <small>${s.pos}</small></button>`;

export function strips(state) {
  const read = state.read;
  if (!read) return html``;
  const bench = read.skaters.filter((s) => s.slot === 'BN');
  const ir = read.skaters.filter((s) => s.slot === 'IR');
  return html`<div class="legend">
      <span><span class="sw gloss"></span>${copy.legend.fresh}</span>
      <span><span class="sw chew"></span>${copy.legend.chewed}</span>
      <span>${copy.legend.badges} <b class="warn">${copy.glyph.warn}</b> ${copy.legend.flag} <b class="stream">${copy.glyph.stream}</b> ${copy.legend.stream}</span>
    </div>
    <div class="strips">
      <div class="strip"><h4>${copy.strips.bench}</h4><div class="chips">${bench.length ? bench.map((s) => chip(s, state)) : html`<span class="empty">${copy.strips.benchEmpty}</span>`}</div></div>
      <div class="strip ir"><h4>${copy.strips.ir}</h4><div class="chips">${ir.length ? ir.map((s) => chip(s, state)) : html`<span class="empty">${copy.strips.irEmpty}</span>`}</div></div>
    </div>`;
}
