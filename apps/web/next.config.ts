import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  typescript: {
    // Vérification TypeScript faite en développement, désactivée au build Vercel
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint flat config incompatible avec Next.js 15 au build — vérifié en dev
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // Force une seule instance React dans le monorepo npm workspaces
    // Évite "ReactCurrentDispatcher undefined" et "useContext null" (styled-jsx dual instance)
    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    };
    return config;
  },
};

export default nextConfig;
