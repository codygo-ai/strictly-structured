import type { NextConfig } from "next";

const FUNCTIONS_EMULATOR = "http://127.0.0.1:5001/codygo-website/us-central1";

const nextConfig: NextConfig = {
  output: "export",
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return [];
    return [
      { source: "/api/validate", destination: `${FUNCTIONS_EMULATOR}/validate` },
      { source: "/api/fix", destination: `${FUNCTIONS_EMULATOR}/fix` },
      { source: "/api/feedback", destination: `${FUNCTIONS_EMULATOR}/feedback` },
    ];
  },
};

export default nextConfig;
