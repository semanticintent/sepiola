// Every view renders every fixture in every state without throwing, and renders the same state to the same markup.
import { describe, it, expect } from 'vitest';
import { views } from '../src/views/index.js';
import { fixtures } from '../src/fixtures.js';
import { grammar, findMove } from '../src/grammar.js';
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
    it(`hand over ${name} draws one bar per known side, and opens to the analyst's tallies`, () => {
      const out = String(views.hand(states(name, read).iced));
      expect(out.match(/data-seq="gih_bar"/g)).toHaveLength(read.games_in_hand.opp == null ? 1 : 2);
      expect(out).toContain(esc(read.games_in_hand.take));
      expect(out).not.toContain('class="tally"');
      const open = String(views.hand(states(name, read).handOpen));
      const d = read.games_in_hand.detail;
      expect(open.match(/<tr><td>/g)).toHaveLength(d.you.length + (d.opp?.length ?? 0));
      expect(open).toContain(esc(read.games_in_hand.counted));
      expect(open.match(/<caption>/g)).toHaveLength(d.opp ? 2 : 1);
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
      expect(String(views.focus(menued))).toContain(`class="focus-ring menu" data-id="${onIce(read).id}"`);
      expect(String(views.focus(picking))).toContain('focus-ring picked');
      expect(String(views.focus(iced))).toBe('');
      if (read.skaters.some((s) => s.slot === 'BN')) expect(String(views.strips(benchMenu))).toContain('chip focused');
    });
  }

  it('replay tiles carry the opponent and a soft/hard edge when the read has nights', () => {
    const read = fixtures['cgy-week1'];
    const st = states('cgy-week1', read);
    const wolf = findMove('replay').handler(st.iced, { id: 'wolf' });
    const m = String(views.replay(wolf));
    expect(m).toContain('>SJS<'); expect(m).toMatch(/class="tile game soft"/); // Wolf: SJS is a soft night for a goalie
    expect(String(views.replay(findMove('replay').handler(st.iced, { id: 'gridin' })))).toMatch(/class="tile game hard"/); // Gridin: SJS defends well against skaters
    expect(m).toContain('soft night');
    const thin = String(views.replay(findMove('replay').handler(states('thin-week-no-opp', fixtures['thin-week-no-opp']).iced, { id: 'wolf' })));
    expect(thin).not.toContain('soft night'); // no nights in that read, no key
  });
  it('the board draws tiers, crosses off the drafted, circles with the note, and runs prospects back as cards', () => {
    const [name, read] = Object.entries(fixtures)[0];
    const st = states(name, read);
    const B = st.boarded.board;
    const m = String(views.board(st.boarded));
    for (const pos of ['C', 'LW', 'RW', 'D', 'G']) expect(m).toContain(`<h4>${pos}</h4>`);
    expect(m.match(/class="prospect taken/g)).toHaveLength(B.taken);
    expect(m).toContain(esc(B.take));
    const top = B.positions.C[0].players;
    expect(String(views.board(st.boardCircled))).toContain(`class="spot-note">${esc(top[2].note)}`);
    const card = String(views.replay(st.boardCard));
    expect(card).toContain(`Tier 1 · rank ${top[2].rank} · C · ${top[2].club}`);
    expect(String(views.replay(st.boardSplit)).match(/class="card"/g)).toHaveLength(2);
    expect(String(views.chromeReplay ? '' : '')).toBe('');
    expect(String(views.board(st.iced))).toContain('No board yet');
  });
  it('split refuses one player from the rink and one from the board', () => {
    const [name, read] = Object.entries(fixtures)[0];
    const st = states(name, read);
    const p = st.boarded.board.positions.C[0].players[2].id;
    expect(() => findMove('split').handler(st.boarded, { a: 'gridin', b: p })).toThrow(/same place/);
  });
  it('caption shows the step and a way out only while the demo plays', () => {
    const [name, read] = Object.entries(fixtures)[0];
    const { demoing, iced } = states(name, read);
    const m = String(views.caption(demoing));
    expect(m).toContain('Run it back.'); expect(m).toContain('data-demo-skip');
    expect(m.match(/<i class="on">/g)).toHaveLength(2);
    expect(String(views.caption(iced))).toBe('');
  });
  it('welcome has two doors and the connect section carries a command', () => {
    const w = String(views.welcome(states(...Object.entries(fixtures)[0]).empty));
    expect(w).toContain('I play fantasy hockey'); expect(w).toContain('I build with agents');
    expect(w).toContain('data-open-about="connect"');
    expect(String(views.about())).toContain('claude mcp add --transport http chirp');
  });

  it('every move names only views that exist', () => {
    for (const g of grammar) for (const t of g.touches) expect(views, `${g.name} touches ${t}`).toHaveProperty(t);
  });
});
