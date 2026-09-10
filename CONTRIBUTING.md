# Contributing

Use Node.js 22 or newer. Clone the repository, create a branch, and run `npm ci` followed by `npm run dev`.

Before opening a pull request:

```sh
npm run check
npm test
npm run build
git diff --check
```

Keep gameplay rules in `src/engine.js` and browser interactions in `appHandler.js`. The engine must remain independent of the DOM, audio, storage, real time, and animation callbacks. Pass elapsed seconds and input state into `step()`.

Add regression tests for changes to collisions, scoring, timing, wave progression, and saved data. Tests use Node's built-in test runner; no test framework installation is required. Use injected randomness for repeatable simulations.

Comments should explain decisions and invariants, such as why collision bounds are swept, rather than repeat a line of code. Prefer small, focused commits and retain the original authors' credits.

For interface changes, check keyboard controls, touch controls, pause and restart, narrow screens, 200% text enlargement, and reduced motion. Record which checks were actually performed. See [the manual checklist](docs/QA.md).

The project intentionally has no runtime dependencies. Discuss a new framework or service in the pull request when it solves a concrete need.
