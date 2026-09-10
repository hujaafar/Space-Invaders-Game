import { SpaceInvaders, WORLD } from './src/engine.js';
import { ArcadeAudio } from './src/audio.js';
import { createStorage } from './src/storage.js';

const $ = (id) => document.getElementById(id);
const game = new SpaceInvaders();
const sound = new ArcadeAudio();
const storage = createStorage();
const shell = $('game-shell');
const battlefield = $('battlefield');
const overlay = $('game-overlay');
const keys = new Set();
const pointers = new Map();
const nodes = new Map();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const formatScore = value => String(value).padStart(6, '0');
let difficulty = storage.difficulty();
let best = storage.best(difficulty);
let frameId = null;
let previousTime = null;
let accumulator = 0;
let fieldWidth = 900;
let fieldHeight = 490;
let scrollPending = false;
const STEP = 1 / 120;
const outsideDialog = [...document.querySelectorAll('.site-header, .flight-manual, .mission-section, .enemy-section, .site-footer, .arcade-footer')];

document.querySelector(`input[name="difficulty"][value="${difficulty}"]`).checked = true;
sound.enabled = storage.sound();

function announce(text) { $('announcer').textContent = text; }
function updateBest() {
  $('personal-best').textContent = formatScore(best);
  $('best-inline').textContent = `BEST ${formatScore(best)}`;
}
function updateSound() {
  $('sound-toggle').setAttribute('aria-pressed', String(sound.enabled));
  $('sound-toggle').setAttribute('aria-label', `Turn sound ${sound.enabled ? 'off' : 'on'}`);
  $('sound-label').textContent = `SOUND ${sound.enabled ? 'ON' : 'OFF'}`;
}
function clearInput() {
  keys.clear(); pointers.clear();
  document.querySelectorAll('.touch-button').forEach(button => button.classList.remove('is-held'));
}
function input() {
  const touch = new Set(pointers.values());
  return {
    left: keys.has('ArrowLeft') || keys.has('KeyA') || touch.has('left'),
    right: keys.has('ArrowRight') || keys.has('KeyD') || touch.has('right'),
    fire: keys.has('Space') || touch.has('fire'),
    shield: keys.has('ShiftLeft') || keys.has('ShiftRight') || touch.has('shield'),
  };
}
function stopClock() {
  if (frameId !== null) cancelAnimationFrame(frameId);
  frameId = null; previousTime = null; accumulator = 0;
}
function startClock() {
  if (frameId !== null) return;
  previousTime = null; accumulator = 0;
  frameId = requestAnimationFrame(frame);
}

function setDialog(open) {
  overlay.hidden = !open;
  $('play-screen').inert = open;
  outsideDialog.forEach(element => { element.inert = open; });
}
function launch() {
  clearInput(); stopClock(); setDialog(false);
  game.start(difficulty);
  shell.dataset.state = game.state;
  $('start-screen').hidden = true;
  $('play-screen').hidden = false;
  battlefield.focus({ preventScroll: true });
  // Measure only when the play surface becomes visible; resizing is handled separately.
  fieldWidth = battlefield.clientWidth; fieldHeight = battlefield.clientHeight;
  shell.scrollIntoView({ behavior: 'instant', block: 'start' });
  void sound.unlock();
  handleEvents(); render(); startClock();
}
function pause() {
  if (!game.pause()) return;
  clearInput(); stopClock();
  shell.dataset.state = game.state;
  $('overlay-eyebrow').textContent = 'FLIGHT ON HOLD';
  $('overlay-title').textContent = 'Take a breath.';
  $('overlay-description').textContent = "Your ship is safe. Resume when you're ready.";
  $('result-stats').hidden = true;
  $('resume-button').hidden = false;
  $('restart-button').textContent = 'Restart mission';
  setDialog(true);
  $('resume-button').focus({ preventScroll: true });
  announce('Mission paused.');
}
function resume() {
  if (!game.resume()) return;
  clearInput(); setDialog(false);
  shell.dataset.state = game.state;
  battlefield.focus({ preventScroll: true });
  shell.scrollIntoView({ behavior: 'instant', block: 'start' });
  void sound.unlock(); startClock();
  announce('Mission resumed.');
}
function hangar() {
  stopClock(); clearInput(); setDialog(false);
  game.returnToHangar(); shell.dataset.state = 'idle';
  for (const node of nodes.values()) node.remove();
  nodes.clear(); shell.classList.remove('hit');
  $('start-screen').hidden = false; $('play-screen').hidden = true;
  $('launch-button').focus({ preventScroll: true });
  shell.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
}
function results(won) {
  clearInput(); stopClock();
  const previousBest = best;
  best = Math.max(best, storage.saveBest(difficulty, game.score));
  updateBest();
  $('overlay-eyebrow').textContent = game.score > previousBest ? 'NEW PERSONAL BEST' : won ? 'TRANSMISSION RECEIVED' : 'SIGNAL LOST';
  $('overlay-title').textContent = won ? 'Earth is still ours.' : 'Not your last flight.';
  $('overlay-description').textContent = won ? 'Mothership destroyed. Five waves cleared. Welcome home, Commander.' : game.reason;
  $('result-score').textContent = game.score.toLocaleString();
  $('result-accuracy').textContent = `${game.accuracy}%`;
  $('result-wave').textContent = `${game.wave} / ${WORLD.waves}`;
  $('result-stats').hidden = false; $('resume-button').hidden = true;
  $('restart-button').textContent = 'Fly again ↗';
  setDialog(true); $('restart-button').focus({ preventScroll: true });
  announce(`${won ? 'Mission accomplished' : 'Mission ended'}. Score ${game.score}. Wave ${game.wave}. Accuracy ${game.accuracy} percent.`);
}
function handleEvents() {
  for (const event of game.drainEvents()) {
    sound.play(event.type);
    if (event.type === 'wave') announce(event.wave === 5 ? 'Final wave. Mothership approaching.' : `Wave ${event.wave}. Defend the perimeter.`);
    if (event.type === 'clear') announce(`Wave ${event.wave} cleared.`);
    if (event.type === 'damage') {
      if (!reducedMotion.matches) shell.classList.add('hit');
      announce(`${event.lives} ${event.lives === 1 ? 'life' : 'lives'} remaining.`);
    }
    if (event.type === 'victory' || event.type === 'defeat') results(event.type === 'victory');
  }
}

