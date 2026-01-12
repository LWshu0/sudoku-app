import * as constants from '@sudoku/constants';

// Use a key in localStorage for creator archives. If the constants module
// doesn't provide STORAGE_KEY, fall back to a sensible default.
const STORAGE_KEY =
  constants && constants.STORAGE_KEY ? constants.STORAGE_KEY : 'sudoku.creator.v1';

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('creator.repository: failed to read storage', e);
    return [];
  }
}

function writeStorage(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('creator.repository: failed to write storage', e);
  }
}

export function list() {
  return readStorage();
}

export function save(entry) {
  const all = readStorage();
  const idx = all.findIndex((e) => e.id === entry.id);
  const now = Date.now();
  const toSave = {
    id: entry.id || (entry.id === 0 ? 0 : undefined),
    name: entry.name || 'Untitled',
    grid: entry.grid,
    givens: entry.givens,
    sencode: entry.sencode,
    createdAt: entry.createdAt || now,
    updatedAt: now,
    meta: entry.meta || {},
  };

  if (!toSave.id) {
    toSave.id = now.toString(36) + Math.random().toString(36).slice(2, 9);
    all.push(toSave);
  } else if (idx === -1) {
    all.push(toSave);
  } else {
    all[idx] = toSave;
  }

  writeStorage(all);
  return toSave.id;
}

export function load(id) {
  const all = readStorage();
  return all.find((e) => e.id === id) || null;
}

export function remove(id) {
  const all = readStorage().filter((e) => e.id !== id);
  writeStorage(all);
}

export function clearAll() {
  writeStorage([]);
}
