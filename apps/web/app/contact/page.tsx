import Link from "next/link";
import { Mail, MessageSquare } from "lucide-react";

export const metadata = {
  title: "Contact — Je Deviens Patron",
  description: "Contacter l'équipe de Je Deviens Patron",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-950 py-16 px-6">
      <div className="max-w-2xl mx-auto">

        <Link href="/" className="text-emerald-400 text-sm hover:underline mb-8 inline-block">
          ← Retour à l&apos;accueil
        </Link>

        <h1 className="text-3xl font-black text-white mb-2">Contact</h1>
        <p className="text-gray-500 text-sm mb-10">
          Une question sur le jeu, une demande RGPD, un signalement de bug ? Écrivez-nous.
        </p>

        <div className="space-y-6">

          {/* Email principal */}
          <div className="rounded-2xl border border-emerald-700/40 bg-gray-800/40 p-6 flex items-start gap-4">
            <div className="inline-flex p-3 rounded-xl bg-emerald-950/50 text-emerald-400 shrink-0">
              <Mail size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-100 mb-1">Adresse e-mail</h2>
              <a
                href="mailto:profmedan@gmail.com"
                className="text-emerald-400 hover:underline font-mono text-sm"
              >
                profmedan@gmail.com
              </a>
              <p className="text-gray-500 text-xs mt-2">
                Pour toute question générale, demande pédagogique, ou exercice de vos droits RGPD.
              </p>
            </div>
          </div>

          {/* Sujets */}
          <div className="rounded-2xl border border-gray-700/40 bg-gray-800/30 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={18} className="text-gray-400" />
              <h2 className="text-base font-bold text-gray-100">Pour nous écrire, précisez votre sujet</h2>
            </div>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">→</span>
                <span><strong className="text-gray-200">[BUG]</strong> Signalement d&apos;un dysfonctionnement technique</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">→</span>
                <span><strong className="text-gray-200">[RGPD]</strong> Accès, rectification ou suppression de vos données</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">→</span>
                <span><strong className="text-gray-200">[PÉDAGOGIE]</strong> Question sur le contenu ou les mécaniques du jeu</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">→</span>
                <span><strong className="text-gray-200">[PAIEMENT]</strong> Problème de facturation ou remboursement</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">→</span>
                <span><strong className="text-gray-200">[PARTENARIAT]</strong> Collaboration institutionnelle ou commerciale</span>
              </li>
            </ul>
          </div>

          {/* Délai de réponse */}
          <p className="text-xs text-gray-600 text-center">
            Délai de réponse habituel : 2 à 5 jours ouvrés.
          </p>

        </div>

        <div className="mt-12 pt-6 border-t border-gray-800 flex gap-6 text-xs text-gray-600">
          <Link href="/mentions-legales" className="hover:text-emerald-400 transition-colors">Mentions légales</Link>
          <Link href="/cgu" className="hover:text-emerald-400 transition-colors">CGU</Link>
          <Link href="/confidentialite" className="hover:text-emerald-400 transition-colors">Politique de confidentialité</Link>
        </div>

      </div>
    </main>
  );
}
