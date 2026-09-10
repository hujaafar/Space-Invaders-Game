# Troubleshooting

## The page appears but Launch mission does nothing

Use `npm run dev` and open the printed HTTP address. Opening `index.html` through a `file:` URL does not reliably allow ES module imports. If a static host is used, upload the complete `dist/` folder, including `src/`, `fonts/`, and `images/`.

## The preview says files are missing

Run `npm run build` before `npm run preview`. A failed build preserves the previous successful `dist/` output. Fix the reported missing asset or module, rebuild, and reload.

## Port 4173 is in use

Choose another port. In PowerShell:

```powershell
$env:PORT = '4174'
npm run dev
```

In a POSIX shell, run `PORT=4174 npm run dev`. `PORT=0` asks the operating system for an available port; use the actual address printed by the server.

The development server is intentionally bound to `127.0.0.1`. A phone cannot open the desktop's localhost address. Use the hosted site for testing on a separate device.

## Scores are not remembered after closing the browser

Private browsing, disabled storage, or a full storage quota can prevent persistence. The game keeps the newest settings and best scores for the current page session even when a persistent write fails. Scores are separate for Rookie, Pilot, and Ace and do not synchronize between devices.

## There is no sound

Sound starts off on a first visit. Enable it with the header toggle, then launch a mission. Browsers require a user gesture to unlock audio. Check the tab's mute setting and system volume. Muting stops queued effects; enabling sound again will not replay the previous melody.

## A mission pauses unexpectedly

Switching tabs, losing window focus, or scrolling the game completely out of view pauses play. Resume using Escape, P, or the dialog button. Browser shortcuts such as Ctrl+P keep their normal behavior.

## A visual or input problem remains

Open a bug report with the browser, device, difficulty, wave, and reproduction steps. Include a screenshot or console error when available. The [manual QA checklist](QA.md) covers keyboard, touch, zoom, landscape screens, and motion preferences.
