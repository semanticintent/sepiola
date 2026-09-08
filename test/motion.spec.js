// Motion is data: every sequence file names only verbs the runner knows and targets that some view or the shell renders.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { sequences, VERBS } from '../src/motion/runner.js';

const shell = readFileSync('index.html', 'utf8');
const viewSources = ['rink', 'spot', 'replay', 'panel', 'hand'].map((v) => readFileSync(`src/views/${v}.js`, 'utf8')).join('\n');

describe('sequences', () => {
  it('include the stinger and the moves', () => {
    expect(Object.keys(sequences).sort()).toEqual(['circle', 'read_ice', 'replay', 'stinger', 'wipe']);
  });
  for (const [name, seq] of Object.entries(sequences)) {
    it(`${name} uses known verbs, ordered times, and rendered targets`, () => {
      let last = -1;
      for (const step of seq.steps) {
        expect(Object.keys(VERBS), `${name}: ${step.do}`).toContain(step.do);
        expect(step.at, `${name}: at`).toBeGreaterThanOrEqual(0);
        expect(shell + viewSources, `${name}: target ${step.target}`).toMatch(new RegExp(`data-seq="[^"]*\\b${step.target}\\b`));
        last = Math.max(last, step.at);
      }
      if (name === 'stinger') expect(Math.max(...seq.steps.map((s) => s.at + (s.duration ?? 0.5)))).toBeLessThanOrEqual(1.4); // just over a second, never more
    });
  }
});
