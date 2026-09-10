import test from 'node:test';
import assert from 'node:assert/strict';
import { impactTime } from '../src/collision.js';
const shot = { x: 0, y: 0, w: 2, h: 2 };
test('a diagonal projectile hits a target along its path', () => {
  assert.equal(impactTime(shot, { x: 100, y: 100 }, { x: 50, y: 50, w: 10, h: 10 }), .48);
});
test('a target inside the swept bounding box but outside the path is missed', () => {
  assert.equal(impactTime(shot, { x: 100, y: 100 }, { x: 50, y: 0, w: 10, h: 10 }), null);
});
test('contact before the step or after its end is rejected', () => {
  assert.equal(impactTime(shot, { x: -100, y: 0 }, { x: 50, y: 0, w: 10, h: 10 }), null);
  assert.equal(impactTime(shot, { x: 10, y: 0 }, { x: 50, y: 0, w: 10, h: 10 }), null);
});
test('stationary overlapping and disjoint objects have distinct results', () => {
  assert.equal(impactTime(shot, { x: 0, y: 0 }, shot), 0);
  assert.equal(impactTime(shot, { x: 0, y: 0 }, { ...shot, x: 5 }), null);
});
