// About, quick start, privacy, terms, disclaimer, credits: one scrollable window, each section addressable by #hash.
import { html } from '../html.js';
import { copy } from '../copy.js';

export const SECTIONS = Object.keys(copy.about.sections);

export function about() {
  const s = copy.about.sections;
  return html`<nav class="about-nav">${SECTIONS.map((k) => html`<a href="#${k}">${s[k].heading}</a>`)}</nav>
    ${SECTIONS.map((k) => html`<section id="about-${k}" class="about-section">
      <h3>${s[k].heading}</h3>
      ${s[k].paras && !s[k].steps ? s[k].paras.map((t) => html`<p>${t}</p>`) : ''}
      ${s[k].steps ? html`<ol>${s[k].steps.map((t) => html`<li>${t}</li>`)}</ol>` : ''}
      ${s[k].code ? html`<pre class="about-code"><code>${s[k].code}</code></pre>` : ''}
      ${s[k].paras && s[k].steps ? s[k].paras.map((t) => html`<p>${t}</p>`) : ''}
    </section>`)}`;
}
