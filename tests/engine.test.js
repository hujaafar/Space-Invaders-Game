import test from 'node:test';
import assert from 'node:assert/strict';
import { SpaceInvaders, WORLD, DIFFICULTIES } from '../src/engine.js';

function ready(difficulty = 'pilot') {
  const game = new SpaceInvaders({ random: () => .5 });
  game.start(difficulty); game.waveIntro = 0; game.drainEvents();
  return game;
}
function advance(game, seconds, input = {}) {
  for (let i = 0; i < Math.round(seconds * 120); i++) game.step(1 / 120, input);
}
function snapshot(game) { return JSON.stringify(game); }
function laserAt(game, target) {
  game.shots++;
  game.bullets.push(game.entity({ kind: 'laser', owner: 'player', x: target.x + target.w / 2, y: target.y + target.h, w: 4, h: 15, vx: 0, vy: -700 }));
}
function incoming(game) {
  game.bullets.push(game.entity({ kind: 'enemy-laser', owner: 'enemy', x: game.player.x + 14, y: game.player.y - 2, w: 6, h: 13, vx: 0, vy: 200 }));
}

test('a new mission resets every combat system and invalid difficulty falls back safely', () => {
  const game = ready('ace'); advance(game, 1, { fire: true, shield: true });
  game.lives = 1; game.score = 900; game.wave = 4; game.pause();
  game.start('__proto__');
  assert.equal(game.difficulty, 'pilot'); assert.equal(game.state, 'playing');
  assert.equal(game.score, 0); assert.equal(game.lives, 3); assert.equal(game.wave, 1);
  assert.equal(game.bullets.length, 0); assert.equal(game.particles.length, 0);
  assert.equal(game.shieldCooldown, 0); assert.equal(game.shots, 0);
});
test('pause freezes projectiles, enemies, particles, shields, and the mission clock', () => {
  const game = ready(); advance(game, .3, { fire: true, shield: true });
  game.burst(100, 100); game.pause();
  const before = snapshot(game); advance(game, 6, { right: true, fire: true });
  assert.equal(snapshot(game), before);
  game.resume(); advance(game, .1);
  assert.equal(game.state, 'playing'); assert.ok(game.remaining < 75);
});
test('a paused wave transition resumes the transition, not an empty combat wave', () => {
  const game = ready(); game.enemies = []; game.step(.01);
  assert.equal(game.state, 'wave-clear'); game.pause(); advance(game, 3); game.resume();
  assert.equal(game.state, 'wave-clear'); advance(game, 2.1);
  assert.equal(game.wave, 2); assert.equal(game.state, 'playing'); assert.ok(game.enemies.length > 0);
});
test('movement is time-based and clamped at both edges', () => {
  const a = ready(), b = ready();
  for (let i = 0; i < 30; i++) a.step(1 / 60, { right: true });
  for (let i = 0; i < 72; i++) b.step(1 / 144, { right: true });
  assert.ok(Math.abs(a.player.x - b.player.x) < .00001);
  advance(a, 3, { right: true }); assert.equal(a.player.x, WORLD.width - a.player.w - 8);
  advance(a, 4, { left: true }); assert.equal(a.player.x, 8);
});
test('opposing movement inputs cancel each other', () => {
  const game = ready(); const x = game.player.x;
  advance(game, .2, { left: true, right: true }); assert.equal(game.player.x, x);
});
test('continuous fire obeys cooldown instead of creating a shot every frame', () => {
  const game = ready(); advance(game, 1, { fire: true });
  assert.ok(game.shots >= 5 && game.shots <= 6); assert.ok(game.bullets.length <= game.shots);
});
test('swept collisions detect targets crossed completely in one tick', () => {
  const game = ready(); const target = game.enemies[16];
  game.enemies = [target]; target.y = 100; target.h = 10;
  game.shots = 1;
  game.bullets = [game.entity({ kind: 'laser', owner: 'player', x: target.x + 12, y: 130, w: 4, h: 5, vx: 0, vy: -900 })];
  game.step(.05); assert.equal(game.kills, 1); assert.equal(game.hits, 1);
  assert.equal(game.state, 'wave-clear'); assert.ok(game.score >= 100);
});
test('armored brutes take two hits and are scored only once', () => {
  const game = ready(); game.wave = 3; game.beginWave(); game.waveIntro = 0;
  const target = game.enemies[0];
  laserAt(game, target); game.step(.01); assert.equal(target.hp, 1); assert.equal(game.score, 0);
  laserAt(game, target); game.step(.01); assert.equal(game.kills, 1); assert.equal(game.score, 250);
  assert.equal(game.accuracy, 100);
});
test('shield absorbs damage, expires, and cannot bypass its cooldown', () => {
  const game = ready(); game.step(.01, { shield: true }); incoming(game); game.step(.01);
  assert.equal(game.lives, 3); assert.equal(game.shieldCooldown > 9, true);
  advance(game, 2.1); assert.equal(game.shieldTime, 0);
  game.step(.01, { shield: true }); assert.equal(game.shieldTime, 0);
  incoming(game); game.step(.01); assert.equal(game.lives, 2);
  game.shieldCooldown = 0; game.step(.01, { shield: true }); assert.equal(game.shieldTime, 2);
});
test('overlapping enemy shots cost one life, followed by invulnerability', () => {
  const game = ready(); incoming(game); incoming(game); incoming(game); game.step(.01);
  assert.equal(game.lives, 2); assert.ok(game.invulnerable > 0);
});
test('zero lives produces one defeat and stops the simulation', () => {
  const game = ready(); game.lives = 1; incoming(game); game.step(.01);
  assert.equal(game.state, 'gameover'); assert.equal(game.lives, 0);
  const before = snapshot(game); advance(game, 5, { fire: true }); assert.equal(snapshot(game), before);
  assert.equal(game.drainEvents().filter(event => event.type === 'defeat').length, 1);
});
test('timeout and perimeter breach both end the mission', () => {
  const timer = ready(); timer.remaining = .005; timer.step(.01); assert.equal(timer.state, 'gameover');
  assert.equal(timer.remaining, 0);
  const breach = ready(); breach.enemies[0].y = breach.player.y; breach.step(.01);
  assert.equal(breach.state, 'gameover');
});
test('combo expires in simulation time and caps at four', () => {
  const game = ready(); game.streak = 24; game.comboTime = 3;
  assert.equal(game.multiplier, 4); advance(game, 3.1); assert.equal(game.multiplier, 1);
});
test('surviving formation bounds reverse and descend, even when outer columns died', () => {
  const game = ready(); game.enemies = [game.enemies[3]];
  const enemy = game.enemies[0]; enemy.x = WORLD.width - enemy.w - 18;
  const y = enemy.y; game.direction = 1; game.step(.02);
  assert.equal(game.direction, -1); assert.equal(enemy.y, y + 18);
  game.step(.02); assert.ok(enemy.x < WORLD.width - enemy.w - 18);
});
test('enemy fire comes only from the lowest surviving invader in a column', () => {
  const game = ready(); game.enemyFire = 0; game.step(.01);
  const shot = game.bullets.find(bullet => bullet.owner === 'enemy');
  assert.ok(shot.y >= 55 + 2 * 47 + 27);
});
test('four formations lead to a killable final boss and a single victory', () => {
  const game = ready();
  for (let wave = 1; wave <= 4; wave++) {
    assert.equal(game.wave, wave);
    game.enemies = []; game.waveIntro = 0; game.step(.01); advance(game, 2.1);
  }
  assert.equal(game.wave, 5); assert.ok(game.boss); game.waveIntro = 0;
  game.boss.hp = 1; laserAt(game, game.boss); game.step(.01);
  assert.equal(game.state, 'won'); assert.equal(game.boss, null);
  assert.equal(game.drainEvents().filter(event => event.type === 'victory').length, 1);
  const before = snapshot(game); advance(game, 5); assert.equal(snapshot(game), before);
});
test('each difficulty has distinct timing, enemy pressure, and boss health', () => {
  assert.ok(DIFFICULTIES.rookie.seconds > DIFFICULTIES.pilot.seconds);
  assert.ok(DIFFICULTIES.ace.speed > DIFFICULTIES.pilot.speed);
  assert.ok(DIFFICULTIES.ace.bossHP > DIFFICULTIES.pilot.bossHP);
});
test('negative and nonfinite time deltas cannot corrupt game state', () => {
  const game = ready(); const before = snapshot(game);
  game.step(NaN); game.step(-4); game.step(Infinity); assert.equal(snapshot(game), before);
});

test('particle generation never consumes the enemy targeting random stream', () => {
  let calls = 0;
  const game = new SpaceInvaders({ random: () => { calls++; return .5; }, cosmeticRandom: () => .5 });
  game.start(); game.waveIntro = 0; game.burst(100, 100, '#fff', 30);
  assert.equal(calls, 0); game.enemyFire = 0; game.step(.01); assert.equal(calls, 1);
});
