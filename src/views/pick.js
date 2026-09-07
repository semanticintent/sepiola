// The compare-in-progress banner over the rink: who was picked first, what to do next, and a way out.
import { html } from '../html.js';
import { copy, fill } from '../copy.js';
import { skater } from '../state.js';

export function pick(state) {
  const s = state.pick && skater(state, state.pick.a);
  if (!s) return html``;
  return html`<span>${fill(copy.pick.banner, { name: s.name })}</span><button type="button" data-act="cancel">${copy.pick.cancel}</button>`;
}
