// Run it back: one or two skaters' weeks as day tiles, the analyst's line, the projected-points bar, and the analyst's
// closing verdict if there is one for exactly these ids. Renders into <svg data-view="replay">.
// Both bars are the same colour on purpose: the screen does not hint at who it favours (D6).
import { html } from '../html.js';
import { copy, fill } from '../copy.js';
import { skater, prospect, verdictFor } from '../state.js';

// layout constants only
const X0 = 10, TILE = 30, STEP = 40, ROW = 92, BAR_X = 380, BAR_W = 150, PTS_FULL = 6;
const SOFT = 40, HARD = 70; // the analyst's 0–100 difficulty, drawn as a tile edge; layout thresholds only
const edge = (n) => (!n || n.difficulty == null ? '' : n.difficulty < SOFT ? ' soft' : n.difficulty >= HARD ? ' hard' : '');

export function replay(state) {
  const r = state.replay;
  if (r?.board) return cards(state);
  if (!r || !state.read) return html``;
  const read = state.read;
  const rows = r.ids.map((id) => skater(state, id)).filter(Boolean);
  const verdict = verdictFor(state);

  const body = rows.map((s, i) => {
    const y0 = 30 + i * ROW;
    const w = Math.round(Math.min(BAR_W, (s.projected_pts / PTS_FULL) * BAR_W));
    return html`<g class="row" data-id="${s.id}">
      <text class="who" x="${X0}" y="${y0 - 4}"><tspan>${s.name}</tspan> <tspan class="who-num">${s.num ?? ''}</tspan></text>
      ${read.window.labels.map((label, d) => {
        const x = X0 + d * STEP;
        const game = s.games[d];
        const night = s.nights?.[d] ?? null;
        return html`<text class="rp-day" x="${x + TILE / 2}" y="${y0 + 12}">${label}</text>
          <rect class="tile${game ? ' game' : ''}${edge(night)}" data-seq="${game ? 'tile' : ''}" x="${x}" y="${y0 + 18}" width="${TILE}" height="${TILE}" rx="7"/>
          ${game ? html`<text class="tile-t${night ? ' opp' : ''}" data-seq="tile_t" x="${x + TILE / 2}" y="${y0 + 33}">${night ? night.opponent : copy.glyph.game}</text>` : ''}`;
      })}
      <text class="rsn" data-seq="count" x="${X0}" y="${y0 + 66}">${s.reason}</text>
      <rect class="track" x="${BAR_X}" y="${y0 + 22}" width="${BAR_W}" height="20" rx="10"/>
      <rect class="bar" data-seq="bar" data-to-width="${w}" x="${BAR_X}" y="${y0 + 22}" width="${w}" height="20" rx="10"/>
      <text class="pts" data-seq="pts" x="${BAR_X}" y="${y0 + 60}">${fill(copy.replay.pts, { pts: s.projected_pts })}</text>
    </g>`;
  });

  const vy = 30 + rows.length * ROW + 12;
  const hasNights = rows.some((s) => s.nights?.some(Boolean));
  const key = hasNights ? html`<text class="night-key" x="530" y="12"><tspan class="k-soft">${copy.replay.soft}</tspan><tspan dx="10" class="k-hard">${copy.replay.hard}</tspan></text>` : '';
  return html`${key}${body}${verdict ? html`<text class="verdict-t" data-seq="verdict" x="${X0}" y="${vy}">${verdict.line}</text>` : ''}`;
}

// Run it back on the draft board (D48): one card per prospect, every line the analyst's or a copy template over its values.
function cards(state) {
  const rows = state.replay.ids.map((id) => prospect(state, id)).filter(Boolean);
  return html`${rows.map((p, i) => {
    const y = 26 + i * 104;
    return html`<g class="card" data-id="${p.id}">
      <text class="who" x="${X0}" y="${y}">${p.name}</text>
      ${p.taken ? html`<text class="taken-t" x="530" y="${y}">${copy.board.taken}</text>` : ''}
      <text class="card-line" x="${X0}" y="${y + 20}">${fill(copy.board.card, { tier: p.tier, rank: p.rank, pos: p.pos, club: p.club })}</text>
      <text class="card-note" x="${X0}" y="${y + 40}">${p.note}</text>
      ${p.flags.map((f, k) => html`<text class="card-flag" x="${X0}" y="${y + 58 + k * 16}">${f}</text>`)}
    </g>`;
  })}`;
}
