import test from 'node:test';
import assert from 'node:assert/strict';
import { ArcadeAudio } from '../src/audio.js';
test('muting cancels every active or scheduled voice', () => {
  const audio = new ArcadeAudio(); let stopped = 0;
  audio.voices.add({ stop: () => { stopped++; } }); audio.voices.add({ stop: () => { stopped++; } });
  audio.syncMute(); assert.equal(stopped, 2); assert.equal(audio.voices.size, 0);
});
test('polyphony cap rejects new voices before allocating audio nodes', () => {
  const audio = new ArcadeAudio(); audio.enabled = true;
  audio.context = { state: 'running', createOscillator: () => { throw new Error('Must not allocate'); } };
  for (let i = 0; i < 24; i++) audio.voices.add({});
  assert.doesNotThrow(() => audio.play('shoot'));
});

test('unlock recovers from a closed audio context', async () => {
  const previous = globalThis.window;
  const context = { state: 'running', currentTime: 0, destination: {}, createGain: () => ({ connect() {}, gain: { setTargetAtTime() {} } }) };
  globalThis.window = { AudioContext: class { constructor() { return context; } } };
  try {
    const audio = new ArcadeAudio(); audio.enabled = true; audio.context = { state: 'closed' }; audio.master = {};
    await audio.unlock(); assert.equal(audio.context, context); assert.ok(audio.master.gain);
  } finally { globalThis.window = previous; }
});
