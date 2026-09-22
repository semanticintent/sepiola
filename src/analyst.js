// The screen's only line to the analyst. Which analyst: ?analyst=<url> wins; ?analyst=fixtures forces fixture mode;
// window.SEPIOLA_ANALYST next; then the build's default (the hosted analyst in production builds, nothing in dev and
// tests). Same Read either way, and every live read is checked against the contract before a handler sees it. Nothing
// here imports from CHIRP (D1).
import { fixtures } from './fixtures.js';
import { checkRead, checkBoard } from './contract.js';
import { boards } from './boards.js';
import { copy, fill } from './copy.js';

export class AnalystError extends Error {}

const BUILD_DEFAULT = typeof __DEFAULT_ANALYST__ === 'string' ? __DEFAULT_ANALYST__ : '';

export function analystUrl() {
  try {
    const q = new URLSearchParams(globalThis.location?.search ?? '').get('analyst');
    if (q === 'fixtures') return null;
    return (q || globalThis.SEPIOLA_ANALYST || BUILD_DEFAULT || null)?.replace(/\/$/, '') ?? null;
  } catch { return null; }
}
export const mode = () => (analystUrl() ? 'live' : 'fixture');

/** Fetch a Read: from a fixture by name, or from the analyst with the pasted lineup. */
export async function read({ fixture, text, look_ahead_days = 7, opponent_text, start } = {}) {
  if (fixture) {
    const r = fixtures[fixture];
    if (!r) throw new AnalystError(fill(copy.errors.unknownFixture, { name: fixture }));
    return r;
  }
  if (!text) throw new AnalystError(copy.errors.needsRoster);
  const url = analystUrl();
  if (!url) throw new AnalystError(copy.errors.noAnalyst);
  let res;
  try {
    res = await fetch(`${url}/read`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ roster_text: text, look_ahead_days, opponent_text, start }) });
  } catch { throw new AnalystError(fill(copy.errors.analystDown, { url })); }
  if (!res.ok) throw new AnalystError(fill(copy.errors.analystDown, { url }));
  const body = await res.json().catch(() => null);
  const problems = checkRead(body ?? {});
  if (problems.length) throw new AnalystError(fill(copy.errors.badRead, { why: problems[0] }));
  return body;
}

/** Fetch a draft Board: a fixture by name, or the analyst's board with the drafted players crossed off (D48). */
export async function board({ fixture, drafted_text } = {}) {
  const url = analystUrl();
  if (fixture || !url) {
    if (drafted_text && !url) throw new AnalystError(copy.errors.noAnalyst);
    const b = boards[fixture ?? 'board-sample'];
    if (!b) throw new AnalystError(fill(copy.errors.unknownFixture, { name: fixture }));
    return b;
  }
  let res;
  try {
    res = await fetch(`${url}/board`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ drafted_text }) });
  } catch { throw new AnalystError(fill(copy.errors.analystDown, { url })); }
  if (!res.ok) throw new AnalystError(fill(copy.errors.analystDown, { url }));
  const body = await res.json().catch(() => null);
  const problems = checkBoard(body ?? {});
  if (problems.length) throw new AnalystError(fill(copy.errors.badRead, { why: problems[0] }));
  return body;
}
