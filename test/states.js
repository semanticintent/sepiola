// Every state a view can be asked to render, built from the fixtures through the real handlers. Shared by the specs.
import { initialState } from '../src/state.js';
import { findMove } from '../src/grammar.js';

export const onIce = (read) => read.skaters.find((s) => !['BN', 'IR'].includes(s.slot));

export function states(name, read) {
  const empty = initialState();
  const cued = findMove('cue_roster').handler(empty, { fixture: name, read }); // prepare() supplies read at runtime
  const iced = findMove('read_ice').handler(cued, {});
  const circled = findMove('circle').handler(iced, { ids: [onIce(read).id] });
  const worded = findMove('circle').handler(iced, { ids: [onIce(read).id], reason: 'the pen said so' });
  const wiped = findMove('wipe').handler(circled, {});
  const [a, b] = read.verdicts.find((v) => v.ids.length === 2)?.ids ?? [read.skaters[0].id, read.skaters[1].id];
  const replayed = findMove('replay').handler(iced, { id: a });
  const split = findMove('split').handler(iced, { a, b });
  const unmatched = findMove('split').handler(iced, { a: read.skaters.at(-1).id, b: read.skaters.at(-2).id });
  const cut = findMove('cut_to').handler(iced, { view: 'hand' });
  const readId = `${read.analysis_id}#1`;
  const logged = { ...iced, reads: [{ id: readId, read, name: 'read_ice', input: {}, line: 'read_ice', at: '2026-09-06T00:00:00Z' }], log: [{ line: 'read_ice', ack: { read: read.analysis_id }, readId }, { line: 'rank gridin', ack: { error: 'Unknown move "rank".' } }] };
  return { empty, cued, iced, circled, worded, wiped, replayed, split, unmatched, cut, logged };
}