function render() {
  shell.dataset.state = game.state;
  $('score').textContent = formatScore(game.score);
  $('wave').firstChild.textContent = `${String(game.wave).padStart(2, '0')} `;
  $('timer').textContent = String(Math.ceil(game.remaining)).padStart(2, '0');
  $('lives').textContent = [0, 1, 2].map(index => index < game.lives ? '▰' : '▱').join(' ');
  $('lives').setAttribute('aria-label', `${game.lives} lives`);
  $('combo').textContent = game.multiplier > 1 ? `${game.multiplier}× COMBO · ${game.streak} HIT CHAIN` : 'SYSTEMS NOMINAL';
  $('shield-status').textContent = game.shieldTime > 0 ? 'SHIELD ACTIVE' : game.shieldCooldown > 0 ? `SHIELD CHARGING · ${Math.ceil(game.shieldCooldown)}s` : 'SHIELD READY · SHIFT';
  $('wave-announcement').textContent = game.state === 'wave-clear' ? `WAVE ${game.wave} CLEARED` : game.waveIntro > 0 ? game.wave === 5 ? 'MOTHERSHIP INBOUND' : `WAVE 0${game.wave} / DEFEND EARTH` : '';
  $('boss-meter').hidden = !game.boss;
  if (game.boss) $('boss-health').style.width = `${game.boss.hp / game.boss.maxHP * 100}%`;

  const objects = [game.player, ...game.enemies, ...game.bullets, ...(reducedMotion.matches ? [] : game.particles)];
  if (game.boss) objects.push(game.boss);
  const active = new Set();
  for (const object of objects) {
    active.add(object.id);
    let node = nodes.get(object.id);
    if (!node) {
      node = document.createElement('div');
      nodes.set(object.id, node); $('entities').append(node);
    }
    let className = `entity ${object.kind} ${object.type || ''}`;
    if (object.kind === 'player' && (game.shieldTime > 0 || game.invulnerable > 0)) className += ' protected';
    if (object.kind === 'enemy' && object.hp > 1) className += ' armored';
    if (node.className !== className) node.className = className;
    node.style.width = `${object.w / WORLD.width * 100}%`;
    node.style.height = `${object.h / WORLD.height * 100}%`;
    node.style.transform = `translate3d(${object.x / WORLD.width * fieldWidth}px, ${object.y / WORLD.height * fieldHeight}px, 0)`;
    if (object.kind === 'particle') {
      node.style.setProperty('--particle-color', object.color);
      node.style.opacity = Math.min(1, object.life * 3);
    }
  }
  for (const [id, node] of nodes) if (!active.has(id)) { node.remove(); nodes.delete(id); }
}

