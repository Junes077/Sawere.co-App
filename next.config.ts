import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a self-contained .next/standalone server (with its own
  // node_modules subset) so the Windows desktop shell can bundle and spawn
  // it as a sidecar process instead of requiring a separate `npm install`.
  // See docs/DESKTOP.md.
  output: "standalone",
};

export default nextConfig;
