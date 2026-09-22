// The first thing a visitor sees when nothing is cued: what and why in one paragraph, then two doors (D45). Static copy only.
import { html } from '../html.js';
import { copy } from '../copy.js';

export function welcome(state) {
  if (state.read) return html``;
  const w = copy.welcome;
  return html`<p class="lead">${w.lead}</p>
    <div class="doors">
      <section class="door">
        <h3>${w.hockeyDoor}</h3>
        <button class="way" data-sample><b>${w.sample}</b><small>${w.sampleHint}</small></button>
        <button class="way" data-paste><b>${w.paste}</b><small>${w.pasteHint}</small></button>
        <button class="way" data-board><b>${w.board}</b><small>${w.boardHint}</small></button>
      </section>
      <section class="door">
        <h3>${w.buildDoor}</h3>
        <button class="way" data-open-about="connect"><b>${w.connect}</b><small>${w.connectHint}</small></button>
        <button class="way" data-open-about="about"><b>${w.learn}</b><small>${w.learnHint}</small></button>
      </section>
    </div>
    <p class="new-here"><button type="button" data-open-about="words">${w.newHere}</button></p>`;
}
