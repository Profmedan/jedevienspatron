import Link from "next/link";

export const metadata = {
  title: "Conditions Générales d'Utilisation — Je Deviens Patron",
  description: "CGU du service jedevienspatron.fr",
};

export default function CguPage() {
  return (
    <main className="min-h-screen bg-gray-950 py-16 px-6">
      <div className="max-w-3xl mx-auto">

        <Link href="/" className="text-emerald-400 text-sm hover:underline mb-8 inline-block">
          ← Retour à l&apos;accueil
        </Link>

        <h1 className="text-3xl font-black text-white mb-2">Conditions Générales d&apos;Utilisation</h1>
        <p className="text-gray-500 text-sm mb-10">Dernière mise à jour : mars 2026 — En utilisant jedevienspatron.fr, vous acceptez les présentes CGU.</p>

        <div className="space-y-10 text-gray-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-emerald-400 mb-3">1. Objet</h2>
            <p className="text-gray-400">
              Les présentes Conditions Générales d&apos;Utilisation (CGU) définissent les modalités d&apos;accès et d&apos;utilisation du service <strong className="text-gray-200">Je Deviens Patron</strong>, jeu sérieux de simulation de comptabilité/gestion d&apos;entreprise, accessible à l&apos;adresse <strong className="text-gray-200">jedevienspatron.fr</strong>.
            </p>
            <p className="mt-3 text-gray-400">
              Le service est édité par Pierre Médan (ci-après « l&apos;Éditeur »).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-emerald-400 mb-3">2. Accès au service</h2>
            <p className="text-gray-400">Le service propose plusieurs modes d&apos;accès :</p>
            <ul className="mt-2 space-y-1 text-gray-400 list-disc list-inside">
              <li><strong className="text-gray-200">Apprenant avec code de session</strong> : accès sans inscription via un code fourni par un formateur.</li>
              <li><strong className="text-gray-200">Joueur solo</strong> : accès après création d&apos;un compte et consommation d&apos;un crédit.</li>
              <li><strong className="text-gray-200">Enseignant / Formateur</strong> : accès après création d&apos;un compte, achat de crédits et création de sessions de jeu.</li>
            </ul>
            <p className="mt-3 text-gray-400">
              L&apos;Éditeur se réserve le droit de modifier, suspendre ou interrompre l&apos;accès au service à tout moment, notamment pour maintenance, sans préavis.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-emerald-400 mb-3">3. Compte utilisateur</h2>
            <p className="text-gray-400">
              La création d&apos;un compte nécessite une adresse e-mail valide. L&apos;utilisateur est responsable de la confidentialité de ses identifiants et de toute activité réalisée depuis son compte.
            </p>
            <p className="mt-3 text-gray-400">
              L&apos;Éditeur se réserve le droit de suspendre ou supprimer tout compte en cas de violation des présentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-emerald-400 mb-3">4. Crédits et paiements</h2>
            <p className="text-gray-400">
              L&apos;accès à certaines fonctionnalités (création de sessions, jeu solo) requiert l&apos;achat de crédits via la plateforme de paiement sécurisée Stripe. Les prix sont indiqués en euros TTC sur la page des packs.
            </p>
            <p className="mt-3 text-gray-400">
              Les crédits achetés ont une durée de validité indiquée lors de l&apos;achat. Passé ce délai, les crédits non utilisés sont perdus sans possibilité de remboursement.
            </p>
            <p className="mt-3 text-gray-400">
              Conformément à l&apos;article L221-28 du Code de la consommation, en raison de la nature numérique du contenu, il n&apos;est pas possible d&apos;exercer le droit de rétractation une fois les crédits consommés.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-emerald-400 mb-3">5. Propriété intellectuelle</h2>
            <p className="text-gray-400">
              Tous les éléments du jeu (mécaniques, données, textes pédagogiques, interfaces) sont la propriété exclusive de Pierre Médan. Toute reproduction, même partielle, est interdite sans autorisation écrite préalable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-emerald-400 mb-3">6. Responsabilité</h2>
            <p className="text-gray-400">
              <em>Je Deviens Patron</em> est un jeu pédagogique de simulation. Les mécaniques financières et comptables sont volontairement simplifiées à des fins d&apos;apprentissage. L&apos;Éditeur décline toute responsabilité pour une utilisation du jeu à des fins autres qu&apos;éducatives.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-emerald-400 mb-3">7. Modification des CGU</h2>
            <p className="text-gray-400">
              L&apos;Éditeur se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés par e-mail en cas de modification substantielle. La poursuite de l&apos;utilisation du service vaut acceptation des nouvelles CGU.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-emerald-400 mb-3">8. Droit applicable</h2>
            <p className="text-gray-400">
              Les présentes CGU sont soumises au droit français. En cas de litige, les tribunaux français sont seuls compétents.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-gray-800 flex gap-6 text-xs text-gray-600">
          <Link href="/mentions-legales" className="hover:text-emerald-400 transition-colors">Mentions légales</Link>
          <Link href="/confidentialite" className="hover:text-emerald-400 transition-colors">Politique de confidentialité</Link>
          <Link href="/contact" className="hover:text-emerald-400 transition-colors">Contact</Link>
        </div>

      </div>
    </main>
  );
}
