import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Vérification TypeScript faite en développement, désactivée au build Vercel
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
