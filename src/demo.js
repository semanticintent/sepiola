// Watch the pen (D45): the sample plays a short scripted run of real moves, the same ones an agent would make, with a caption per
// move. It is a viewer affordance, not a grammar verb: each step goes through run(), so the Talkback fills and every rule holds.
// Any skip, Escape, or pointer on the page ends it; a stopped run leaves the board as it is.
import { run, touch, getState } from './dispatch.js';
import { settled } from './motion/runner.js';

export const DEMO = [
  { line: 'circle zary', say: 'circle' },
  { line: 'replay zary', say: 'replay' },
  { line: 'split gridin zary', say: 'split' },
  { line: 'cut_to panel', say: 'panel' },
];

let token = 0;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const show = (demo) => touch((s) => ({ ...s, demo }), ['caption']);

export async function playDemo() {
  const mine = ++token;
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pause = reduced ? 900 : 2300;
  const total = DEMO.length;
  show({ step: 0, total, say: 'intro' });
  await wait(pause);
  for (let i = 0; i < total; i++) {
    if (mine !== token) return;
    show({ step: i + 1, total, say: DEMO[i].say });
    await run(DEMO[i].line);
    await settled();
    await wait(pause);
  }
  if (mine !== token) return;
  show({ step: total, total, say: 'done' });
  await wait(pause * 2);
  if (mine === token) stopDemo();
}

export function stopDemo() {
  token++;
  if (getState().demo) show(null);
}
