import Link from "next/link";

export const metadata = {
  title: "Mentions légales — Je Deviens Patron",
  description: "Mentions légales du site jedevienspatron.fr",
};

export default function MentionsLegalesPage() {
  return (
    <main className="min-h-screen bg-gray-950 py-16 px-6">
      <div className="max-w-3xl mx-auto">

        <Link href="/" className="text-emerald-400 text-sm hover:underline mb-8 inline-block">
          ← Retour à l&apos;accueil
        </Link>

        <h1 className="text-3xl font-black text-white mb-2">Mentions légales</h1>
        <p className="text-gray-500 text-sm mb-10">Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance en l&apos;économie numérique (LCEN)</p>

        <div className="space-y-10 text-gray-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-emerald-400 mb-3">1. Éditeur du site</h2>
            <p className="text-gray-400">
              <strong className="text-gray-200">Pierre Médan</strong><br />
              Auteur et éditeur de <em>Je Deviens Patron</em><br />
              36 rue de la Passerine, 57160 Scy-Chazelles, France<br />
              Adresse e-mail : <a href="mailto:profmedan@gmail.com" className="text-emerald-400 hover:underline">profmedan@gmail.com</a>
            </p>
            <p className="mt-3 text-gray-500 text-xs">
              Directeur de la publication : Pierre Médan
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-emerald-400 mb-3">2. Hébergement</h2>
            <p className="text-gray-400">
              Ce site est hébergé par :<br />
              <strong className="text-gray-200">Vercel Inc.</strong><br />
              440 N Barranca Ave #4133, Covina, CA 91723, États-Unis<br />
              Site web : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">vercel.com</a>
            </p>
            <p className="mt-3 text-gray-400">
              Gestion DNS :<br />
              <strong className="text-gray-200">OVHcloud</strong><br />
              2 rue Kellermann, 59100 Roubaix, France<br />
              Site web : <a href="https://www.ovhcloud.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">ovhcloud.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-emerald-400 mb-3">3. Propriété intellectuelle</h2>
            <p className="text-gray-400">
              L&apos;ensemble des contenus présents sur le site <strong className="text-gray-200">jedevienspatron.fr</strong> (textes, graphismes, logotypes, mécaniques de jeu, bases de données) est la propriété exclusive de Pierre Médan, sauf mentions contraires.
            </p>
            <p className="mt-3 text-gray-400">
              Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans l&apos;autorisation écrite préalable de Pierre Médan.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-emerald-400 mb-3">4. Responsabilité</h2>
            <p className="text-gray-400">
              Pierre Médan s&apos;efforce de maintenir les informations publiées sur ce site aussi exactes et à jour que possible. Cependant, il ne peut garantir l&apos;exactitude, la complétude ou l&apos;actualité des informations diffusées. L&apos;utilisateur est seul responsable de l&apos;usage qu&apos;il fait de ces informations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-emerald-400 mb-3">5. Données personnelles</h2>
            <p className="text-gray-400">
              Le traitement des données personnelles est décrit dans notre{" "}
              <Link href="/confidentialite" className="text-emerald-400 hover:underline">Politique de confidentialité</Link>.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-gray-800 flex gap-6 text-xs text-gray-600">
          <Link href="/cgu" className="hover:text-emerald-400 transition-colors">CGU</Link>
          <Link href="/confidentialite" className="hover:text-emerald-400 transition-colors">Politique de confidentialité</Link>
          <Link href="/contact" className="hover:text-emerald-400 transition-colors">Contact</Link>
        </div>

      </div>
    </main>
  );
}
