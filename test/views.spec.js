// Every view renders every fixture in every state without throwing, and renders the same state to the same markup.
import { describe, it, expect } from 'vitest';
import { views } from '../src/views/index.js';
import { fixtures } from '../src/fixtures.js';
import { grammar } from '../src/grammar.js';
import { esc } from '../src/html.js';
import { states, onIce } from './states.js';

describe('views', () => {
  for (const [name, read] of Object.entries(fixtures)) {
    for (const [label, state] of Object.entries(states(name, read))) {
      for (const [view, fn] of Object.entries(views)) {
        it(`${view} renders ${name} when ${label}, idempotently`, () => {
          const a = String(fn(state));
          const b = String(fn(state));
          expect(a).toBe(b);
        });
      }
    }
    it(`spot shows the pen's reason over ${name} when given one`, () => {
      const { worded, circled } = states(name, read);
      expect(String(views.spot(worded))).toContain('the pen said so');
      expect(String(views.spot(circled))).toContain(onIce(read).reason);
      expect(String(views.spot(circled))).toMatch(/data-hole="95"/); // a ring, not a mask (Safari)
      expect(String(views.spot(circled))).not.toContain('<mask');
    });
    it(`spot is empty over ${name} after a wipe`, () => {
      expect(String(views.spot(states(name, read).wiped))).toBe('');
    });
    it(`replay over ${name} shows the analyst's verdict for a known pair and none for an unknown one`, () => {
      const { split, unmatched, replayed } = states(name, read);
      const pair = read.verdicts.find((v) => v.ids.length === 2);
      if (pair) expect(String(views.replay(split))).toContain(pair.line);
      expect(String(views.replay(unmatched))).not.toContain('verdict-t');
      expect(String(views.replay(replayed)).match(/class="row"/g)).toHaveLength(1);
      expect(String(views.replay(split)).match(/class="row"/g)).toHaveLength(2);
      expect(String(views.replay(states(name, read).wiped))).toBe('');
      expect(String(views.replay(split))).toContain('data-seq="tile"'); // the runner's target, unescaped
    });
  }

  for (const [name, read] of Object.entries(fixtures)) {
    it(`panel over ${name} lists every call in the analyst's order and shows the take and the source`, () => {
      const out = String(views.panel(states(name, read).iced));
      const ids = ['start', 'sit', 'ir', 'stream'].flatMap((k) => read.calls[k]);
      const seen = [...out.matchAll(/data-replay="([^"]+)"/g)].map((m) => m[1]);
      expect(seen).toEqual(ids);
      expect(out).toContain(esc(read.take));
      for (const d of read.source.data) expect(out).toContain(d);
      for (const n of read.notes ?? []) expect(out).toContain(esc(n));
      expect(String(views.panel(states(name, read).cued))).not.toContain('data-replay');
    });
    it(`hand over ${name} draws one bar per known side`, () => {
      const out = String(views.hand(states(name, read).iced));
      expect(out.match(/data-seq="gih_bar"/g)).toHaveLength(read.games_in_hand.opp == null ? 1 : 2);
      expect(out).toContain(esc(read.games_in_hand.take));
    });
  }

  for (const [name, read] of Object.entries(fixtures)) {
    it(`skater menu over ${name} offers the three moves, spotlight only on the ice`, () => {
      const { menued, benchMenu, picking, iced } = states(name, read);
      const m = String(views.menu(menued));
      expect(m).toContain('data-act="circle"'); expect(m).toContain('data-act="replay"'); expect(m).toContain('data-act="compare"');
      expect(m).not.toMatch(/data-act="circle" disabled/);
      if (read.skaters.some((s) => s.slot === 'BN')) expect(String(views.menu(benchMenu))).toMatch(/data-act="circle" disabled/);
      expect(String(views.menu(iced))).toBe('');
      expect(String(views.pick(picking))).toContain('click another skater');
      expect(String(views.pick(iced))).toBe('');
    });
  }

  it('every move names only views that exist', () => {
    for (const g of grammar) for (const t of g.touches) expect(views, `${g.name} touches ${t}`).toHaveProperty(t);
  });
});
