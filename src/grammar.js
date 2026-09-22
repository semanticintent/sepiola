// The only place a tool is defined. WebMCP registration, the console, the scenario runner, and docs/grammar.md derive from this array.
// Handlers are pure: (state, input) → state. They never touch the DOM. They throw MoveError with a line from copy when a move cannot be made.
import * as analyst from './analyst.js';
import { open, close, skater, prospect, verdictFor, WINDOWS } from './state.js';
import { copy, fill } from './copy.js';

export class MoveError extends Error {}
const refuse = (template, vars = {}) => { throw new MoveError(fill(template, vars)); };

export const grammar = [
  {
    name: 'cue_roster',
    move: 'Load the board',
    description: 'Load a roster onto the rink. Give `text`, the pasted lineup (any format, one player per line), when an analyst is configured; or `fixture`, the name of a read in fixtures/. `opponent_text`, the other side\'s lineup, gives games in hand its second bar.',
    input: { text: 'string?', fixture: 'string?', opponent_text: 'string?' },
    positional: ['fixture'],
    example: 'cue_roster cgy-week1',
    touches: ['chrome', 'chrome-panel', 'chrome-hand', 'chrome-replay', 'rink', 'spot', 'strips', 'panel', 'hand'],
    sequence: null,
    prepare: async (input) => ({ ...input, read: await analyst.read({ fixture: input.fixture, text: input.text, opponent_text: input.opponent_text }) }),
    handler(state, { read, fixture, text, opponent_text }) {
      const source = fixture ? { mode: 'fixture', fixture } : { mode: 'live', text, opponent_text: opponent_text || undefined };
      return close(close(open({ ...state, read, source, ice: false, circle: null, replay: null }, 'rink'), 'welcome'), 'paste');
    },
    ack: (s) => ({ cued: s.read.analysis_id, skaters: s.read.skaters.length }),
  },
  {
    name: 'read_ice',
    move: 'Read the ice',
    description: 'Reveal the read: ice quality under the skates, badges, the calls, games in hand. `start` (YYYY-MM-DD) moves the window; the analyst defaults to today.',
    input: { look_ahead_days: 'number?', start: 'string?' },
    positional: ['look_ahead_days', 'start'],
    example: 'read_ice 7 2026-10-05',
    touches: ['chrome', 'chrome-panel', 'chrome-hand', 'chrome-replay', 'rink', 'spot', 'strips', 'panel', 'hand', 'replay'], // every view that shows read data, so nothing stays on an old read
    sequence: 'read_ice',
    prepare: async (input, state) => (state.source?.mode === 'live'
      ? { ...input, read: await analyst.read({ text: state.source.text, opponent_text: state.source.opponent_text, look_ahead_days: input.look_ahead_days ?? 7, start: input.start }) }
      : input),
    handler(state, { read, look_ahead_days }) {
      if (!state.read) refuse(copy.errors.noRoster);
      if (look_ahead_days !== undefined && !(Number.isInteger(look_ahead_days) && look_ahead_days >= 1 && look_ahead_days <= 14)) {
        refuse(copy.errors.badDays, { example: 'read_ice 7 2026-10-05' });
      }
      return open(open(open({ ...state, read: read ?? state.read, ice: true }, 'hand'), 'panel'), 'rink');
    },
    ack: (s) => ({
      read: s.read.analysis_id,
      window: { start: s.read.window.start, end: s.read.window.end, days: s.read.window.days },
      calls: s.read.calls,
      games_in_hand: { you: s.read.games_in_hand.you, opp: s.read.games_in_hand.opp },
    }),
  },
  {
    name: 'circle',
    move: 'Circle him',
    description: 'Spotlight one skater with the reason pinned above. Without a reason, the analyst\'s own line is used.',
    input: { ids: 'id[]', reason: 'string?' },
    positional: ['ids[]', 'reason...'],
    example: 'circle zary 2 games, back-to-back',
    touches: ['spot', 'board'],
    sequence: 'circle',
    handler(state, { ids, reason }) {
      const id = (Array.isArray(ids) ? ids : [ids])[0];
      if (!skater(state, id) && prospect(state, id)) return open({ ...state, boardSpot: { id, reason: reason || null }, spotOn: 'board' }, 'board');
      const s = skater(state, id);
      if (!s || s.slot === 'BN' || s.slot === 'IR') refuse(copy.errors.unknownSkater, { id });
      return open({ ...state, circle: { id, reason: reason || null }, spotOn: 'rink' }, 'rink');
    },
    ack: (s) => (s.spotOn === 'board'
      ? { circled: s.boardSpot.id, on: 'board', reason: s.boardSpot.reason ?? prospect(s, s.boardSpot.id).note }
      : { circled: s.circle.id, reason: s.circle.reason ?? skater(s, s.circle.id).reason }),
  },
  {
    name: 'replay',
    move: 'Run it back',
    description: 'Stage the reasoning behind one skater: his week, the analyst\'s line, his projected points, and the call if the analyst made one.',
    input: { id: 'id' },
    positional: ['id'],
    example: 'replay gridin',
    touches: ['replay', 'chrome-replay'],
    sequence: 'replay',
    handler(state, { id }) {
      if (!skater(state, id) && prospect(state, id)) return open({ ...state, replay: { ids: [id], board: true } }, 'replay');
      if (!state.read) refuse(copy.errors.noRoster);
      if (!skater(state, id)) refuse(copy.errors.unknownId, { id });
      return open({ ...state, replay: { ids: [id] } }, 'replay');
    },
    ack: (s) => ({ replayed: s.replay.ids[0], verdict: verdictFor(s)?.line ?? null }),
  },
  {
    name: 'split',
    move: 'Split screen',
    description: 'Two skaters\' weeks side by side, then the analyst\'s call on who gets the start, if the analyst made one.',
    input: { a: 'id', b: 'id' },
    positional: ['a', 'b'],
    example: 'split gridin zary',
    touches: ['replay', 'chrome-replay'],
    sequence: 'replay',
    handler(state, { a, b }) {
      if (a === b) refuse(copy.errors.sameSkater);
      const onBoard = [a, b].map((id) => !skater(state, id) && !!prospect(state, id));
      if (onBoard[0] && onBoard[1]) return open({ ...state, replay: { ids: [a, b], board: true } }, 'replay');
      if (onBoard[0] || onBoard[1]) refuse(copy.errors.mixedSplit);
      if (!state.read) refuse(copy.errors.noRoster);
      for (const id of [a, b]) if (!skater(state, id)) refuse(copy.errors.unknownId, { id });
      return open({ ...state, replay: { ids: [a, b] } }, 'replay');
    },
    ack: (s) => ({ split: s.replay.ids, verdict: verdictFor(s)?.line ?? null }),
  },
  {
    name: 'cut_to',
    move: 'Cut to',
    description: 'Bring a window forward: rink, panel, hand, replay, or console.',
    input: { view: 'view' },
    positional: ['view'],
    example: 'cut_to panel',
    touches: [],
    sequence: null,
    handler(state, { view }) {
      if (!WINDOWS.includes(view)) refuse(copy.errors.unknownWindow, { view });
      return open(state, view);
    },
    ack: (s) => ({ cut_to: Object.entries(s.windows).sort((a, b) => b[1].z - a[1].z)[0][0] }),
  },
  {
    name: 'cue_board',
    move: 'Put up the board',
    description: 'Put up the draft board: the analyst\'s tiers by position from last season, one note per prospect, and where each position thins out. Give `drafted_text`, the players already taken (one per line, any format), and the analyst crosses them off. `fixture` loads a saved board.',
    input: { drafted_text: 'string?', fixture: 'string?' },
    positional: ['fixture'],
    example: 'cue_board board-sample',
    touches: ['board'],
    sequence: null,
    prepare: async (input) => ({ ...input, board: await analyst.board({ fixture: input.fixture, drafted_text: input.drafted_text }) }),
    handler(state, { board }) {
      return open({ ...state, board, boardSpot: null }, 'board');
    },
    ack: (s) => ({ board: s.board.generated_at, taken: s.board.taken, take: s.board.take }),
  },
  {
    name: 'wipe',
    move: 'Wipe',
    description: 'Clean the screen. The roster stays cued; the read, the circle, and the replay are cleared.',
    input: {},
    positional: [],
    touches: ['chrome', 'chrome-panel', 'chrome-hand', 'chrome-replay', 'rink', 'spot', 'strips', 'replay', 'panel', 'hand', 'board'],
    sequence: 'wipe',
    handler(state) {
      return { ...state, ice: false, circle: null, replay: null, boardSpot: null };
    },
    ack: () => ({ cleared: true }),
  },
];

export const findMove = (name) => grammar.find((g) => g.name === name);
