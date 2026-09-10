/** Pure simulation: no DOM, wall clock, audio, timers, or animation callbacks. */
export const WORLD = Object.freeze({ width: 900, height: 490, waves: 5 });
export const DIFFICULTIES = Object.freeze({
  rookie: Object.freeze({ speed: .75, fireRate: 1.4, bulletSpeed: .8, seconds: 90, score: .75, bossHP: 26 }),
  pilot: Object.freeze({ speed: 1, fireRate: 1, bulletSpeed: 1, seconds: 75, score: 1, bossHP: 36 }),
  ace: Object.freeze({ speed: 1.3, fireRate: .75, bulletSpeed: 1.2, seconds: 65, score: 1.5, bossHP: 46 }),
});
export const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

export class SpaceInvaders {
  constructor({ random = Math.random, cosmeticRandom = Math.random } = {}) {
    this.random = random;
    this.cosmeticRandom = cosmeticRandom;
    this.sequence = 0;
    this.state = 'idle';
    this.events = [];
    this.enemies = [];
    this.bullets = [];
    this.particles = [];
    this.boss = null;
  }

  emit(type, data = {}) { this.events.push({ type, ...data }); }
  drainEvents() { const events = this.events; this.events = []; return events; }
  entity(data) { return { id: ++this.sequence, ...data }; }

  start(difficulty = 'pilot') {
    this.difficulty = Object.hasOwn(DIFFICULTIES, difficulty) ? difficulty : 'pilot';
    this.config = DIFFICULTIES[this.difficulty];
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.elapsed = 0;
    this.shots = 0;
    this.hits = 0;
    this.kills = 0;
    this.streak = 0;
    this.comboTime = 0;
    this.fireCooldown = 0;
    this.shieldCooldown = 0;
    this.shieldTime = 0;
    this.invulnerable = 0;
    this.reason = '';
    this.events = [];
    this.particles = [];
    this.player = this.entity({ kind: 'player', x: 434, y: 427, w: 32, h: 36 });
    this.beginWave();
  }

