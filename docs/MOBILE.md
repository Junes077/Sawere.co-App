# Android app (Capacitor)

## Why it wraps a live URL, not a static bundle

Same reasoning as the desktop shell (`docs/DESKTOP.md`): the app is a full
Next.js server, not a static site. `capacitor.config.ts` sets
`server.url` to your deployed app (or your LAN dev server's address while
testing on a physical device) instead of shipping a static `webDir`.

## Prerequisites

- [Android Studio](https://developer.android.com/studio) + the Android SDK.
- A deployed instance of the app (or your machine's LAN IP for local
  testing — phones can't reach `localhost`).

## First-time setup

```bash
npm install
npx cap add android      # generates the android/ project (gitignored)
npm run cap:sync
npm run cap:open:android  # opens Android Studio to run/build
```

Set `NEXT_PUBLIC_APP_URL` in `.env.local` (or export it before running
`cap sync`) to whatever `capacitor.config.ts` should point the WebView at.

## Offline support (roadmap)

The spec calls for offline support; today the Android shell requires
connectivity because it's a thin WebView over the live server. A real
offline mode needs:

1. A local database on-device (e.g. SQLite via a Capacitor plugin) mirroring
   the subset of `Client`/`Case`/`Task`/`CalendarEvent` rows relevant to the
   signed-in user.
2. A sync layer reconciling local writes with the server when connectivity
   returns (conflict resolution strategy — last-write-wins is the simplest
   starting point given `updatedAt` timestamps already exist on every
   model).

This is intentionally not implemented yet — it's a meaningful architecture
decision (which entities go offline-first, how conflicts resolve) that
deserves its own design pass rather than a rushed implementation.

## iOS

Not scaffolded yet, but nothing in the architecture is Android-specific —
`npx cap add ios` on a Mac with Xcode installed follows the same pattern
once there's a need for it.

## Biometric login

`User.biometricEnabled` and the Settings toggle are already in place.
Wiring an actual Android BiometricPrompt gate in front of the stored
Supabase session is a small native plugin (e.g.
`@capacitor-community/biometric-auth`) once the Android project exists.
