import type { Metadata, Viewport } from "next";
import { Geist, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "JE DEVIENS PATRON — Jeu sérieux de comptabilité",
  description: "Comprenez la comptabilité et la gestion d'entreprise en jouant — guidé pas à pas. 4 univers métier, 9 étapes par trimestre. Par Pierre Médan.",
  openGraph: {
    title: "JE DEVIENS PATRON — Jeu sérieux de comptabilité",
    description: "Comprenez la comptabilité et la gestion d'entreprise en jouant — guidé pas à pas.",
    url: "https://jedevienspatron.fr",
    siteName: "Je Deviens Patron",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JE DEVIENS PATRON — Jeu sérieux de comptabilité",
    description: "Comprenez la comptabilité et la gestion d'entreprise en jouant.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body className={`${geist.variable} ${ibmPlexSans.variable} antialiased bg-gray-950 text-gray-100`} style={{ fontFamily: "var(--font-ibm-plex-sans), var(--font-geist-sans), sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
