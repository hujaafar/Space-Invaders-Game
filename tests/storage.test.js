import test from 'node:test';
import assert from 'node:assert/strict';
import { createStorage } from '../src/storage.js';
function memory() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}
test('best scores are monotonic and isolated by difficulty', () => {
  const backend = memory(), storage = createStorage(() => backend);
  assert.equal(storage.best('pilot'), 0);
  storage.saveBest('pilot', 1234); storage.saveBest('pilot', 100);
  assert.equal(storage.best('pilot'), 1234); assert.equal(storage.best('ace'), 0);
});
test('unavailable storage does not throw and returns safe defaults', () => {
  const storage = createStorage(() => { throw new Error('Storage disabled'); });
  assert.equal(storage.best('pilot'), 0); assert.equal(storage.saveBest('pilot', 1234), 1234);
  assert.equal(storage.best('pilot'), 1234);
  assert.equal(storage.difficulty(), 'pilot'); assert.equal(storage.sound(), false);
  assert.equal(storage.saveSound(true), false);
});
test('corrupted stored values are sanitized', () => {
  const backend = memory(), storage = createStorage(() => backend);
  for (const value of ['garbage', '-10', 'Infinity', '1.2', '9999999999999999999999']) {
    backend.setItem('orbital.best.pilot', value); assert.equal(storage.best('pilot'), 0);
  }
  backend.setItem('orbital.difficulty', 'broken'); assert.equal(storage.difficulty(), 'pilot');
});
test('settings persist without enabling sound implicitly', () => {
  const backend = memory(), storage = createStorage(() => backend);
  assert.equal(storage.sound(), false); storage.saveSound(true); assert.equal(storage.sound(), true);
  storage.saveDifficulty('ace'); assert.equal(storage.difficulty(), 'ace');
});
