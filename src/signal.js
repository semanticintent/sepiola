// The signal panel: the two sides of the screen, as status. Pen (WebMCP tools in this browser) and analyst (the server
// that reads the ice). Shell chrome, not a view of the show: it reads the environment, not the read. Copy only.
import { html } from './html.js';
import { copy, fill } from './copy.js';
import { grammar } from './grammar.js';

/** @param {{ webmcp: {available:boolean, registered:number}|null, mode: 'live'|'fixture', url: string|null, health: null|'checking'|{analyst:string, season:string, ms:number}|'down' }} s */
export function pills(s) {
  const pen = copy.signal.pen; const an = copy.signal.analyst;
  const on = !!(s.webmcp?.available && s.webmcp.registered > 0);
  return {
    webmcp: { state: on ? 'on' : 'off', text: `${pen.pill} · ${on ? fill(pen.pillOn, { n: s.webmcp.registered }) : pen.pillOff}` },
    analyst: { state: s.mode === 'live' ? (s.health === 'down' ? 'down' : 'on') : 'fixture', text: `${an.pill} · ${s.mode === 'live' ? an.live : an.fixtures}` },
  };
}

export function signalMarkup(s) {
  const c = copy.signal; const p = pills(s);
  const healthLine = s.mode !== 'live' ? c.analyst.fixturesLine
    : s.health === 'checking' || s.health === null ? c.analyst.checking
    : s.health === 'down' ? c.analyst.down
    : fill(c.analyst.health, s.health);
  return html`<h4>${c.title}</h4>
    <p class="signal-line">${c.line}</p>
    <div class="signal-cards">
      <section class="signal-card">
        <h5><i class="dot ${p.webmcp.state}"></i>${c.pen.heading}</h5>
        <p>${c.pen.what}</p>
        <p class="status">${s.webmcp?.available && s.webmcp.registered > 0 ? fill(c.pen.on, { n: s.webmcp.registered }) : c.pen.off}</p>
        <div class="chips-row">${grammar.map((g) => html`<code>${g.name}</code>`)}</div>
      </section>
      <section class="signal-card">
        <h5><i class="dot ${p.analyst.state}"></i>${c.analyst.heading}</h5>
        <p>${c.analyst.what}</p>
        <p class="status">${s.mode === 'live' ? html`<span class="url">${s.url}</span><br>` : ''}${healthLine}</p>
        ${s.health?.mcp ? html`<p class="mcp-line">${fill(c.analyst.mcp, { tools: s.health.mcp.tools, endpoint: `${s.url}${s.health.mcp.endpoint}` })}</p>` : ''}
        <p class="hint-line">${c.analyst.hint}</p>
      </section>
    </div>
    <p class="signal-more"><button type="button" data-open-about="connect">${c.connect}</button><button type="button" data-open-about="about">${c.more}</button></p>`;
}

/** GET {url}/health and time it. Never throws. */
export async function checkHealth(url) {
  const t0 = performance.now();
  try {
    const res = await fetch(`${url}/health`);
    if (!res.ok) return 'down';
    const body = await res.json();
    return { analyst: body.analyst ? `${body.analyst}` : 'analyst', season: body.season ?? '—', ms: Math.round(performance.now() - t0), mcp: body.mcp ?? null };
  } catch { return 'down'; }
}

/** Wire the menubar pills and the panel. */
export function mountSignal({ webmcp, mode, url }) {
  const s = { webmcp: null, mode, url, health: null };
  const panel = document.getElementById('signal-panel');
  const pillEls = { webmcp: document.getElementById('pill-webmcp'), analyst: document.getElementById('pill-analyst') };
  const paint = () => {
    const p = pills(s);
    for (const k of ['webmcp', 'analyst']) {
      const el = pillEls[k]; if (!el) continue;
      el.querySelector('span').textContent = p[k].text;
      el.className = `pill ${p[k].state}`;
    }
    if (panel) panel.innerHTML = String(signalMarkup(s));
  };
  paint();
  webmcp.then((r) => { s.webmcp = r; paint(); });
  const details = panel?.closest('details');
  details?.addEventListener('toggle', async () => {
    if (!details.open || s.mode !== 'live' || (s.health && s.health !== 'down')) return;
    s.health = 'checking'; paint();
    s.health = await checkHealth(s.url); paint();
  });
  return { state: s, paint };
}
