// Boot. Wires the viewer's touches (open, close, drag, click a skater, press why, type a move) and exposes the one dispatch
// path as window.sepiola for the scenario runner and, later, WebMCP.
import './fonts.css';
import './tokens.css';
import './screen.css';
import { run, call, getState, touch, moves, restore, again } from './dispatch.js';
import { render } from './render.js';
import { settled } from './motion/runner.js';
import { open, close, move } from './state.js';
import { submit } from './talkback.js';
import { register } from './webmcp.js';
import { mode, analystUrl } from './analyst.js';
import { mountSignal } from './signal.js';
import { copy } from './copy.js';

render(getState());

// Menus close after a choice or a click elsewhere.
const closeMenus = (except) => document.querySelectorAll('details.menu[open]').forEach((d) => { if (d !== except) d.removeAttribute('open'); });

/** Open the About window at a section. Sections are addressable as #about, #quickStart, #privacy, #terms, #disclaimer, #credits. */
function showAbout(section) {
  touch((s) => open(s, 'about'));
  const target = document.getElementById(`about-${section}`);
  const body = document.querySelector('#w-about .about-body');
  if (target && body) body.scrollTop = target.offsetTop - body.offsetTop - 44; // scroll the window's body, never the desktop
  if (section && location.hash !== `#${section}`) history.replaceState(null, '', `#${section}`);
}
const ABOUT_SECTIONS = ['about', 'quickStart', 'privacy', 'terms', 'disclaimer', 'credits'];
const openFromHash = () => { const h = location.hash.replace(/^#/, ''); if (ABOUT_SECTIONS.includes(h)) showAbout(h); };
window.addEventListener('hashchange', openFromHash);
openFromHash();

// Viewer touches. A click on a skater on the ice circles him; a bench or IR chip, or a panel's "why", runs it back.
document.addEventListener('click', (e) => {
  const menu = e.target.closest('details.menu');
  closeMenus(e.target.closest('summary') ? menu : null);
  if (e.target.closest('.menu-list') && !e.target.closest('.signal-panel')) menu?.removeAttribute('open');
  const aboutLink = e.target.closest('.about-nav a');
  if (aboutLink) { e.preventDefault(); return showAbout(aboutLink.getAttribute('href').slice(1)); }
  const aboutOpener = e.target.closest('[data-open-about]');
  if (aboutOpener) return showAbout(aboutOpener.dataset.openAbout);
  if (e.target.closest('[data-sample]')) return (async () => { await run('cue_roster cgy-week1'); await run('read_ice'); })();
  if (e.target.closest('[data-paste]')) {
    touch((s) => open(s, 'paste'));
    document.getElementById('paste-in')?.focus({ preventScroll: true }); // never scroll the desktop
    return;
  }
  if (e.target.closest('[data-paste-sample]')) {
    const box = document.getElementById('paste-in');
    box.value = copy.paste.sample; box.focus({ preventScroll: true });
    return;
  }
  if (e.target.closest('[data-hand-toggle]')) return touch((s) => ({ ...s, handOpen: !s.handOpen }), ['hand']);
  const restoreBtn = e.target.closest('[data-restore]');
  if (restoreBtn) return restore(restoreBtn.dataset.restore);
  const againBtn = e.target.closest('[data-again]');
  if (againBtn) return again(againBtn.dataset.again);
  const weekBtn = e.target.closest('[data-week]');
  if (weekBtn) {
    const w = getState().read?.window;
    if (w?.[weekBtn.dataset.week]) run(`read_ice ${w.days} ${w[weekBtn.dataset.week]}`);
    return;
  }
  const opener = e.target.closest('[data-open]');
  if (opener) return touch((s) => open(s, opener.dataset.open));
  const closer = e.target.closest('[data-close]');
  if (closer) {
    // Closing About also drops the section hash, so a reload does not reopen it over the welcome card.
    if (closer.dataset.close === 'about' && location.hash) history.replaceState(null, '', location.pathname + location.search);
    return touch((s) => close(s, closer.dataset.close));
  }
  const why = e.target.closest('[data-replay]');
  if (why) return run(`replay ${why.dataset.replay}`);
  // The skater menu (D41): any skater, on the ice or on the bench, opens Spotlight · Run it back · Compare with…
  const menuBtn = e.target.closest('.skater-menu [data-act]');
  if (menuBtn) {
    const id = menuBtn.closest('.skater-menu').dataset.id;
    const act = menuBtn.dataset.act;
    if (act === 'compare') return touch((s) => ({ ...s, menu: null, pick: { a: id } }), ['menu', 'pick', 'focus', 'strips']);
    touch((s) => ({ ...s, menu: null }), ['menu', 'focus', 'strips']);
    return run(`${act} ${id}`);
  }
  if (e.target.closest('.pick-bar [data-act="cancel"]')) return touch((s) => ({ ...s, pick: null }), ['pick', 'focus', 'strips']);
  const picked = e.target.closest('svg [data-id], .chip[data-id]');
  if (picked) {
    const id = picked.dataset.id;
    const st = getState();
    if (st.pick && st.pick.a !== id) return run(`split ${st.pick.a} ${id}`);
    if (st.pick && st.pick.a === id) return;
    return touch((s) => ({ ...s, menu: { id, x: Math.min(e.clientX, window.innerWidth - 200), y: Math.min(e.clientY, window.innerHeight - 160) } }), ['menu', 'focus', 'strips']);
  }
  if (getState().menu && !e.target.closest('.skater-menu')) touch((s) => ({ ...s, menu: null }), ['menu', 'focus', 'strips']);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && (getState().menu || getState().pick)) return touch((s) => ({ ...s, menu: null, pick: null }), ['menu', 'pick', 'focus', 'strips']);
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('svg [data-id]')) {
    e.preventDefault();
    const r = e.target.getBoundingClientRect();
    touch((s) => ({ ...s, menu: { id: e.target.dataset.id, x: Math.round(r.left + r.width / 2), y: Math.round(r.bottom) } }), ['menu', 'focus', 'strips']);
  }
});

