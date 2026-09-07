// Tools flow one way: input → handler → new state → render(touches) → runner.play(sequence) → ack.
// This is the single path every caller uses: the scenario runner, the console (S3), WebMCP (S4), and the viewer's own touches.
import { initialState, open } from './state.js';
import { grammar, findMove, MoveError } from './grammar.js';
import { AnalystError } from './analyst.js';
import { copy, fill } from './copy.js';
import { render } from './render.js';
import { play } from './motion/runner.js';

let state = initialState();
export const getState = () => state;

const describe = (name, input) => `${name} ${JSON.stringify(input)}`.slice(0, 160);

/** Make a move by name with a structured input. Returns the ack, or { error } with a line from copy.
 *  Every call, from any caller, lands in the transcript (state.log) and re-renders the console. */
export async function call(name, input = {}, line = describe(name, input)) {
  const move = findMove(name);
  let ack = null;
  const before = state.read;
  if (state.menu || state.pick) { state = { ...state, menu: null, pick: null }; render(state, ['menu', 'pick']); } // a move settles any open menu or pick
  if (!move) ack = { error: fill(copy.errors.unknownMove, { name }) };
  else {
    try {
      if (move.prepare) input = await move.prepare(input, state); // the one impure step: fetch from the analyst (D22)
      state = move.handler(state, input);
    } catch (e) {
      if (e instanceof MoveError || e instanceof AnalystError) ack = { error: e.message };
      else throw e;
    }
  }
  ack ??= move.ack(state);
  // A move that produced a new read is remembered, so the viewer can restore it or run it again (D40).
  let readId = null;
  if (!ack.error && state.read && state.read !== before) {
    readId = `${state.read.analysis_id}#${state.reads.length + 1}`;
    state = { ...state, reads: [...state.reads, { id: readId, read: state.read, name, input, line, at: new Date().toISOString() }].slice(-20) };
  }
  state = { ...state, log: [...state.log, readId ? { line, ack, readId } : { line, ack }].slice(-200) };
  render(state, [...(ack.error ? [] : move.touches), 'console']);
  if (!ack.error && move.sequence) play(move.sequence);
  return ack;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse one line of a scenario or console script: `circle zary 2 games, back-to-back`.
 * A token that is not a number where a number is expected slides to the next positional when it fits there
 * (`read_ice 2026-10-05` reads the week starting that day); otherwise the line is refused with the move's example.
 */
export function parseLine(line) {
  const [name, ...args] = line.trim().split(/\s+/);
  const move = findMove(name);
  const input = {};
  if (!move) return { name, input };
  let i = 0;
  for (let p = 0; p < move.positional.length; p++) {
    const spec = move.positional[p];
    const key = spec.replace(/(\[\]|\.\.\.)$/, '');
    const type = move.input[key] ?? 'string';
    if (spec.endsWith('...')) { const rest = args.slice(i).join(' '); if (rest) input[key] = rest; i = args.length; break; }
    const value = args[i];
    if (value === undefined || value === '') break;
    if (type.startsWith('number')) {
      if (!/^-?\d+(\.\d+)?$/.test(value)) {
        const next = move.positional[p + 1];
        if (next && DATE.test(value)) continue; // slide: this token belongs to the next positional
        return { name, input, error: fill(copy.errors.expectedNumber, { key, example: move.example ?? name }) };
      }
      input[key] = Number(value);
    } else {
      input[key] = spec.endsWith('[]') ? [value] : value;
    }
    i++;
  }
  return { name, input };
}

/** A line the parser refused still lands in the transcript, as an error, so the viewer sees what was said and why it did not run. */
function refuseLine(line, error) {
  const ack = { error };
  state = { ...state, log: [...state.log, { line, ack }].slice(-200) };
  render(state, ['console']);
  return ack;
}

/** Put a remembered read back on the board. A viewer touch: no analyst, no network; the transcript says it happened. */
export function restore(id) {
  const entry = state.reads.find((r) => r.id === id);
  if (!entry) return refuseLine(`restore ${id}`, copy.history.gone);
  const move = findMove('read_ice');
  state = open(open(open({ ...state, read: entry.read, ice: true, replay: null }, 'hand'), 'panel'), 'rink');
  const label = entry.read.window.label ?? entry.read.window.start;
  const ack = { restored: id, window: { start: entry.read.window.start, end: entry.read.window.end, days: entry.read.window.days } };
  state = { ...state, log: [...state.log, { line: fill(copy.history.restored, { label }), ack }].slice(-200) };
  render(state, [...move.touches, 'console']);
  play(move.sequence);
  return ack;
}

/** Re-issue the move that produced a remembered read, for a fresh read of the same week. */
export function again(id) {
  const entry = state.reads.find((r) => r.id === id);
  if (!entry) return Promise.resolve(refuseLine(`again ${id}`, copy.history.gone));
  return call(entry.name, entry.input, entry.line);
}

export const run = (line) => {
  const { name, input, error } = parseLine(line);
  if (error) return Promise.resolve(refuseLine(line.trim(), error));
  return call(name, input, line.trim());
};

/** A viewer's touch (open, close, drag) is a state change that is not a move. It renders chrome only. */
export function touch(fn, views = []) {
  state = fn(state);
  render(state, views);
}

export const moves = () => grammar.map((g) => g.name);
