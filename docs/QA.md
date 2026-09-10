# Quality assurance

## Automated checks

Run `npm run check`, `npm test`, and `npm run build`.

The regression suite covers restart state, pause/resume (including transitions), time-based movement and boundaries, fire cadence, swept collisions, armor, shield expiry and recharge, hit invulnerability, defeat, timeout, perimeter breach, combo limits, formation movement, firing columns, progression to victory, corrupt storage, storage failure, asset references, UI IDs, and font signatures.

CI runs these checks on Node 22 under both Windows and Linux. An HTTP smoke check can be performed against `npm run dev` or `npm run preview`.

## Manual browser checklist

This is a checklist for future browser verification; it is not a record that these checks were performed.

- Launch each difficulty, hold movement and fire together, use both Shift keys, and reach the boss.
- Pause with Escape, P, and the pause button. Confirm shots, time, shields, and enemies freeze.
- Restart from pause and results. Confirm no previous projectiles or input survive.
- Switch tabs, blur the window, and scroll the battlefield out of view. Confirm auto-pause.
- Verify Tab and Shift+Tab stay inside overlays, and focus returns when they close.
- On touch devices, hold two controls together. Slide away, rotate the device, and cancel a touch. Confirm no held input sticks.
- Check narrow portrait and landscape views and desktop widths. Increase text size to 200%.
- Enable reduced motion before load and while the page is open. Confirm decorative motion stops.
- Verify the sound toggle before and during play. Reload and check the saved preference.
- Complete a run, reload, and verify personal bests stay separate by difficulty.
- Disable site storage and confirm gameplay remains available.
- Verify scroll links and artwork loading, and check browser console errors.