document.getElementById('week-in')?.addEventListener('change', (e) => {
  const w = getState().read?.window;
  if (e.target.value && w) run(`read_ice ${w.days} ${e.target.value}`);
});

// Talkback: one move per line, surnames allowed where an id is expected.
const cmd = document.getElementById('cmd');
const cmdIn = document.getElementById('cmd-in');
cmd?.addEventListener('submit', (e) => {
  e.preventDefault();
  const line = cmdIn.value.trim();
  if (!line) return;
  cmdIn.value = '';
  submit(line);
});

// Windows: raise on pointerdown, drag by the head. Positions live in state.windows.
for (const win of document.querySelectorAll('.win')) {
  const name = win.dataset.name;
  const head = win.querySelector('.head');
  let sx, sy, ox, oy, dragging = false;
  win.addEventListener('pointerdown', () => touch((s) => open(s, name)));
  head.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    dragging = true; sx = e.clientX; sy = e.clientY;
    const r = win.getBoundingClientRect(); ox = r.left; oy = r.top;
    head.setPointerCapture(e.pointerId);
  });
  head.addEventListener('pointermove', (e) => {
    if (dragging) touch((s) => move(s, name, ox + e.clientX - sx, Math.max(44, oy + e.clientY - sy)));
  });
  head.addEventListener('pointerup', () => { dragging = false; });
}

// Paste a lineup: the live path to cue_roster. In fixture mode the analyst line says what to do instead.
document.getElementById('paste-go')?.addEventListener('click', () => {
  const text = document.getElementById('paste-in').value.trim();
  const opponent_text = document.getElementById('opp-in')?.value.trim();
  if (text) call('cue_roster', opponent_text ? { text, opponent_text } : { text }, copy.console.pasted);
});

// The signal: whether an agent can reach the moves (WebMCP), and where the reads come from (the analyst).
const webmcp = register();
mountSignal({ webmcp, mode: mode(), url: analystUrl() });

window.sepiola = { ready: true, run, call, submit, restore, again, state: getState, settled, moves: moves(), webmcp, showAbout };
