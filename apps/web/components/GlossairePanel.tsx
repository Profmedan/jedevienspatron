"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TermeGlossaire {
  id: string;
  terme: string;
  categorie: "bilan" | "cr" | "compta" | "indicateur" | "etape";
  court: string; // résumé 1 ligne affiché dans la liste
  contenu: React.ReactNode; // explication complète
}

// ─── Contenu du glossaire ─────────────────────────────────────────────────────

const TERMES: TermeGlossaire[] = [
  // ── A ──
  {
    id: "actif",
    terme: "Actif",
    categorie: "bilan",
    court: "Ce que possède l'entreprise (emplois des ressources)",
    contenu: (
      <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
        <p>L'<strong className="text-gray-100">Actif</strong> représente l'ensemble des biens et droits détenus par l'entreprise. C'est la colonne gauche du bilan.</p>
        <div className="bg-blue-950/30 border border-blue-800/40 rounded-lg p-2">
          <div className="font-bold text-blue-300 mb-1">Composition</div>
          <div className="space-y-0.5 text-blue-200">
            <div>🏭 <strong>Immobilisations</strong> — biens durables (usine, machine, brevet…)</div>
            <div>📦 <strong>Stocks</strong> — marchandises à revendre</div>
            <div>📋 <strong>Créances</strong> — argent dû par les clients</div>
            <div>💰 <strong>Trésorerie</strong> — liquidités disponibles</div>
          </div>
        </div>
        <p className="text-amber-300 text-[11px] font-semibold">⚖️ Règle fondamentale : TOTAL ACTIF = TOTAL PASSIF</p>
      </div>
    ),
  },
  {
    id: "amortissement",
    terme: "Amortissement",
    categorie: "compta",
    court: "Constatation comptable de l'usure d'une immobilisation",
    contenu: (
      <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
        <p>L'<strong className="text-gray-100">amortissement</strong> traduit la perte de valeur progressive d'un bien immobilisé due à l'usage, au temps ou à l'obsolescence.</p>
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3">
          <div className="font-bold text-gray-200 mb-2 text-center">✍️ Écriture chaque trimestre</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-red-950/30 border border-red-800/40 rounded p-2 text-center">
              <div className="font-black text-red-300">DÉBIT</div>
              <div className="text-red-400 text-[10px] mt-0.5">681 — Dotation aux amort.</div>
              <div className="text-gray-400 text-[10px]">Charge → réduit le résultat</div>
            </div>
            <div className="bg-blue-950/30 border border-blue-800/40 rounded p-2 text-center">
              <div className="font-black text-blue-300">CRÉDIT</div>
              <div className="text-blue-400 text-[10px] mt-0.5">28x — Amort. immos nettes</div>
              <div className="text-gray-400 text-[10px]">Valeur nette du Bilan ↓</div>
            </div>
          </div>
        </div>
        <div className="bg-amber-950/30 border border-amber-700/40 rounded-lg p-2">
          <span className="font-bold text-amber-300">💡 Clé PCG :</span>
          <span className="text-amber-200"> L'amortissement est une charge <em>calculée</em>, pas une sortie de trésorerie. L'argent reste en banque, mais le résultat net diminue.</span>
        </div>
        <p className="text-emerald-300 text-[11px] font-semibold">CAF = Résultat net + Dotations aux amortissements</p>
      </div>
    ),
  },
  // ── B ──
  {
    id: "bfr",
    terme: "BFR — Besoin en Fonds de Roulement",
    categorie: "indicateur",
    court: "Besoin de financement lié au cycle d'exploitation",
    contenu: (
      <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
        <p>Le <strong className="text-gray-100">BFR</strong> mesure le décalage de trésorerie entre les encaissements et les décaissements liés à l'activité courante.</p>
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-2 font-mono text-center">
          <span className="text-blue-300">Stocks + Créances</span>
          <span className="text-gray-400"> − </span>
          <span className="text-orange-300">Dettes fournisseurs</span>
          <span className="text-gray-400"> = </span>
          <span className="text-indigo-300 font-bold">BFR</span>
        </div>
        <div className="space-y-1">
          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded p-1.5 text-emerald-300 text-[11px]">✅ <strong>BFR ≤ FR</strong> : situation saine, la trésorerie est positive</div>
          <div className="bg-red-950/30 border border-red-800/40 rounded p-1.5 text-red-300 text-[11px]">⚠️ <strong>BFR &gt; FR</strong> : risque de rupture de trésorerie</div>
        </div>
      </div>
    ),
  },
  {
    id: "bilan",
    terme: "Bilan comptable",
    categorie: "bilan",
    court: "Photo du patrimoine de l'entreprise à un instant T",
    contenu: (
      <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
        <p>Le <strong className="text-gray-100">bilan</strong> est un document de synthèse qui présente, à une date donnée, l'ensemble du patrimoine de l'entreprise.</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-blue-950/30 border border-blue-700/50 rounded-lg p-2">
            <div className="font-bold text-blue-300 mb-1">📤 ACTIF (Emplois)</div>
            <div className="text-blue-200 text-[10px] space-y-0.5">
              <div>• Immobilisations</div>
              <div>• Stocks</div>
              <div>• Créances</div>
              <div>• Trésorerie</div>
            </div>
          </div>
          <div className="bg-orange-950/30 border border-orange-700/50 rounded-lg p-2">
            <div className="font-bold text-orange-300 mb-1">📥 PASSIF (Ressources)</div>
            <div className="text-orange-200 text-[10px] space-y-0.5">
              <div>• Capitaux propres</div>
              <div>• Emprunts</div>
              <div>• Dettes</div>
            </div>
          </div>
        </div>
        <p className="text-amber-300 text-[11px] font-bold text-center">ACTIF = PASSIF (toujours)</p>
      </div>
    ),
  },
  // ── C ──
  {
    id: "caf",
    terme: "CAF — Capacité d'Autofinancement",
    categorie: "indicateur",
    court: "Flux de trésorerie généré par l'activité (résultat + dotations)",
    contenu: (
      <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
        <p>La <strong className="text-gray-100">CAF</strong> mesure la richesse réellement disponible, en réintégrant les charges calculées (amortissements) qui n'entraînent pas de sortie d'argent.</p>
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-2 font-mono text-center">
          <span className="text-emerald-300">Résultat net</span>
          <span className="text-gray-400"> + </span>
          <span className="text-blue-300">Dotations aux amortissements</span>
          <span className="text-gray-400"> = </span>
          <span className="text-indigo-300 font-bold">CAF</span>
        </div>
        <p>Une CAF positive permet de rembourser les emprunts, d'investir et de distribuer des dividendes.</p>
      </div>
    ),
  },
  {
    id: "capitaux",
    terme: "Capitaux propres",
    categorie: "bilan",
    court: "Apports des associés + bénéfices accumulés",
    contenu: (
      <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
        <p>Les <strong className="text-gray-100">capitaux propres</strong> représentent les ressources appartenant à l'entreprise elle-même : apports initiaux des associés et bénéfices mis en réserve.</p>
        <div className="bg-orange-950/30 border border-orange-700/40 rounded-lg p-2">
          <div className="text-orange-300 text-[11px] font-bold mb-1">Composition</div>
          <div className="text-orange-200 space-y-0.5 text-[10px]">
            <div>💼 Capital social (apports des fondateurs)</div>
            <div>📈 Résultats des exercices précédents mis en réserve</div>
            <div>📊 Résultat net de l'exercice en cours</div>
          </div>
        </div>
        <p>À chaque clôture annuelle, le résultat net s'intègre aux capitaux propres, augmentant la solidité financière.</p>
      </div>
    ),
  },
  {
    id: "charges",
    terme: "Charges",
    categorie: "cr",
    court: "Dépenses qui réduisent le résultat net",
    contenu: (
      <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
        <p>Les <strong className="text-gray-100">charges</strong> sont des consommations de ressources qui appauvrissent l'entreprise. Elles diminuent le résultat net.</p>
        <div className="bg-red-950/30 border border-red-700/40 rounded-lg p-2 space-y-1">
          <div className="font-bold text-red-300 text-[11px] mb-1">Types de charges</div>
          <div className="text-red-200 text-[10px] space-y-0.5">
            <div>📦 Achats / CMV (coût des marchandises vendues)</div>
            <div>🔌 Services extérieurs (loyer, énergie, tél.)</div>
            <div>👔 Charges de personnel (salaires)</div>
            <div>📉 Dotations aux amortissements</div>
            <div>💳 Charges d'intérêt (emprunt)</div>
            <div>⚡ Charges exceptionnelles</div>
          </div>
        </div>
        <p className="text-[11px]">Écriture : <span className="text-blue-300">DÉBIT Compte de charge</span> / <span className="text-orange-300">CRÉDIT Trésorerie ou Dettes</span></p>
      </div>
    ),
  },
  {
    id: "creances",
    terme: "Créances clients",
    categorie: "bilan",
    court: "Argent dû par les clients (ventes non encore encaissées)",
    contenu: (
      <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
        <p>Les <strong className="text-gray-100">créances clients</strong> représentent les ventes déjà comptabilisées mais pas encore encaissées. Elles figurent à l'Actif du bilan.</p>
        <div className="bg-blue-950/30 border border-blue-700/40 rounded-lg p-2">
          <div className="text-blue-300 text-[11px] font-bold mb-1">Délais dans le jeu</div>
          <div className="text-blue-200 text-[10px] space-y-0.5">
            <div>💵 <strong>C+0</strong> : encaissé immédiatement → Trésorerie</div>
            <div>⏰ <strong>C+1</strong> : encaissé dans 1 trimestre</div>
            <div>⏰⏰ <strong>C+2</strong> : encaissé dans 2 trimestres</div>
          </div>
        </div>
        <p className="text-amber-300 text-[11px]">⚠️ Une forte proportion de Créances C+2 (Grands Comptes) peut fragiliser la trésorerie malgré un bon chiffre d'affaires.</p>
      </div>
    ),
  },
  {
    id: "credit",
    terme: "Crédit (écriture)",
    categorie: "compta",
    court: "Colonne droite d'un compte — ressource ou diminution d'actif",
    contenu: (
      <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
        <p>En comptabilité en partie double, le <strong className="text-gray-100">crédit</strong> est la colonne de droite d'un compte. Il traduit une <em>ressource</em> ou une <em>diminution d'un actif</em>.</p>
        <div className="bg-orange-950/30 border border-orange-700/40 rounded-lg p-2">
          <div className="text-orange-300 text-[11px] font-bold mb-1">Le crédit augmente…</div>
          <div className="text-orange-200 text-[10px] space-y-0.5">
            <div>📥 Les capitaux propres, les dettes, les produits</div>
          </div>
          <div className="text-orange-300 text-[11px] font-bold mt-2 mb-1">Le crédit diminue…</div>
          <div className="text-orange-200 text-[10px]">
            <div>📤 La trésorerie, les stocks, les immobilisations</div>
          </div>
        </div>
        <p className="text-indigo-300 text-[11px] font-bold">Règle : Σ Débits = Σ Crédits dans chaque écriture</p>
      </div>
    ),
  },
  // ── D ──
  {
    id: "debit",
    terme: "Débit (écriture)",
    categorie: "compta",
    court: "Colonne gauche d'un compte — emploi ou augmentation d'actif",
    contenu: (
      <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
        <p>En comptabilité en partie double, le <strong className="text-gray-100">débit</strong> est la colonne de gauche d'un compte. Il traduit un <em>emploi</em> ou une <em>augmentation d'actif</em>.</p>
        <div className="bg-blue-950/30 border border-blue-700/40 rounded-lg p-2">
          <div className="text-blue-300 text-[11px] font-bold mb-1">Le débit augmente…</div>
          <div className="text-blue-200 text-[10px] space-y-0.5">
            <div>📤 La trésorerie, les stocks, les immobilisations, les charges</div>
          </div>
          <div className="text-blue-300 text-[11px] font-bold mt-2 mb-1">Le débit diminue…</div>
          <div className="text-blue-200 text-[10px]">
            <div>📥 Les dettes, les capitaux propres, les produits</div>
          </div>
        </div>
        <p className="text-indigo-300 text-[11px] font-bold">Règle : Σ Débits = Σ Crédits dans chaque écriture</p>
      </div>
    ),
  },
  {
    id: "dettes",
    terme: "Dettes fournisseurs",
    categorie: "bilan",
    court: "Achats reçus mais pas encore payés (crédit fournisseur)",
    contenu: (
      <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
        <p>Les <strong className="text-gray-100">dettes fournisseurs</strong> (ou dettes à court terme) correspondent aux achats déjà enregistrés mais pas encore réglés. Elles figurent au Passif du bilan.</p>
        <div className="bg-orange-950/30 border border-orange-700/40 rounded-lg p-2 text-[10px] text-orange-200">
          <strong className="text-orange-300">Dans le jeu :</strong> acheter des marchandises "à crédit" crée une dette fournisseur de −1 remboursée au trimestre suivant.
        </div>
        <p className="text-[11px]">Avantage : préserver la trésorerie à court terme. Risque : dette à rembourser le trimestre suivant.</p>
      </div>
    ),
  },
  {
    id: "dotation",
    terme: "Dotation aux amortissements",
    categorie: "cr",
    court: "Charge calculée constatant l'usure annuelle des immobilisations",
    contenu: (
      <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
        <p>La <strong className="text-gray-100">dotation aux amortissements</strong> (compte 681 PCG) est la charge comptabilisée chaque trimestre pour constater la dépréciation des immobilisations.</p>
        <div className="text-[11px] space-y-1">
          <div className="bg-red-950/30 border border-red-800/40 rounded p-1.5 text-red-200">📉 Elle réduit le résultat net</div>
          <div className="bg-blue-950/30 border border-blue-800/40 rounded p-1.5 text-blue-200">📋 Elle réduit la valeur nette des immobilisations au Bilan</div>
          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded p-1.5 text-emerald-200">💰 Elle n'entraîne AUCUNE sortie de trésorerie</div>
        </div>
        <p>Formule : Dotation = Σ(−1 par immobilisation active ce trimestre)</p>
      </div>
    ),
  },
  // ── E ──
  {
    id: "ecriture",
    terme: "Écriture comptable",
    categorie: "compta",
    court: "Enregistrement d'une opération affectant au moins 2 comptes",
    contenu: (
      <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
        <p>Une <strong className="text-gray-100">écriture comptable</strong> est l'enregistrement d'une opération économique dans les comptes, en respectant le principe de la partie double.</p>
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-2">
          <div className="text-gray-300 text-[11px] font-bold mb-1">Exemple : paiement loyer de 2</div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-blue-950/30 rounded p-1.5 text-blue-200">📤 DÉBIT 6x Services ext. +2</div>
            <div className="bg-orange-950/30 rounded p-1.5 text-orange-200">📥 CRÉDIT 512 Trésorerie −2</div>
          </div>
        </div>
        <p className="text-indigo-300 text-[11px] font-bold">Toujours : Σ Débits = Σ Crédits</p>
      </div>
    ),
  },
  {
    id: "emprunt",
    terme: "Emprunt bancaire",
    categorie: "bilan",
    court: "Dette financière à long terme envers une banque",
    contenu: (
      <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
        <p>L'<strong className="text-gray-100">emprunt bancaire</strong> est une dette financière contractée auprès d'une banque pour financer des investissements durables.</p>
        <div className="bg-orange-950/30 border border-orange-700/40 rounded-lg p-2 text-[10px] text-orange-200 space-y-0.5">
          <div>• Il figure au Passif du bilan</div>
          <div>• Il génère des <strong className="text-orange-300">charges d'intérêt</strong> (compte 661)</div>
          <div>• Il se rembourse de −1 par trimestre dans le jeu</div>
        </div>
        <p className="text-[11px]">L'emprunt a permis de financer les immobilisations de départ. Sans emprunter, pas d'outil de production.</p>
      </div>
    ),
  },
  {
    id: "equilibre",
    terme: "Équilibre du bilan",
    categorie: "compta",
    court: "Principe fondamental : ACTIF = PASSIF à tout moment",
    contenu: (
      <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
        <p>Le <strong className="text-gray-100">principe d'équilibre</strong> stipule que le total de l'Actif est toujours égal au total du Passif. C'est une conséquence directe de la partie double.</p>
        <div className="bg-emerald-950/40 border-2 border-emerald-700 rounded-lg p-3 text-center">
          <span className="text-blue-300 font-bold">ACTIF</span>
          <span className="text-gray-400 mx-2">=</span>
          <span className="text-orange-300 font-bold">PASSIF</span>
        </div>
        <div className="bg-indigo-950/30 border border-indigo-700/40 rounded-lg p-2 text-[11px] text-indigo-200">
          Chaque opération touche au minimum deux comptes de façon opposée → l'équilibre est toujours respecté. Si le bilan n'est pas équilibré, une écriture est manquante ou erronée.
        </div>
      </div>
    ),
  },
  // ── F ──
  {
    id: "fr",
    terme: "Fonds de Roulement (FR)",
    categorie: "indicateur",
    court: "Excédent des ressources longues sur les emplois longs",
    contenu: (
      <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
        <p>Le <strong className="text-gray-100">Fonds de Roulement</strong> mesure la marge de sécurité financière : ce qu'il reste des ressources longues (capitaux + emprunts) après financement des immobilisations.</p>
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-2 font-mono text-center text-[11px]">
          <span className="text-orange-300">(Capitaux + Emprunts)</span>
          <span className="text-gray-400"> − </span>
          <span className="text-blue-300">Immobilisations</span>
          <span className="text-gray-400"> = </span>
          <span className="text-indigo-300 font-bold">FR</span>
        </div>
        <div className="space-y-1 text-[11px]">
          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded p-1.5 text-emerald-300">✅ FR &gt; 0 : ressources longues financent aussi le cycle d'exploitation</div>
          <div className="bg-red-950/30 border border-red-800/40 rounded p-1.5 text-red-300">⚠️ FR &lt; 0 : les immobilisations sont financées par des dettes courtes → risque</div>
        </div>
      </div>
    ),
  },
  // ── I ──
  {
    id: "immobilisations",
    terme: "Immobilisations",
    categorie: "bilan",
    court: "Biens durables détenus pour l'activité (> 1 exercice)",
    contenu: (
      <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
        <p>Les <strong className="text-gray-100">immobilisations</strong> sont des actifs dont la durée d'utilisation est supérieure à un exercice. Elles sont amorties progressivement.</p>
        <div className="bg-blue-950/30 border border-blue-700/40 rounded-lg p-2 text-[10px] text-blue-200 space-y-1">
          <div>🏭 Usine (6 trim.) · 🚛 Camion (6 trim.) · 🏪 Showroom (5 trim.)</div>
          <div>💡 Brevet (5 trim.) · 🚗 Voiture (3 trim.) · 💻 Matériel info (3 trim.)</div>
          <div>🚐 Camionnette (2 trim.) · ⚙️ Machine (2 trim.)</div>
        </div>
        <p>Chaque trimestre, chaque immobilisation perd −1 de valeur (amortissement linéaire simplifié).</p>
      </div>
    ),
  },
  // ── P ──
  {
    id: "partie-double",
    terme: "Partie double",
    categorie: "compta",
    court: "Principe : toute opération touche ≥ 2 comptes (Σ Débits = Σ Crédits)",
    contenu: (
      <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
        <p>La <strong className="text-gray-100">partie double</strong> est le fondement de la comptabilité moderne. Toute transaction économique se traduit par au moins deux écritures de montants égaux et opposés.</p>
        <div className="bg-indigo-950/30 border border-indigo-700/40 rounded-lg p-2 text-[11px] text-indigo-200">
          <strong className="text-indigo-300">Exemple :</strong> vente de marchandises à 3€ payée comptant<br/>
          📤 DÉBIT Trésorerie +3 / 📥 CRÉDIT Ventes +3<br/>
          📤 DÉBIT CMV +2 / 📥 CRÉDIT Stocks −2
        </div>
        <p className="text-amber-300 text-[11px] font-bold">Σ Débits (5) = Σ Crédits (5) ✓ — le bilan reste équilibré</p>
      </div>
    ),
  },
  {
    id: "passif",
    terme: "Passif",
    categorie: "bilan",
    court: "Ce qui finance l'entreprise (ressources : capitaux + dettes)",
    contenu: (
      <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
        <p>Le <strong className="text-gray-100">Passif</strong> représente l'ensemble des ressources qui financent l'entreprise. C'est la colonne droite du bilan.</p>
        <div className="bg-orange-950/20 border border-orange-700/40 rounded-lg p-2">
          <div className="font-bold text-orange-300 mb-1 text-[11px]">Composition</div>
          <div className="text-orange-200 text-[10px] space-y-0.5">
            <div>💼 <strong>Capitaux propres</strong> — apports des associés + bénéfices</div>
            <div>🏦 <strong>Emprunts</strong> — dettes financières long terme</div>
            <div>📋 <strong>Dettes fournisseurs</strong> — achats non encore payés</div>
            <div>🏛️ <strong>Dettes fiscales</strong> — impôts à payer</div>
          </div>
        </div>
        <p className="text-amber-300 text-[11px] font-semibold">⚖️ TOTAL PASSIF = TOTAL ACTIF (toujours)</p>
      </div>
    ),
  },
  {
    id: "produits",
    terme: "Produits",
    categorie: "cr",
    court: "Revenus qui augmentent le résultat net",
    contenu: (
      <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
        <p>Les <strong className="text-gray-100">produits</strong> sont des revenus qui enrichissent l'entreprise. Ils augmentent le résultat net.</p>
        <div className="bg-emerald-950/30 border border-emerald-700/40 rounded-lg p-2 space-y-1 text-[10px] text-emerald-200">
          <div>📈 <strong>Ventes</strong> — chiffre d'affaires principal</div>
          <div>💰 <strong>Produits financiers</strong> — intérêts reçus</div>
          <div>⭐ <strong>Revenus exceptionnels</strong> — subventions, ventes exceptionnelles</div>
        </div>
        <p className="text-[11px]">Écriture : <span className="text-blue-300">DÉBIT Trésorerie ou Créance</span> / <span className="text-orange-300">CRÉDIT Compte de produit</span></p>
      </div>
    ),
  },
  // ── R ──
  {
    id: "resultat-net",
    terme: "Résultat net",
    categorie: "cr",
    court: "Bénéfice ou perte de la période (Produits − Charges)",
    contenu: (
      <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
        <p>Le <strong className="text-gray-100">résultat net</strong> est la mesure de la performance économique de l'entreprise sur une période donnée.</p>
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-2 font-mono text-center text-[11px]">
          <span className="text-emerald-300">Produits</span>
          <span className="text-gray-400"> − </span>
          <span className="text-red-300">Charges</span>
          <span className="text-gray-400"> = </span>
          <span className="text-indigo-300 font-bold">Résultat net</span>
        </div>
        <div className="space-y-1 text-[11px]">
          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded p-1.5 text-emerald-300">✅ &gt; 0 : bénéfice — s'intègre aux capitaux propres à la clôture</div>
          <div className="bg-red-950/30 border border-red-800/40 rounded p-1.5 text-red-300">⚠️ &lt; 0 : perte — érode les capitaux propres</div>
        </div>
        <p>À la clôture annuelle (tous les 4 trimestres), le résultat est intégré aux capitaux propres du Passif.</p>
      </div>
    ),
  },
  // ── S ──
  {
    id: "solvabilite",
    terme: "Solvabilité",
    categorie: "indicateur",
    court: "Capacité à rembourser ses dettes à long terme",
    contenu: (
      <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
        <p>La <strong className="text-gray-100">solvabilité</strong> mesure la capacité de l'entreprise à honorer ses engagements financiers à long terme grâce à ses capitaux propres.</p>
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-2 font-mono text-center text-[11px]">
          <span className="text-orange-300">Capitaux propres</span>
          <span className="text-gray-400"> ÷ </span>
          <span className="text-blue-300">Total Actif</span>
          <span className="text-gray-400"> × 100 = </span>
          <span className="text-indigo-300 font-bold">Ratio (%)</span>
        </div>
        <div className="space-y-1 text-[11px]">
          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded p-1.5 text-emerald-300">✅ ≥ 33% : solide</div>
          <div className="bg-amber-950/30 border border-amber-800/40 rounded p-1.5 text-amber-300">🔶 20–33% : acceptable</div>
          <div className="bg-red-950/30 border border-red-800/40 rounded p-1.5 text-red-300">⚠️ &lt; 20% : fragile — risque d'insolvabilité</div>
        </div>
      </div>
    ),
  },
  {
    id: "stocks",
    terme: "Stocks",
    categorie: "bilan",
    court: "Marchandises détenues en vue d'être vendues",
    contenu: (
      <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
        <p>Les <strong className="text-gray-100">stocks</strong> représentent les marchandises, matières premières ou produits finis détenus par l'entreprise pour son activité. Ils figurent à l'Actif du bilan.</p>
        <div className="bg-blue-950/30 border border-blue-700/40 rounded-lg p-2 text-[10px] text-blue-200 space-y-0.5">
          <div>📦 Achat de stock : DÉBIT Stocks / CRÉDIT Trésorerie ou Dettes</div>
          <div>📉 Vente consommant du stock : DÉBIT CMV / CRÉDIT Stocks</div>
        </div>
        <p>Un stock trop élevé immobilise de la trésorerie. Un stock trop faible peut freiner les ventes.</p>
      </div>
    ),
  },
  // ── T ──
  {
    id: "tresorerie",
    terme: "Trésorerie",
    categorie: "bilan",
    court: "Liquidités disponibles immédiatement (banque, caisse)",
    contenu: (
      <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
        <p>La <strong className="text-gray-100">trésorerie</strong> correspond aux disponibilités immédiates : comptes bancaires, caisse. C'est le nerf de la guerre de l'entreprise.</p>
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-2 font-mono text-center text-[11px]">
          <span className="text-indigo-300">FR</span>
          <span className="text-gray-400"> − </span>
          <span className="text-amber-300">BFR</span>
          <span className="text-gray-400"> = </span>
          <span className="text-emerald-300 font-bold">Trésorerie nette</span>
        </div>
        <div className="space-y-1 text-[11px]">
          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded p-1.5 text-emerald-300">✅ &gt; 0 : l'entreprise peut faire face à ses décaissements</div>
          <div className="bg-red-950/30 border border-red-800/40 rounded p-1.5 text-red-300">⚠️ Découvert → risque de faillite si persistant</div>
        </div>
      </div>
    ),
  },
];

