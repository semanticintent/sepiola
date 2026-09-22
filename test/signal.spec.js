// The signal panel says only what copy says, plus the status values it was given.
import { describe, it, expect } from 'vitest';
import { pills, signalMarkup } from '../src/signal.js';
import { grammar } from '../src/grammar.js';

describe('signal', () => {
  it('names both sides and their states', () => {
    expect(pills({ webmcp: { available: true, registered: 7 }, mode: 'live', url: 'https://a.test', health: null })).toEqual({
      webmcp: { state: 'on', text: 'WebMCP · 7 tools' }, analyst: { state: 'on', text: 'Analyst · live' } });
    expect(pills({ webmcp: { available: false, registered: 0 }, mode: 'fixture', url: null, health: null })).toEqual({
      webmcp: { state: 'off', text: 'WebMCP · no agent here' }, analyst: { state: 'fixture', text: 'Analyst · fixtures' } });
    expect(pills({ webmcp: null, mode: 'live', url: 'https://a.test', health: 'down' }).analyst.state).toBe('down');
  });
  it('lists every move as a chip and reports health in the analyst\'s terms', () => {
    const m = String(signalMarkup({ webmcp: { available: true, registered: 7 }, mode: 'live', url: 'https://a.test', health: { analyst: 'chirp@4.3.0', season: '20262027', ms: 88 } }));
    for (const g of grammar) expect(m).toContain(`<code>${g.name}</code>`);
    expect(m).toContain('chirp@4.3.0 · season 20262027 · answered in 88 ms');
    expect(m).toContain('https://a.test');
    const withMcp = String(signalMarkup({ webmcp: null, mode: 'live', url: 'https://a.test', health: { analyst: 'chirp@4.4.0', season: '20262027', ms: 40, mcp: { endpoint: '/mcp', tools: 23, stateless: true } } }));
    expect(withMcp).toContain('23 tools at https://a.test/mcp');
    expect(String(signalMarkup({ webmcp: null, mode: 'fixture', url: null, health: null }))).toContain('Built-in reads. No network, no analyst.');
  });
});
