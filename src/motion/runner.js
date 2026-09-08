// The only file that talks to GSAP. Sequences are data (./sequences/*.json); this interprets a small fixed vocabulary of `do` verbs.
// Targets are `data-seq` names on elements the views rendered in their final state. Reduced motion runs everything at duration zero.
import { gsap } from 'gsap';

const files = import.meta.glob('./sequences/*.json', { eager: true, import: 'default' });
export const sequences = Object.fromEntries(Object.entries(files).map(([p, s]) => [p.split('/').pop().replace(/\.json$/, ''), s]));

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Each verb: (timeline, elements, step) → adds tweens at step.at. Durations already scaled.
export const VERBS = {
  reveal: (tl, els, s) => tl.fromTo(els, { opacity: 0 }, { opacity: 1, duration: s.duration, ease: s.ease, stagger: s.stagger }, s.at),
  fade_in: (tl, els, s) => tl.fromTo(els, { opacity: 0 }, { opacity: 1, duration: s.duration, ease: s.ease }, s.at),
  fade_out: (tl, els, s) => tl.to(els, { opacity: 0, duration: s.duration, ease: s.ease }, s.at),
  dim: (tl, els, s) => tl.to(els, { opacity: 0.35, duration: s.duration, ease: s.ease }, s.at),
  // End values come from data-* (D8), never from the live attribute: GSAP applies the from-values before it resolves
  // function-based to-values, so reading the attribute would sweep from the start value to itself.
  sweep: (tl, els, s) => tl.fromTo(els, { attr: { r: (i, el) => +(el.dataset.fromR ?? 0) } }, { attr: { r: (i, el) => +(el.dataset.toR ?? el.getAttribute('r')) }, duration: s.duration, ease: s.ease, stagger: s.stagger }, s.at),
  fill: (tl, els, s) => tl.fromTo(els, { attr: { width: 0 } }, { attr: { width: (i, el) => +el.dataset.toWidth }, duration: s.duration, ease: s.ease, stagger: s.stagger }, s.at),
  flip: (tl, els, s) => tl.fromTo(els, { scale: 0.6, opacity: 0, transformOrigin: '50% 50%' }, { scale: 1, opacity: 1, duration: s.duration, ease: s.ease, stagger: s.stagger }, s.at),
  count_up: (tl, els, s) => els.forEach((el, i) => {
    const to = +el.textContent; const o = { v: 0 };
    tl.to(o, { v: to, duration: s.duration, ease: s.ease, onUpdate: () => { el.textContent = String(Math.round(o.v)); } }, s.at + i * s.stagger);
  }),
  // a band crossing the screen, like the passing cloud across a cuttlefish's mantle
  sweep_x: (tl, els, s) => tl.fromTo(els, { xPercent: -140 }, { xPercent: 160, duration: s.duration, ease: s.ease, stagger: s.stagger }, s.at),
  // windows arriving: opacity only, never a transform, so centred windows keep their own transform
  settle: (tl, els, s) => tl.fromTo(els, { opacity: 0 }, { opacity: 1, duration: s.duration, ease: s.ease, stagger: s.stagger }, s.at),
  drop: (tl, els, s) => tl.fromTo(els, { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: s.duration, ease: s.ease, stagger: s.stagger }, s.at),
};

let active = [];
const byName = new Map();

export function play(name, root = document) {
  const seq = sequences[name];
  if (!seq) return null;
  const k = reduced() ? 0 : 1;
  const tl = gsap.timeline();
  for (const step of seq.steps) {
    const els = [...root.querySelectorAll(`[data-seq~="${step.target}"]`)];
    const verb = VERBS[step.do];
    if (!els.length || !verb) continue;
    verb(tl, els, { ...step, at: (step.at ?? 0) * k, duration: (step.duration ?? 0.5) * k, stagger: (step.stagger ?? 0) * k, ease: step.ease ?? 'power2.out' });
  }
  active.push(tl); byName.set(name, tl);
  tl.then(() => { active = active.filter((t) => t !== tl); if (byName.get(name) === tl) byName.delete(name); });
  return tl;
}

/** Cut a running sequence straight to its end state. Returns true if it was running. */
export function cut(name) {
  const tl = byName.get(name);
  if (!tl) return false;
  tl.progress(1).kill();
  active = active.filter((t) => t !== tl); byName.delete(name);
  return true;
}

/** Resolves when every running sequence has finished. The scenario runner screenshots after this. */
export const settled = () => Promise.all(active.map((t) => t.then())).then(() => undefined);
