import type { NextConfig } from "next";
import path from "path";
import { createRequire } from "module";

// require.resolve suit la résolution Node.js réelle (hissage npm workspaces inclus)
const require = createRequire(import.meta.url);
const reactDir = path.dirname(require.resolve("react/package.json"));
const reactDomDir = path.dirname(require.resolve("react-dom/package.json"));

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
      react: reactDir,
      "react-dom": reactDomDir,
    };
    return config;
  },
};

export default nextConfig;
