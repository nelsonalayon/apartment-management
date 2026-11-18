import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Origen del túnel de Tailscale permitido en `next dev` (Next16 bloquea por
  // defecto las peticiones cross-origin al dev server). Solo afecta a dev;
  // hostname sin esquema ni puerto según la doc de Next.
  allowedDevOrigins: ["desktop-vt0tpeg.tail3c231e.ts.net"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
