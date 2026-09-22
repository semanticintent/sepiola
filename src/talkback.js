// The producer console's convenience layer. Not a tool, not registered with WebMCP (D3).
// A typed surname stands in for an id when it names exactly one skater in the read. Everything else passes through.
import { run, getState } from './dispatch.js';
import { findMove } from './grammar.js';
import { prospects } from './state.js';

const ID_TYPES = new Set(['id', 'id[]']);

export function resolve(line, state) {
  const [name, ...args] = line.trim().split(/\s+/);
  const move = findMove(name);
  const pool = [...(state.read?.skaters ?? []), ...prospects(state)];
  if (!move || !pool.length) return line.trim();
  const out = args.map((arg, i) => {
    const spec = move.positional[i];
    if (!spec || !ID_TYPES.has(move.input[spec.replace(/(\[\]|\.\.\.)$/, '')])) return arg;
    if (pool.some((s) => s.id === arg)) return arg;
    const hits = pool.filter((s) => s.name.toLowerCase() === arg.toLowerCase());
    return hits.length === 1 ? hits[0].id : arg;
  });
  return [name, ...out].join(' ');
}

export const submit = (line) => run(resolve(line, getState()));
