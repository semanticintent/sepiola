// The watch-the-pen caption (D45): one line of copy per scripted move, progress dots, and a way out. Static copy only.
import { html } from '../html.js';
import { copy } from '../copy.js';

export function caption(state) {
  const d = state.demo;
  if (!d) return html``;
  const done = d.say === 'done';
  return html`<div class="caption" role="status">
    <span class="dots">${Array.from({ length: d.total }, (_, i) => html`<i class="${i < d.step ? 'on' : ''}"></i>`)}</span>
    <span class="say">${copy.demo[d.say]}</span>
    <button type="button" data-demo-skip>${done ? copy.demo.close : copy.demo.skip}</button>
  </div>`;
}
