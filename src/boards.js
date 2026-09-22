// Draft boards the screen can run without an analyst. Keyed by file name without extension.
const files = import.meta.glob('../fixtures/boards/*.json', { eager: true, import: 'default' });
export const boards = Object.fromEntries(Object.entries(files).map(([path, b]) => [path.split('/').pop().replace(/\.json$/, ''), b]));
