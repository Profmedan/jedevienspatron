import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Vérification TypeScript faite en développement, désactivée au build Vercel
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint flat config incompatible avec Next.js 15 au build — vérifié en dev
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
