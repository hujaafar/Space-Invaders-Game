# Architecture

The game remains vanilla HTML, CSS, and JavaScript with DOM sprites. There is no canvas, framework, backend, account system, or runtime package dependency.

## Responsibilities

| File | Responsibility |
| --- | --- |
| `src/collision.js` | Continuous projectile contact along both axes |
| `src/keyboard.js` | Browser-shortcut and editable-target handling |
| `src/engine.js` | Pure simulation, collisions, scoring, shields, waves, state transitions |
| `appHandler.js` | Input, fixed-step animation loop, DOM rendering, focus, overlays, scroll effects |
| `src/audio.js` | One reusable Web Audio context, bounded voices, and short synthesized effects |
| `src/storage.js` | Validated, failure-tolerant local storage |
| `style.css` | Design tokens, layout, sprite appearance, responsive and motion preferences |
| `scripts/serve.mjs` | Local HTTP preview, bound to the loopback interface |
| `scripts/build.mjs` | Allowlisted production file copying and asset checks |

## Simulation clock

One `requestAnimationFrame` callback accumulates elapsed time and runs the engine in 1/120-second steps. Frame gaps are capped at 100 ms to avoid a catch-up storm. The engine independently rejects negative or nonfinite deltas and caps each step at 50 ms.

Every gameplay timer uses simulation time: mission time, weapon cooldown, shield duration, recharge, hit invulnerability, combo expiration, wave introduction, transition, and particles. Pausing therefore freezes all of them. Resuming resets the animation accumulator, so background time is never charged to the player.

The world is 900 × 490 logical units. The renderer measures the battlefield on launch and resize, then maps logical coordinates to the available space. Collision detection never reads browser layout. Sprites are reconciled by stable entity IDs; removed objects have their DOM nodes removed.

## States

```text
idle → playing → wave-clear → playing … → won
          │          │
          ├──────────┴→ paused → previous active state
          └→ gameover

paused / won / gameover → restart → playing (wave 1)
paused / won / gameover → hangar → idle
```

`beginWave()` creates the next formation or boss. Wave introductions provide 1.6 seconds to orient the player. Cleared formations transition for two seconds. Waves one and two have 24 invaders; waves three and four have 32, including two-hit brutes. Wave five is a mothership.

## Collision and fairness

Projectiles use continuous slab intersection between their old and new positions along both axes. This prevents high-speed bullets from skipping thin targets. If a laser crosses more than one target, the first target along its path is hit first. A projectile is consumed on one hit. Enemy shots are consumed by shields and temporary hit protection as well as by unprotected hull collisions.

Taking damage grants 1.6 seconds of invulnerability. Shields last two seconds and recharge ten seconds from activation. Formation bounds use only surviving invaders. Only the lowest invader in each column may shoot.

## Persistence and audio

Storage keys use `orbital.best.<difficulty>`, `orbital.difficulty`, and `orbital.sound`. Invalid data is rejected. Storage errors fall back to session-only behavior; best scores remain in memory for the current session. There is no server leaderboard or cross-device synchronization.

Sound is off on a first visit. A saved sound preference is restored, but audio playback still requires a player gesture. The Web Audio context is created once; each short oscillator is disconnected after playback. Legacy sound files are preserved in source history and the checkout but excluded from the new production build.

## Motion and accessibility

Keyboard and multi-pointer touch input share the same input state. Pointer cancellation, loss of capture, blur, pause, and restart clear held inputs. Pausing or showing results moves focus into the dialog, makes surrounding content inert, and contains Tab navigation. Returning to play restores battlefield focus.

Reduced motion disables parallax, chapter animation, screen shake, and cosmetic particles. Status announcements cover wave changes, hull damage, pause, and results. The visual reflex-based game is not a fully nonvisual game; the menu and manual remain semantic and keyboard operable.

## Build integrity

`scripts/check.mjs` discovers all application, source, script, and test modules. `scripts/build-site.mjs` assembles an isolated staging directory and calls `scripts/validate-site.mjs` to verify HTML/CSS references and nested JavaScript imports. Only a validated build replaces `dist/`; a previous build is restored if installation fails. Temporary build cleanup is restricted to owned directories immediately under the project root.

The preview HTTP implementation lives in `scripts/server.mjs`; startup and configuration live in `scripts/serve.mjs`. Requests are restricted to GET/HEAD and are checked against both lexical paths and real filesystem paths, including junctions on Windows.
