// Every state a view can be asked to render, built from the fixtures through the real handlers. Shared by the specs.
import { initialState } from '../src/state.js';
import { findMove } from '../src/grammar.js';
import { boards } from '../src/boards.js';

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
  const menued = { ...iced, menu: { id: onIce(read).id, x: 400, y: 300 } };
  const benchMenu = read.skaters.find((s) => s.slot === 'BN') ? { ...iced, menu: { id: read.skaters.find((s) => s.slot === 'BN').id, x: 10, y: 10 } } : menued;
  const picking = { ...iced, pick: { a: onIce(read).id } };
  const handOpen = { ...iced, handOpen: true };
  const demoing = { ...iced, demo: { step: 2, total: 4, say: 'replay' } };
  const B = boards['board-sample'];
  const boarded = findMove('cue_board').handler(iced, { board: B });
  const top = B.positions.C[0].players;
  const boardCircled = findMove('circle').handler(boarded, { ids: [top[2].id] });
  const boardCard = findMove('replay').handler(boarded, { id: top[2].id });
  const boardSplit = findMove('split').handler(boarded, { a: top[2].id, b: top[3].id });
  const P = boards['board-pick'];
  const boardPicked = findMove('cue_board').handler(iced, { board: P });
  const deep = { ...P, pick: { ...P.pick, picks: [...P.pick.picks.slice(0, 2), { id: '8470000', name: 'Sleeper', club: 'UTA', pos: 'LW', why: '180th best producer, 171 slots below this pick.', on_board: false }] } };
  const boardPickedDeep = findMove('cue_board').handler(iced, { board: deep });
  return { empty, cued, iced, circled, worded, wiped, replayed, split, unmatched, cut, logged, menued, benchMenu, picking, handOpen, demoing, boarded, boardCircled, boardCard, boardSplit, boardPicked, boardPickedDeep };
}