  beginWave() {
    this.state = 'playing';
    this.enemies = [];
    this.bullets = [];
    this.boss = null;
    this.direction = 1;
    this.waveIntro = 1.6;
    this.transitionTime = 0;
    this.enemyFire = 1.6;
    this.remaining = this.wave === WORLD.waves ? 100 : this.config.seconds;
    this.streak = 0;
    this.comboTime = 0;
    if (this.wave === WORLD.waves) {
      this.boss = this.entity({ kind: 'boss', x: 395, y: 65, w: 110, h: 70, hp: this.config.bossHP, maxHP: this.config.bossHP });
    } else {
      const rows = this.wave > 2 ? 4 : 3;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < 8; col++) {
          const type = row === 0 ? 'brute' : row === 1 ? 'drone' : 'scout';
          this.enemies.push(this.entity({ kind: 'enemy', type, col, x: 112 + col * 70, y: 55 + row * 47, w: 32, h: 27, hp: type === 'brute' && this.wave >= 3 ? 2 : 1 }));
        }
      }
    }
    this.initialCount = this.enemies.length;
    this.emit('wave', { wave: this.wave });
  }

  pause() {
    if (this.state !== 'playing' && this.state !== 'wave-clear') return false;
    this.previousState = this.state;
    this.state = 'paused';
    return true;
  }

  resume() {
    if (this.state !== 'paused') return false;
    this.state = this.previousState;
    return true;
  }

  get multiplier() { return Math.min(4, 1 + Math.floor(this.streak / 4)); }
  get accuracy() { return this.shots ? Math.round(this.hits / this.shots * 100) : 0; }

  finish(won, reason = '') {
    if (this.state === 'won' || this.state === 'gameover') return;
    this.state = won ? 'won' : 'gameover';
    this.reason = reason;
    this.bullets = [];
    this.emit(won ? 'victory' : 'defeat', { reason });
  }

  burst(x, y, color = '#d2f86f', count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = this.cosmeticRandom() * Math.PI * 2;
      const speed = 40 + this.cosmeticRandom() * 110;
      this.particles.push(this.entity({ kind: 'particle', x, y, w: 2 + this.cosmeticRandom() * 3, h: 3, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: .35 + this.cosmeticRandom() * .3, color }));
    }
    // Bound cosmetic work even during long, high-scoring sessions.
    if (this.particles.length > 160) this.particles.splice(0, this.particles.length - 160);
  }

  hitPlayer() {
    if (this.invulnerable > 0 || this.shieldTime > 0 || this.state !== 'playing') return;
    this.lives--;
    this.streak = 0;
    this.invulnerable = 1.6;
    this.burst(this.player.x + 16, this.player.y + 18, '#ffa180', 20);
    this.emit('damage', { lives: this.lives });
    if (this.lives <= 0) this.finish(false, 'Your hull is gone. Earth still needs you.');
  }

  fire() {
    if (this.state !== 'playing' || this.waveIntro > 0 || this.fireCooldown > 0) return;
    this.fireCooldown = .18;
    this.shots++;
    this.bullets.push(this.entity({ kind: 'laser', owner: 'player', x: this.player.x + 14, y: this.player.y - 12, w: 4, h: 15, vx: 0, vy: -700 }));
    this.emit('shoot');
  }

  enemyShot(enemy, vx = 0) {
    this.bullets.push(this.entity({ kind: 'enemy-laser', owner: 'enemy', x: enemy.x + enemy.w / 2 - 3, y: enemy.y + enemy.h, w: 6, h: 13, vx, vy: (140 + this.wave * 13) * this.config.bulletSpeed }));
  }

  moveEnemies(dt) {
    if (this.boss) {
      this.boss.x += this.direction * 110 * this.config.speed * dt;
      if (this.boss.x > 740 || this.boss.x < 50) {
        this.boss.x = clamp(this.boss.x, 50, 740);
        this.direction *= -1;
      }
    } else if (this.enemies.length) {
      const speed = (29 + this.wave * 8 + (1 - this.enemies.length / this.initialCount) * 46) * this.config.speed;
      const distance = this.direction * speed * dt;
      const left = Math.min(...this.enemies.map(enemy => enemy.x));
      const right = Math.max(...this.enemies.map(enemy => enemy.x + enemy.w));
      const edge = left + distance < 18 || right + distance > WORLD.width - 18;
      for (const enemy of this.enemies) {
        if (edge) enemy.y += 18;
        else enemy.x += distance;
      }
      if (edge) this.direction *= -1;
      if (this.enemies.some(enemy => enemy.y + enemy.h >= this.player.y)) {
        this.finish(false, 'The fleet crossed the defense perimeter. Regroup and try again.');
        return;
      }
    }
    this.enemyFire -= dt;
    if (this.enemyFire <= 0) {
      if (this.boss) {
        for (const vx of [-75, 0, 75]) this.enemyShot(this.boss, vx);
      } else {
        // Only the lowest surviving invader in each column can fire through the formation.
        const columns = new Map();
        for (const enemy of this.enemies) {
          if (!columns.has(enemy.col) || columns.get(enemy.col).y < enemy.y) columns.set(enemy.col, enemy);
        }
        const shooters = [...columns.values()];
        const shooter = shooters[Math.floor(this.random() * shooters.length)];
        if (shooter) this.enemyShot(shooter);
      }
      this.enemyFire = Math.max(.3, (1.15 - this.wave * .1) * this.config.fireRate);
    }
  }

  moveBullets(dt) {
    for (const bullet of this.bullets) {
      const oldY = bullet.y;
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      // Swept vertical bounds catch targets crossed between frames, even by a fast laser.
      const sweep = { ...bullet, y: Math.min(oldY, bullet.y), h: bullet.h + Math.abs(oldY - bullet.y) };
      if (bullet.owner === 'player') {
        const targets = this.boss ? [this.boss] : this.enemies;
        const target = targets.filter(enemy => enemy.hp > 0 && overlaps(sweep, enemy)).sort((a, b) => b.y - a.y)[0];
        if (target) {
          bullet.dead = true;
          target.hp--;
          this.hits++;
          this.streak++;
          this.comboTime = 3;
          this.burst(bullet.x, target.y + target.h, target.kind === 'boss' ? '#ffa180' : '#d2f86f', 7);
          this.emit('hit');
          if (target.hp === 0) {
            const points = target.kind === 'boss' ? 5000 : ({ scout: 100, drone: 150, brute: 250 })[target.type];
            this.score += Math.round(points * this.multiplier * this.config.score);
            this.kills++;
            this.burst(target.x + target.w / 2, target.y + target.h / 2);
          }
        }
      } else if (overlaps(sweep, this.player)) {
        bullet.dead = true;
        this.hitPlayer();
        if (this.state !== 'playing') return;
      }
      if (bullet.y < -30 || bullet.y > WORLD.height + 30 || bullet.x < -20 || bullet.x > WORLD.width + 20) bullet.dead = true;
    }
    this.bullets = this.bullets.filter(bullet => !bullet.dead);
    this.enemies = this.enemies.filter(enemy => enemy.hp > 0);
    if (this.boss?.hp <= 0) { this.boss = null; this.finish(true); }
    else if (!this.boss && this.enemies.length === 0) {
      this.state = 'wave-clear';
      this.transitionTime = 2;
      this.bullets = [];
      this.score += Math.ceil(this.remaining) * 10;
      this.emit('clear', { wave: this.wave });
    }
  }

  step(seconds, input = {}) {
    // A single clock owns every moving object. Pause and restart cannot leave orphaned shots.
    if (this.state !== 'playing' && this.state !== 'wave-clear') return;
    const dt = clamp(Number.isFinite(seconds) ? seconds : 0, 0, .05);
    if (!dt) return;
    for (const particle of this.particles) {
      particle.x += particle.vx * dt; particle.y += particle.vy * dt; particle.life -= dt;
    }
    this.particles = this.particles.filter(particle => particle.life > 0);
    if (this.state === 'wave-clear') {
      this.transitionTime -= dt;
      if (this.transitionTime <= 0) { this.wave++; this.beginWave(); }
      return;
    }
    if (this.waveIntro > 0) { this.waveIntro = Math.max(0, this.waveIntro - dt); return; }
    this.elapsed += dt;
    this.remaining = Math.max(0, this.remaining - dt);
    if (this.remaining <= 0) { this.finish(false, 'The defense window closed. Clear the next fleet before time runs out.'); return; }
    for (const key of ['fireCooldown', 'shieldCooldown', 'shieldTime', 'invulnerable', 'comboTime']) this[key] = Math.max(0, this[key] - dt);
    if (!this.comboTime) this.streak = 0;
    const movement = Number(Boolean(input.right)) - Number(Boolean(input.left));
    this.player.x = clamp(this.player.x + movement * 390 * dt, 8, WORLD.width - this.player.w - 8);
    if (input.shield && this.shieldCooldown === 0) {
      this.shieldTime = 2;
      this.shieldCooldown = 10;
      this.emit('shield');
    }
    if (input.fire) this.fire();
    this.moveEnemies(dt);
    if (this.state === 'playing') this.moveBullets(dt);
  }
}
