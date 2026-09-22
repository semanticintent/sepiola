// The whole show as one plain object. Nothing lives in the DOM that is not derivable from here.
export const WINDOWS = ['rink', 'panel', 'hand', 'replay', 'console', 'board'];       // the pen's windows: cut_to can reach these
export const SHELL_WINDOWS = ['welcome', 'about', 'paste'];                           // the viewer's: menus and hashes open these

export function initialState() {
  return {
    read: null,      // the last Read (contracts/read.schema.json), or null
    source: null,    // { mode: 'fixture', fixture } | { mode: 'live', text } — where the read came from, so read_ice can re-read
    ice: false,      // has read_ice revealed it
    circle: null,    // { id, reason|null } | null — persists until wipe() or the next circle()
    replay: null,    // { ids } | null
    log: [],         // the talkback transcript: [{ line, ack, readId? }], appended by dispatch, never by a handler
    reads: [],       // the last reads kept for restore: [{ id, read, name, input, line, at }], appended by dispatch (D40)
    menu: null,      // { id, x, y } — the skater menu the viewer opened (D41)
    pick: null,      // { a } — a compare in progress: the first skater picked, waiting for the second (D41)
    handOpen: false, // the games-in-hand comparison is expanded (D42)
    stung: false,    // the stinger has played (or been cut) this visit (D43)
    demo: null,      // { step, total, say } while the sample's watch-the-pen run plays (D45)
    board: null,     // the last Board (contracts/board.schema.json), or null (D48)
    boardSpot: null, // { id, reason|null } — a prospect circled on the board (D48)
    spotOn: null,    // 'rink' | 'board' — where the last circle landed
    windows: Object.fromEntries([...WINDOWS, ...SHELL_WINDOWS].map((name, i) => [name, { open: name === 'rink' || name === 'console' || name === 'welcome', x: null, y: null, z: i }])),
  };
}

export const skater = (state, id) => state.read?.skaters.find((s) => s.id === id) ?? null;

/** Every prospect on the board, in board order. */
export const prospects = (state) => (state.board ? Object.values(state.board.positions).flatMap((tiers) => tiers.flatMap((t) => t.players.map((p) => ({ ...p, tier: t.tier })))) : []);
export const prospect = (state, id) => prospects(state).find((p) => p.id === id) ?? null;

/** The analyst's closing line for the current replay: the verdict whose ids equal replay.ids as a set, or null. */
export function verdictFor(state) {
  const ids = state.replay?.ids;
  if (!ids || !state.read) return null;
  return state.read.verdicts.find((v) => v.ids.length === ids.length && ids.every((id) => v.ids.includes(id))) ?? null;
}

export function open(state, name) {
  const z = Math.max(...Object.values(state.windows).map((w) => w.z)) + 1;
  return { ...state, windows: { ...state.windows, [name]: { ...state.windows[name], open: true, z } } };
}

export const close = (state, name) => ({ ...state, windows: { ...state.windows, [name]: { ...state.windows[name], open: false } } });

export const move = (state, name, x, y) => ({ ...state, windows: { ...state.windows, [name]: { ...state.windows[name], x, y } } });
