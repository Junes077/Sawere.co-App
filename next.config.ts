import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output is only for the Tauri desktop shell, which bundles
  // .next/standalone as a sidecar server (see docs/DESKTOP.md, `npm run
  // build:desktop`). Vercel does its own serverless bundling and breaks if
  // "standalone" is set — https://github.com/vercel/next.js/discussions
  // cover this — so it must stay opt-in via BUILD_TARGET, never the default.
  ...(process.env.BUILD_TARGET === "desktop" ? { output: "standalone" as const } : {}),
};

export default nextConfig;
