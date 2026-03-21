import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JE DEVIENS PATRON — Jeu sérieux de comptabilité",
  description: "Apprenez la comptabilité générale en jouant — par Pierre Médan",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${geist.variable} antialiased bg-gray-950 text-gray-100`}>
        {children}
      </body>
    </html>
  );
}
