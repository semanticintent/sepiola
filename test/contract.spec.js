// Every fixture validates against the read contract, and the cross-field rules Ajv cannot express hold too.
import { describe, it, expect } from 'vitest';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import schema from '../contracts/read.schema.json';
import { fixtures } from '../src/fixtures.js';
import { check, checkRead, checkBoard } from '../src/contract.js';
import boardSchema from '../contracts/board.schema.json';
import { boards } from '../src/boards.js';

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);

describe('read contract', () => {
  it('has fixtures to check', () => expect(Object.keys(fixtures).length).toBeGreaterThan(1));

  for (const [name, read] of Object.entries(fixtures)) {
    describe(name, () => {
      it('validates against contracts/read.schema.json', () => {
        const ok = validate(read);
        expect(ok, JSON.stringify(validate.errors, null, 2)).toBe(true);
      });
      it('has one game bit and one label per day', () => {
        expect(read.window.labels).toHaveLength(read.window.days);
        for (const s of read.skaters) expect(s.games, s.id).toHaveLength(read.window.days);
      });
      it('only refers to skaters it contains', () => {
        const ids = new Set(read.skaters.map((s) => s.id));
        for (const list of Object.values(read.calls)) for (const id of list) expect(ids.has(id), id).toBe(true);
        for (const v of read.verdicts) for (const id of v.ids) expect(ids.has(id), id).toBe(true);
      });
    });
  }
});

// The page's own validator (src/contract.js) walks the same schema file. It must agree with Ajv.
const clone = (v) => JSON.parse(JSON.stringify(v));
const mutations = {
  'missing take': (r) => { delete r.take; },
  'wrong contract version': (r) => { r.contract_version = '0.2'; },
  'schedule_value over 100': (r) => { r.skaters[0].schedule_value = 101; },
  'schedule_value not an integer': (r) => { r.skaters[0].schedule_value = 50.5; },
  'bad flag': (r) => { r.skaters[0].flag = 'hot'; },
  'bad club': (r) => { r.skaters[0].club = 'Calgary'; },
  'extra top-level field': (r) => { r.opinion = 'start him'; },
  'extra skater field': (r) => { r.skaters[0].rank = 1; },
  'verdict with three ids': (r) => { r.verdicts[0].ids = ['a', 'b', 'c']; },
  'opp as a string': (r) => { r.games_in_hand.opp = '39'; },
  'empty analysis_id': (r) => { r.analysis_id = ''; },
  'bad date': (r) => { r.window.start = 'Monday'; },
};

describe('src/contract.js agrees with Ajv', () => {
  for (const [name, read] of Object.entries(fixtures)) {
    it(`accepts ${name}`, () => {
      expect(check(read)).toEqual([]);
      expect(checkRead(read)).toEqual([]);
    });
    for (const [label, mutate] of Object.entries(mutations)) {
      it(`rejects ${name} with ${label}, as Ajv does`, () => {
        const r = clone(read); mutate(r);
        expect(validate(r)).toBe(false);
        expect(check(r).length, check(r).join('; ')).toBeGreaterThan(0);
      });
    }
    it(`catches the cross-field rules Ajv cannot say, for ${name}`, () => {
      const short = clone(read); short.skaters[0].games = short.skaters[0].games.slice(1);
      expect(validate(short)).toBe(true);
      expect(checkRead(short).join()).toMatch(/one game bit per day/);
      const ghost = clone(read); ghost.calls.start = ['nobody'];
      expect(checkRead(ghost).join()).toMatch(/unknown skater nobody/);
    });
  }
  it('names the first problem in the analyst\'s terms', () => {
    expect(check({})).toContain('read.contract_version is missing');
    expect(check(null)).toEqual(['read must be object']);
  });
});

describe('board contract', () => {
  const validateBoard = ajv.compile(boardSchema);
  for (const [name, b] of Object.entries(boards)) {
    it(`${name} validates against contracts/board.schema.json, and the page agrees`, () => {
      expect(validateBoard(b), JSON.stringify(validateBoard.errors)).toBe(true);
      expect(checkBoard(b)).toEqual([]);
    });
    it(`${name}: the page's checker refuses what Ajv refuses`, () => {
      const bad = JSON.parse(JSON.stringify(b)); bad.positions.C[0].players[0].pos = 'QB';
      expect(validateBoard(bad)).toBe(false); expect(checkBoard(bad).length).toBeGreaterThan(0);
      const extra = JSON.parse(JSON.stringify(b)); extra.opinion = 'draft him';
      expect(validateBoard(extra)).toBe(false); expect(checkBoard(extra).length).toBeGreaterThan(0);
    });
  }
  it('the checker now understands anyOf (skater.nights)', () => {
    const r = JSON.parse(JSON.stringify(fixtures['cgy-week1'])); r.skaters[0].nights[1] = { opponent: 'nope', home: 1, difficulty: 500 };
    expect(validate(r)).toBe(false); expect(check(r).length).toBeGreaterThan(0);
  });
});
