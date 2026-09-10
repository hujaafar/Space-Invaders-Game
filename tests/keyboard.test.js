import test from 'node:test';
import assert from 'node:assert/strict';
import { ignoreGameShortcut } from '../src/keyboard.js';
test('browser shortcuts, composition, and editable targets retain control', () => {
  for (const event of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { isComposing: true }, { defaultPrevented: true }, { target: { closest: () => ({}) } }]) assert.equal(ignoreGameShortcut(event), true);
  assert.equal(ignoreGameShortcut({ shiftKey: true, target: { closest: () => null } }), false);
  assert.equal(ignoreGameShortcut({}), false);
});
