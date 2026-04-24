// SEC-bypass (2026-04-24) — layout server component dédié à `/jeu` pour
// exposer les métadonnées SEO. La page elle-même (page.tsx) est client-side
// ("use client"), donc elle ne peut pas exporter `metadata`. Ce layout minimal
// n'ajoute aucun markup (passe les children tels quels) mais déclare
// `robots: noindex, nofollow` pour empêcher Google d'indexer les URL sensibles
// du type `/jeu?access=bypass` ou `/jeu?code=KIC-XXXX`.
//
// Complément : `public/robots.txt` ajoute `Disallow: /jeu` (ceinture + bretelles).

import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function JeuLayout({ children }: { children: React.ReactNode }) {
  return children;
}
