// The console echoes and nothing more: every text node is a transcript line, an ack, a hint derived from the grammar, or copy.
// And talkback's surname convenience does exactly one thing.
import { describe, it, expect } from 'vitest';
import { views } from '../src/views/index.js';
import { hint } from '../src/views/console.js';
import { grammar } from '../src/grammar.js';
import { leaves, copy, fill } from '../src/copy.js';
import { fixtures } from '../src/fixtures.js';
import { resolve } from '../src/talkback.js';
import { states } from './states.js';

const textNodes = (markup) => [...markup.matchAll(/>([^<>]+)</g)].map((m) => m[1].replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()).filter(Boolean);

describe('console', () => {
  for (const [name, read] of Object.entries(fixtures)) {
    it(`over ${name} shows only the transcript, the hints, and the copy`, () => {
      const state = states(name, read).logged;
      const allowed = new Set([...leaves(), ...grammar.map(hint)]);
      for (const e of state.log) { allowed.add(`> ${e.line}`); allowed.add(e.ack.error ? `✗ ${e.ack.error}` : `✓ ${JSON.stringify(e.ack)}`); }
      for (const r of state.reads) {
        allowed.add(r.read.window.label ?? r.read.window.start);
        const g = r.read.games_in_hand;
        allowed.add(g.opp == null ? fill(copy.history.gamesSolo, { you: g.you }) : fill(copy.history.games, { you: g.you, opp: g.opp }));
      }
      for (const t of textNodes(String(views.console(state)))) expect(allowed.has(t), `"${t}"`).toBe(true);
    });
  }
  it('renders a remembered read as a card with restore and run-again controls', () => {
    const [name, read] = Object.entries(fixtures)[0];
    const m = String(views.console(states(name, read).logged));
    expect(m).toContain(`data-restore="${read.analysis_id}#1"`);
    expect(m).toContain(`data-again="${read.analysis_id}#1"`);
    expect(m).toContain(read.window.label);
    expect(m).toContain('vs 39 games');
  });
  it('shows the ready line before anything has been said', () => {
    const [name, read] = Object.entries(fixtures)[0];
    expect(String(views.console(states(name, read).empty))).toContain('Talkback ready');
  });
});

describe('talkback', () => {
  const [name, read] = Object.entries(fixtures)[0];
  const state = states(name, read).iced;
  const some = read.skaters[0];
  it('swaps a unique surname for its id where an id is expected', () => {
    expect(resolve(`circle ${some.name.toUpperCase()}`, state)).toBe(`circle ${some.id}`);
    expect(resolve(`split ${some.name} ${read.skaters[1].name}`, state)).toBe(`split ${some.id} ${read.skaters[1].id}`);
  });
  it('leaves ids, reasons, and unknown names alone', () => {
    expect(resolve(`circle ${some.id} ${some.name} is the whole argument`, state)).toBe(`circle ${some.id} ${some.name} is the whole argument`);
    expect(resolve('circle Nobody', state)).toBe('circle Nobody');
    expect(resolve('cut_to panel', state)).toBe('cut_to panel');
    expect(resolve('rank Gridin', state)).toBe('rank Gridin');
  });
  it('does nothing before a roster is cued', () => {
    expect(resolve(`circle ${some.name}`, states(name, read).empty)).toBe(`circle ${some.name}`);
  });
});
