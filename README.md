# Auto Clicker — Glassmorphism Edition

Electron + React desktop auto-clicker with smooth animations, mouse + keyboard targets, toggle and hold modes, and configurable global binds.

## Features

- **Toggle / Hold mode** — tap the bind to toggle clicking on/off, or hold the bind to click only while pressed
- **Hold source** — use the same bind, or set a separate hold-only key/mouse button
- **Targets** — auto-click mouse buttons (left/right/middle, single/double) or spam any keyboard key
- **Configurable CPS** (1–100)
- **Global binds** — keyboard keys and mouse buttons (including side buttons) work even when the window isn't focused
- **Live stats** — click count, measured CPS, runtime
- **Glassmorphism UI** with rotating conic ring + pulse halo when active
- **Frameless transparent window**, drag from the title bar, always-on-top toggle

## Quick start

```bash
npm install
npm run rebuild   # rebuild native modules (uiohook-napi / robotjs) for Electron
npm run dev
```

## Build

```bash
npm run build
```

## Notes

- Native modules (`uiohook-napi`, `@hurdlegroup/robotjs`) require matching Electron ABI — if they fail to load on first run, re-run `npm run rebuild`.
- On macOS you'll need to grant **Accessibility** permission to the app for global hooks/sending input.
