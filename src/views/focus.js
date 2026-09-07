// The focus ring: which skater the open menu is about, and which was picked first in a compare. Its own SVG layer, so
// showing it never redraws the skaters. No text; the viewer already sees the name in the menu or the banner.
import { html } from '../html.js';
import { place } from '../layout.js';

export function focus(state) {
  const ids = [];
  if (state.pick?.a) ids.push({ id: state.pick.a, kind: 'picked' });
  if (state.menu?.id && state.menu.id !== state.pick?.a) ids.push({ id: state.menu.id, kind: 'menu' });
  if (!ids.length || !state.read) return html``;
  const spots = place(state.read);
  return html`${ids.map(({ id, kind }) => {
    const p = spots.get(id);
    return p ? html`<circle class="focus-ring ${kind}" data-id="${id}" cx="${p.x}" cy="${p.y + 8}" r="44" pointer-events="none"/>` : '';
  })}`;
}