function frame(timestamp) {
  frameId = null;
  if (game.state !== 'playing' && game.state !== 'wave-clear') return;
  if (previousTime === null) previousTime = timestamp;
  accumulator += Math.min((timestamp - previousTime) / 1000, .1);
  previousTime = timestamp;
  // Fixed simulation ticks keep movement fair across 30, 60, and 144 Hz displays.
  while (accumulator >= STEP) {
    game.step(STEP, input()); accumulator -= STEP;
  }
  render(); handleEvents();
  if (game.state === 'playing' || game.state === 'wave-clear') frameId = requestAnimationFrame(frame);
}

$('launch-button').addEventListener('click', launch);
$('restart-button').addEventListener('click', launch);
$('pause-button').addEventListener('click', pause);
$('resume-button').addEventListener('click', resume);
$('menu-button').addEventListener('click', hangar);
shell.addEventListener('animationend', () => shell.classList.remove('hit'));
$('sound-toggle').addEventListener('click', async () => {
  sound.enabled = !sound.enabled; sound.syncMute(); storage.saveSound(sound.enabled); updateSound();
  await sound.unlock();
  if (sound.enabled) sound.play('shield');
});
document.querySelectorAll('input[name="difficulty"]').forEach(radio => radio.addEventListener('change', () => {
  difficulty = radio.value; storage.saveDifficulty(difficulty); best = storage.best(difficulty); updateBest();
}));

document.addEventListener('keydown', event => {
  if (!overlay.hidden && event.code === 'Tab') {
    const controls = [...overlay.querySelectorAll('button:not([hidden])')];
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    return;
  }
  if (event.code === 'Escape' || event.code === 'KeyP') {
    if (event.repeat) return;
    if (game.state === 'paused') resume();
    else if (game.state === 'playing' || game.state === 'wave-clear') pause();
    else if (!overlay.hidden && event.code === 'Escape') hangar();
    return;
  }
  // Native buttons, links, and difficulty radios retain their normal keyboard behavior.
  if (event.target.closest('button, a, input, textarea, select, [contenteditable="true"]')) return;
  if (game.state === 'idle' && event.code === 'Enter' && !event.repeat) { event.preventDefault(); launch(); return; }
  if (game.state !== 'playing') return;
  if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space', 'ShiftLeft', 'ShiftRight'].includes(event.code)) {
    event.preventDefault(); keys.add(event.code);
  }
});
document.addEventListener('keyup', event => keys.delete(event.code));
window.addEventListener('blur', () => { clearInput(); pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { clearInput(); pause(); } });

document.querySelectorAll('[data-control]').forEach(button => {
  button.addEventListener('pointerdown', event => {
    if (game.state !== 'playing') return;
    event.preventDefault(); button.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, button.dataset.control); button.classList.add('is-held');
  });
  const release = event => {
    pointers.delete(event.pointerId);
    if (![...pointers.values()].includes(button.dataset.control)) button.classList.remove('is-held');
  };
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
});

const resizeObserver = new ResizeObserver(() => {
  if (!$('play-screen').hidden) {
    fieldWidth = battlefield.clientWidth; fieldHeight = battlefield.clientHeight;
    if (game.player) render();
  }
});
resizeObserver.observe(battlefield);

// Stars are cosmetic and use a separate random source from the game simulation.
const stars = document.createDocumentFragment();
for (let i = 0; i < 65; i++) {
  const star = document.createElement('i'); star.className = 'star';
  star.style.left = `${Math.random() * 100}%`; star.style.top = `${Math.random() * 100}%`;
  star.style.opacity = .15 + Math.random() * .5; stars.append(star);
}
$('star-field').append(stars);

if ('IntersectionObserver' in window) {
  if (!reducedMotion.matches) document.documentElement.classList.add('motion-ready');
  const revealObserver = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target);
    }
  }, { threshold: .08 });
  document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));
  const sectionObserver = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      document.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
    }
  }, { rootMargin: '-10% 0px -55% 0px' });
  document.querySelectorAll('#arcade, #flight-manual, #mission').forEach(section => sectionObserver.observe(section));
  const playObserver = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) pause();
  }, { threshold: 0 });
  playObserver.observe(shell);
}
function updateScroll() {
  scrollPending = false;
  const total = document.documentElement.scrollHeight - innerHeight;
  document.documentElement.style.setProperty('--scroll', total > 0 ? Math.min(1, scrollY / total) : 0);
  if (!reducedMotion.matches) document.documentElement.style.setProperty('--parallax', `${Math.min(50, scrollY * .1)}px`);
}
window.addEventListener('scroll', () => {
  if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateScroll); }
}, { passive: true });
reducedMotion.addEventListener('change', () => {
  document.documentElement.classList.remove('motion-ready'); updateScroll();
});
updateBest(); updateSound(); updateScroll();
