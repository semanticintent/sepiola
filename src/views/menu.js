// The skater menu: Spotlight, Run it back, Compare with… — the three moves a viewer makes about one skater, without ids.
// Renders into <div data-view="menu"> at the click position. Spotlight needs a spot on the ice; bench and IR only replay or compare.
import { html } from '../html.js';
import { copy } from '../copy.js';
import { skater, prospect } from '../state.js';

export function menu(state) {
  const m = state.menu;
  const s = m && (skater(state, m.id) ?? prospect(state, m.id));
  if (!s) return html``;
  const onIce = s.slot ? !['BN', 'IR'].includes(s.slot) : true; // a prospect is circled on the board
  return html`<div class="skater-menu" role="menu" style="left:${m.x}px; top:${m.y}px" data-id="${s.id}">
    <b>${s.name}</b>
    <button type="button" role="menuitem" data-act="circle" ${onIce ? '' : 'disabled'}>${copy.skaterMenu.spotlight}</button>
    <button type="button" role="menuitem" data-act="replay">${copy.skaterMenu.replay}</button>
    <button type="button" role="menuitem" data-act="compare">${copy.skaterMenu.compare}</button>
  </div>`;
}
