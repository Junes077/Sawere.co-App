import type { CapacitorConfig } from "@capacitor/cli";

// The Android app wraps the deployed Next.js app rather than shipping a
// static bundle — the app needs Prisma/Postgres access, server-side
// Supabase auth cookies and streaming AI routes, none of which can run
// inside a static WebView. Point `server.url` at your production
// deployment (or your LAN dev server, e.g. http://192.168.x.x:3000, while
// testing on a physical device). See docs/MOBILE.md.
const config: CapacitorConfig = {
  appId: "co.sawere.legalos",
  appName: "Sawere Legal OS",
  webDir: "public",
  server: {
    url: process.env.NEXT_PUBLIC_APP_URL ?? "https://app.sawereadvocates.com",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
