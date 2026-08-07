# Windows desktop app (Tauri)

## Why a sidecar server, not a static export

The app needs Prisma/Postgres access, server-side Supabase auth cookies and
streaming AI routes — none of that can run inside a static HTML bundle in a
webview. So the desktop shell runs the real Next.js server as a background
process and points its window at `http://localhost:3000`, the same way you'd
run it on a normal machine — Tauri just makes it double-clickable and native.

`npm run build:desktop` sets `BUILD_TARGET=desktop`, which flips on
`output: "standalone"` in `next.config.ts` for that build only — it produces
`.next/standalone/server.js`: a self-contained Node server bundle (its own
minimal `node_modules`) that only needs a `node` binary and your `.env`
alongside it to run.

This is deliberately **not** the default `npm run build`: Vercel does its
own serverless bundling and the build fails if `output: "standalone"` is
set for a Vercel deployment (it looks for trace files that standalone mode
doesn't produce in the layout Vercel expects). Keep `output: "standalone"`
opt-in behind `BUILD_TARGET=desktop` — never make it the default.

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) + the
  [Tauri prerequisites for Windows](https://tauri.app/start/prerequisites/)
  (MSVC build tools, WebView2 — usually already present on Windows 10/11).
- Node.js (already required for the web app).

## Development

```bash
npm run desktop:dev
```

This runs `beforeDevCommand` (`npm run dev`) and opens a native window
pointed at your local dev server — same hot-reload as the browser.

## Building an installer

```bash
npm run build:desktop      # produces .next/standalone
npm run desktop:build      # bundles Tauri + spawns the standalone server
```

Before your first real build:

1. Generate icons: `npm run tauri icon path/to/sawere-logo.png` (populates
   `src-tauri/icons/`).
2. Copy `.env.local` next to the bundled server (or bake the Supabase/
   Anthropic config into the Tauri bundle's resources) so
   `.next/standalone/server.js` has the environment it needs at runtime —
   Tauri's `bundle.resources` config can include the standalone folder and
   an env file.
3. Package a portable Node runtime as a
   [Tauri sidecar binary](https://tauri.app/develop/sidecar/) so end users
   don't need Node installed — `src-tauri/src/main.rs` currently shells out
   to a `node` on PATH, which is fine for development but should become a
   bundled sidecar for distribution.

`tauri.conf.json` targets `nsis` and `msi` bundles for Windows.

## What's wired vs. what's next

Wired: window chrome, app icon slot, `tauri-plugin-shell` (spawn the
server), `tauri-plugin-os`, `tauri-plugin-notification` (for desktop
reminders — see Calendar's reminder fields).

Next: bundling a Node sidecar for zero-dependency installs, native
Windows Hello biometric gate in front of the stored session (see
`docs/SECURITY.md`), wiring desktop notifications to the Calendar/Task
reminder data, and the AI Meeting Recorder's microphone capture +
speech-to-text pipeline (the `Meeting → Recording → Transcript` schema is
ready for it — see `docs/ARCHITECTURE.md`).
