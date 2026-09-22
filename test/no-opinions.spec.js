// The screen has no opinions. Every text node a view renders is either a string from the read or a string from src/copy.js.
// If this fails, a view composed a sentence or derived a number. That belongs in CHIRP.
import { describe, it, expect } from 'vitest';
import { views } from '../src/views/index.js';
import { fixtures } from '../src/fixtures.js';
import { leaves } from '../src/copy.js';
import { states } from './states.js';

const UNESC = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
const textNodes = (markup) => [...markup.matchAll(/>([^<>]+)</g)]
  .map((m) => m[1].replace(/&(amp|lt|gt|quot|#39);/g, (e) => UNESC[e]).replace(/\s+/g, ' ').trim())
  .filter(Boolean);

function scalars(node, out = new Set()) {
  if (node === null) return out;
  if (Array.isArray(node)) node.forEach((v) => scalars(v, out));
  else if (typeof node === 'object') Object.values(node).forEach((v) => scalars(v, out));
  else out.add(String(node));
  return out;
}

const templates = leaves().map((s) => s.replace(/\s+/g, ' ')).map((s) => new RegExp('^' + s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{\w+\\\}/g, '.+?') + '$'));

describe('no opinions', () => {
  for (const [name, read] of Object.entries(fixtures)) {
    const allowed = scalars(read);
    allowed.add('the pen said so'); // the pen's own reason in the `worded` state
    for (const [label, state] of Object.entries(states(name, read))) {
      for (const [view, fn] of Object.entries(views)) {
        if (view === 'console') continue; // the transcript echoes what was said; test/console.spec.js holds it to exactly that (D19)
        it(`${view} over ${name} when ${label} shows only the read and the copy`, () => {
          const boardScalars = scalars(state.board ?? {});
          for (const text of textNodes(String(fn(state)))) {
            const ok = allowed.has(text) || boardScalars.has(text) || templates.some((re) => re.test(text));
            expect(ok, `"${text}" is not in the read or in copy.js`).toBe(true);
          }
        });
      }
    }
  }
});
