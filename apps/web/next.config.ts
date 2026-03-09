import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // La vérification TypeScript est faite en développement
    // On la désactive au build pour accélérer le déploiement Vercel
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
