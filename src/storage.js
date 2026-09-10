/** Storage failures (private mode, quota, blocked cookies) must never prevent play. */
export function createStorage(getStorage = () => globalThis.localStorage) {
  const normalizeDifficulty = value => ['rookie', 'pilot', 'ace'].includes(value) ? value : 'pilot';
  const session = new Map();
  const pending = new Set();
  const read = (key) => {
    if (pending.has(key)) return session.get(key);
    try { return getStorage().getItem(key) ?? session.get(key) ?? null; } catch { return session.get(key) ?? null; }
  };
  const write = (key, value) => {
    session.set(key, String(value));
    try { getStorage().setItem(key, String(value)); pending.delete(key); return true; }
    catch { pending.add(key); return false; }
  };
  return {
    best(difficulty) {
      const value = Number(read(`orbital.best.${normalizeDifficulty(difficulty)}`));
      return Number.isSafeInteger(value) && value >= 0 ? value : 0;
    },
    saveBest(difficulty, score) {
      const best = Math.max(this.best(difficulty), Number.isSafeInteger(score) && score >= 0 ? score : 0);
      write(`orbital.best.${normalizeDifficulty(difficulty)}`, best);
      return best;
    },
    sound: () => read('orbital.sound') === 'true',
    saveSound: (enabled) => write('orbital.sound', enabled === true),
    difficulty: () => { const value = read('orbital.difficulty'); return ['rookie', 'pilot', 'ace'].includes(value) ? value : 'pilot'; },
    saveDifficulty: (value) => write('orbital.difficulty', normalizeDifficulty(value)),
  };
}
