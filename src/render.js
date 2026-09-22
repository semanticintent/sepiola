// How data becomes pixels. Views are pure (state) → markup; render puts markup where it belongs.
// Only the views named in `touches` are rebuilt (D9). Window chrome (open, position, stacking) is applied on every render; it is cheap and non-destructive.
import { views } from './views/index.js';

export function render(state, touches = Object.keys(views)) {
  for (const name of touches) {
    const view = views[name];
    const host = document.querySelector(`[data-view="${name}"]`);
    if (view && host) host.innerHTML = String(view(state));
  }
  for (const [name, w] of Object.entries(state.windows)) {
    const win = document.querySelector(`.win[data-name="${name}"]`);
    if (!win) continue;
    win.classList.toggle('hidden', !w.open);
    // rank among the windows, not the raw counter: z grows every time a window is raised, and must never climb past the menubar
    win.style.zIndex = String(10 + Object.values(state.windows).filter((o) => o.z < w.z).length);
    if (w.x != null) Object.assign(win.style, { left: `${w.x}px`, top: `${w.y}px`, right: 'auto', bottom: 'auto', transform: 'none' });
  }
  const nav = document.querySelector('.week-nav');
  if (nav) {
    const w = state.read?.window;
    nav.hidden = !(state.source?.mode === 'live' && state.ice && w?.previous && w?.next);
    const input = nav.querySelector('input'); if (input && w?.start && input.value !== w.start) input.value = w.start;
  }
  const top = Object.entries(state.windows).filter(([, w]) => w.open).sort((a, b) => b[1].z - a[1].z)[0]?.[0];
  for (const win of document.querySelectorAll('.win')) win.classList.toggle('focus', win.dataset.name === top);
  for (const b of document.querySelectorAll('.dock [data-open]')) b.classList.toggle('open', !!state.windows[b.dataset.open]?.open);
}
