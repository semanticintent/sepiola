// The screen validates every read against contracts/read.schema.json before drawing it. This is a small validator that walks
// the schema file itself (the subset of JSON Schema the contract uses), so there is still one source of truth and no 120 kB
// dependency in the page. Tests hold it to agreement with Ajv.
import schema from '../contracts/read.schema.json';
import boardSchema from '../contracts/board.schema.json';

const kind = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);
const matches = (v, t) => (t === 'integer' ? Number.isInteger(v) : t === 'number' ? typeof v === 'number' : kind(v) === t);
const FORMATS = { date: /^\d{4}-\d{2}-\d{2}$/, 'date-time': /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/ };
const deref = (root, ref) => ref.replace(/^#\//, '').split('/').reduce((n, k) => n[k], root);

export function check(value, node = schema, path = 'read', out = [], root = schema) {
  if (node.$ref) node = deref(root, node.$ref);
  if (node.anyOf) {
    const passes = node.anyOf.some((alt) => check(value, alt, path, [], root).length === 0);
    if (!passes) out.push(`${path} matches none of the allowed shapes`);
    return out;
  }
  if ('const' in node && value !== node.const) out.push(`${path} must be ${JSON.stringify(node.const)}`);
  if (node.enum && !node.enum.includes(value)) out.push(`${path} must be one of ${node.enum.map((e) => JSON.stringify(e)).join(', ')}`);
  const types = [].concat(node.type ?? []);
  if (types.length && !types.some((t) => matches(value, t))) { out.push(`${path} must be ${types.join(' or ')}`); return out; }
  if (typeof value === 'number') {
    if (node.minimum != null && value < node.minimum) out.push(`${path} must be at least ${node.minimum}`);
    if (node.maximum != null && value > node.maximum) out.push(`${path} must be at most ${node.maximum}`);
  }
  if (typeof value === 'string') {
    if (node.minLength != null && value.length < node.minLength) out.push(`${path} must not be empty`);
    if (node.pattern && !new RegExp(node.pattern).test(value)) out.push(`${path} must match ${node.pattern}`);
    if (node.format && FORMATS[node.format] && !FORMATS[node.format].test(value)) out.push(`${path} must be a ${node.format}`);
  }
  if (Array.isArray(value)) {
    if (node.minItems != null && value.length < node.minItems) out.push(`${path} needs at least ${node.minItems} items`);
    if (node.maxItems != null && value.length > node.maxItems) out.push(`${path} allows at most ${node.maxItems} items`);
    if (node.uniqueItems && new Set(value.map((v) => JSON.stringify(v))).size !== value.length) out.push(`${path} must not repeat`);
    if (node.items) value.forEach((v, i) => check(v, node.items, `${path}[${i}]`, out, root));
  }
  if (kind(value) === 'object') {
    for (const k of node.required ?? []) if (!(k in value)) out.push(`${path}.${k} is missing`);
    for (const [k, v] of Object.entries(value)) {
      if (node.properties?.[k]) check(v, node.properties[k], `${path}.${k}`, out, root);
      else if (node.additionalProperties === false) out.push(`${path}.${k} is not in the contract`);
    }
  }
  return out;
}

/** Schema plus the cross-field rules the schema cannot say. Returns a list of problems; empty means drawable. */
export function checkRead(read) {
  const out = check(read);
  if (out.length) return out;
  const days = read.window.days;
  if (read.window.labels.length !== days) out.push('read.window.labels must have one label per day');
  const ids = new Set(read.skaters.map((s) => s.id));
  for (const s of read.skaters) if (s.games.length !== days) out.push(`read.skaters ${s.id} must have one game bit per day`);
  for (const [k, list] of Object.entries(read.calls)) for (const id of list) if (!ids.has(id)) out.push(`read.calls.${k} names an unknown skater ${id}`);
  for (const v of read.verdicts) for (const id of v.ids) if (!ids.has(id)) out.push(`read.verdicts names an unknown skater ${id}`);
  return out;
}

/** A draft board, checked against contracts/board.schema.json. Returns a list of problems; empty means drawable. */
export const checkBoard = (board) => check(board, boardSchema, 'board', [], boardSchema);
