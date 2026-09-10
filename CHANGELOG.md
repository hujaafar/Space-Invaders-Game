# Changelog

## 2.0.1 — 2026-09-10

- Correct continuous collision detection for diagonal mothership shots and isolate cosmetic randomness from enemy targeting.
- Guard the firing API, protect difficulty presets, and release mission entities when returning to the hangar.
- Retain the latest scores after storage quota failures and normalize settings before writing them.
- Preserve browser keyboard shortcuts; make on-screen controls keyboard operable; prevent accidental secondary-click input.
- Cancel queued audio on mute, limit simultaneous voices, and recover closed audio contexts.
- Reduce repeated HUD and sprite style work; improve landscape layouts, enlarged dialogs, forced colors, navigation semantics, and boss health announcements.
- Contain preview-server symlinks, support HEAD requests, reject mutation methods, and report startup problems clearly.
- Stage and validate builds before replacing previous output; verify nested module and asset references.
- Extend syntax checks to all JavaScript files and add Node 24 to CI.
- Add regression coverage and practical troubleshooting documentation. Browser/device QA remains a separate manual check.

## 2.0.0 — 2026-09-10

### Presentation

- Original deep-space artwork, locally hosted typography, lime-accented hangar, and a responsive combat HUD.
- Scroll progress, subtle artwork parallax, chapter reveals, and reduced-motion support.
- Flight manual, mission briefing, enemy reference, and accessible keyboard focus states.

### Gameplay

- Five-wave campaign with a final mothership and three difficulty levels.
- Continuous fire, touch controls, rechargeable shield, combo scoring, and mission results.
- Synthesized audio with an explicit sound toggle and personal bests stored separately by difficulty.
- One fixed-step simulation replaces independent projectile animations and wall-clock timers.
- Pause freezes every gameplay system. Restart replaces the entire mission state. Losing focus pauses the mission.
- Swept projectile collisions, invulnerability after damage, and formation bounds based on surviving enemies.

### Repository

- Separate simulation, audio, and persistence modules with explanatory comments.
- Regression tests, asset checks, static build, local preview server, and CI on Windows and Linux.
- Contributor guide, architecture notes, asset credits, issue form, and pull request template.

## Original release

The original DOM-based Space Invaders game included a 15 × 15 grid, keyboard movement, a 50-second mission, pause controls, score and lives, story overlays, and sound effects.
