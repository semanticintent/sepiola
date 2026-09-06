// The whole show as one plain object. Nothing lives in the DOM that is not derivable from here.
export const WINDOWS = ['rink', 'panel', 'hand', 'replay', 'console'];       // the pen's windows: cut_to can reach these
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
    windows: Object.fromEntries([...WINDOWS, ...SHELL_WINDOWS].map((name, i) => [name, { open: name === 'rink' || name === 'console' || name === 'welcome', x: null, y: null, z: i }])),
  };
}

export const skater = (state, id) => state.read?.skaters.find((s) => s.id === id) ?? null;

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
