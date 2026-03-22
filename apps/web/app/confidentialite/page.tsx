import Link from "next/link";

export const metadata = {
  title: "Politique de confidentialité — Je Deviens Patron",
  description: "Politique de confidentialité et gestion des données personnelles de jedevienspatron.fr",
};

export default function ConfidentialitePage() {
  return (
    <main className="min-h-screen bg-gray-950 py-16 px-6">
      <div className="max-w-3xl mx-auto">

        <Link href="/" className="text-emerald-400 text-sm hover:underline mb-8 inline-block">
          ← Retour à l&apos;accueil
        </Link>

        <h1 className="text-3xl font-black text-white mb-2">Politique de confidentialité</h1>
        <p className="text-gray-500 text-sm mb-10">
          Conformément au Règlement Général sur la Protection des Données (RGPD — UE 2016/679) — Dernière mise à jour : mars 2026
        </p>

        <div className="space-y-10 text-gray-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-emerald-400 mb-3">1. Responsable du traitement</h2>
            <p className="text-gray-400">
              <strong className="text-gray-200">Pierre Médan</strong><br />
              Adresse e-mail : <a href="mailto:profmedan@gmail.com" className="text-emerald-400 hover:underline">profmedan@gmail.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-emerald-400 mb-3">2. Données collectées</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-gray-400 border-collapse mt-2">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 pr-4 text-gray-300 font-semibold">Donnée</th>
                    <th className="text-left py-2 pr-4 text-gray-300 font-semibold">Finalité</th>
                    <th className="text-left py-2 text-gray-300 font-semibold">Base légale</th>
                  </tr>
                </thead>
                <tbody className="space-y-1">
                  <tr className="border-b border-gray-800">
                    <td className="py-2 pr-4">Adresse e-mail</td>
                    <td className="py-2 pr-4">Authentification, notifications de compte</td>
                    <td className="py-2">Exécution du contrat</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-2 pr-4">Pseudo / nom d&apos;affichage</td>
                    <td className="py-2 pr-4">Identification dans le jeu</td>
                    <td className="py-2">Exécution du contrat</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-2 pr-4">Scores et résultats de parties</td>
                    <td className="py-2 pr-4">Tableau de bord pédagogique, historique</td>
                    <td className="py-2">Exécution du contrat</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-2 pr-4">Données de paiement</td>
                    <td className="py-2 pr-4">Achat de crédits (via Stripe — non stockées sur nos serveurs)</td>
                    <td className="py-2">Exécution du contrat</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Données de navigation (cookies techniques)</td>
                    <td className="py-2 pr-4">Fonctionnement du service (session auth)</td>
                    <td className="py-2">Intérêt légitime</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-emerald-400 mb-3">3. Durée de conservation</h2>
            <ul className="text-gray-400 space-y-2 list-disc list-inside">
              <li><strong className="text-gray-200">Données de compte</strong> : jusqu&apos;à la suppression du compte ou 3 ans d&apos;inactivité.</li>
              <li><strong className="text-gray-200">Résultats de parties</strong> : conservés tant que le compte est actif.</li>
              <li><strong className="text-gray-200">Données de paiement</strong> : gérées par Stripe selon leurs propres règles (non stockées sur nos serveurs).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-emerald-400 mb-3">4. Sous-traitants</h2>
            <p className="text-gray-400">Nous faisons appel aux sous-traitants suivants :</p>
            <ul className="mt-2 text-gray-400 space-y-2 list-disc list-inside">
              <li><strong className="text-gray-200">Supabase</strong> (base de données et authentification) — <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Politique de confidentialité</a></li>
              <li><strong className="text-gray-200">Vercel</strong> (hébergement) — <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Politique de confidentialité</a></li>
              <li><strong className="text-gray-200">Stripe</strong> (paiements) — <a href="https://stripe.com/fr/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Politique de confidentialité</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-emerald-400 mb-3">5. Vos droits (RGPD)</h2>
            <p className="text-gray-400">Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="mt-2 text-gray-400 space-y-1 list-disc list-inside">
              <li><strong className="text-gray-200">Droit d&apos;accès</strong> : obtenir une copie de vos données personnelles.</li>
              <li><strong className="text-gray-200">Droit de rectification</strong> : corriger des données inexactes.</li>
              <li><strong className="text-gray-200">Droit à l&apos;effacement</strong> : demander la suppression de vos données.</li>
              <li><strong className="text-gray-200">Droit à la portabilité</strong> : recevoir vos données dans un format structuré.</li>
              <li><strong className="text-gray-200">Droit d&apos;opposition</strong> : vous opposer au traitement de vos données.</li>
            </ul>
            <p className="mt-4 text-gray-400">
              Pour exercer ces droits, contactez-nous à :{" "}
              <a href="mailto:profmedan@gmail.com" className="text-emerald-400 hover:underline">profmedan@gmail.com</a>.
              Vous pouvez également déposer une réclamation auprès de la{" "}
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">CNIL</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-emerald-400 mb-3">6. Cookies</h2>
            <p className="text-gray-400">
              Ce site utilise uniquement des cookies techniques nécessaires au fonctionnement du service (session d&apos;authentification). Aucun cookie publicitaire ou de tracking tiers n&apos;est utilisé.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-gray-800 flex gap-6 text-xs text-gray-600">
          <Link href="/mentions-legales" className="hover:text-emerald-400 transition-colors">Mentions légales</Link>
          <Link href="/cgu" className="hover:text-emerald-400 transition-colors">CGU</Link>
          <Link href="/contact" className="hover:text-emerald-400 transition-colors">Contact</Link>
        </div>

      </div>
    </main>
  );
}