// ─── Composant ────────────────────────────────────────────────────────────────

const CATEGORIE_LABELS: Record<string, { label: string; color: string }> = {
  bilan:      { label: "Bilan",             color: "text-blue-400 bg-blue-950/30 border-blue-800/40" },
  cr:         { label: "Compte de résultat", color: "text-emerald-400 bg-emerald-950/30 border-emerald-800/40" },
  compta:     { label: "Comptabilité",       color: "text-indigo-400 bg-indigo-950/30 border-indigo-800/40" },
  indicateur: { label: "Indicateur",         color: "text-amber-400 bg-amber-950/30 border-amber-800/40" },
  etape:      { label: "Étape de jeu",       color: "text-purple-400 bg-purple-950/30 border-purple-800/40" },
};

export function GlossairePanel() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<string>("");

  const termesFiltrés = TERMES.filter((t) =>
    filtre === "" ||
    t.terme.toLowerCase().includes(filtre.toLowerCase()) ||
    t.court.toLowerCase().includes(filtre.toLowerCase())
  ).sort((a, b) => a.terme.localeCompare(b.terme, "fr"));

  // Groupes alphabétiques
  const groupes = termesFiltrés.reduce<Record<string, TermeGlossaire[]>>((acc, t) => {
    const lettre = t.terme[0].toUpperCase();
    if (!acc[lettre]) acc[lettre] = [];
    acc[lettre].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-3">

      {/* ── En-tête ── */}
      <div className="bg-gradient-to-br from-indigo-950/50 to-purple-950/30 rounded-xl p-3 border border-indigo-700/60">
        <div className="font-bold text-indigo-200 text-sm flex items-center gap-2">
          <span>📖</span>
          <span>Glossaire comptable</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {TERMES.length} termes · Cliquer pour ouvrir · ✕ pour fermer
        </p>
      </div>

      {/* ── Recherche ── */}
      <input
        type="text"
        value={filtre}
        onChange={(e) => setFiltre(e.target.value)}
        placeholder="🔍 Rechercher un terme…"
        className="w-full bg-gray-800 border border-gray-600 text-gray-200 placeholder-gray-500 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {/* ── Index alphabétique ── */}
      {Object.keys(groupes).length === 0 ? (
        <div className="text-center text-gray-500 text-sm py-6">Aucun terme trouvé.</div>
      ) : (
        Object.entries(groupes).sort(([a], [b]) => a.localeCompare(b)).map(([lettre, termes]) => (
          <div key={lettre}>
            {/* Lettre-index */}
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-900/60 border border-indigo-700/50 flex items-center justify-center font-black text-indigo-300 text-sm shrink-0">
                {lettre}
              </div>
              <div className="h-px flex-1 bg-indigo-900/40" />
            </div>

            {/* Termes du groupe */}
            <div className="space-y-1.5 ml-1">
              {termes.map((t) => {
                const catStyle = CATEGORIE_LABELS[t.categorie];
                const isOpen = openId === t.id;

                return (
                  <div
                    key={t.id}
                    className={`rounded-xl border transition-all duration-200 ${
                      isOpen
                        ? "border-indigo-600 bg-gray-800 shadow-md shadow-indigo-900/20"
                        : "border-gray-700 bg-gray-900 hover:border-indigo-700"
                    }`}
                  >
                    {/* Header cliquable */}
                    <button
                      onClick={() => setOpenId(isOpen ? null : t.id)}
                      className="w-full px-3 py-2.5 flex items-start justify-between gap-2 text-left"
                      aria-expanded={isOpen}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-100 leading-tight">{t.terme}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5 leading-snug">{t.court}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${catStyle.color}`}>
                          {catStyle.label}
                        </span>
                        <span className={`text-xs text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>▼</span>
                      </div>
                    </button>

                    {/* Corps expandé */}
                    {isOpen && (
                      <div className="px-3 pb-3 border-t border-gray-700/50">
                        <div className="pt-2.5">
                          {t.contenu}
                        </div>
                        <button
                          onClick={() => setOpenId(null)}
                          className="mt-3 w-full py-1.5 text-xs text-gray-400 border border-gray-600 rounded-lg hover:bg-gray-700 hover:text-gray-200 transition-colors font-medium"
                        >
                          ✕ Fermer
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
