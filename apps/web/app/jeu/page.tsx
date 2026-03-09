"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  EtatJeu, NomEntreprise, CarteDecision, Joueur,
} from "@/lib/game-engine/types";
import { ENTREPRISES } from "@/lib/game-engine/data/entreprises";
import {
  initialiserJeu, avancerEtape, appliquerEtape0, appliquerAchatMarchandises,
  appliquerAvancementCreances, appliquerPaiementCommerciaux, appliquerCarteClient,
  appliquerEffetsRecurrents, tirerCartesDecision, acheterCarteDecision,
  appliquerCarteEvenement, verifierFinTour, cloturerAnnee, genererClientsParCommerciaux,
  ResultatFinTour,
} from "@/lib/game-engine/engine";
import {
  calculerScore, getTresorerie, getTotalActif, getTotalPassif,
} from "@/lib/game-engine/calculators";
import BilanPanel from "@/components/BilanPanel";
import CompteResultatPanel from "@/components/CompteResultatPanel";
import CarteView from "@/components/CarteView";
import EtapeGuide from "@/components/EtapeGuide";
import IndicateursPanel from "@/components/IndicateursPanel";

// ─── UTILITAIRES ─────────────────────────────────────────────────────────────

function cloneEtat(e: EtatJeu): EtatJeu { return JSON.parse(JSON.stringify(e)); }

// ─── TYPES ───────────────────────────────────────────────────────────────────

/** Une ligne d'écriture comptable que le joueur doit appliquer manuellement */
interface EntryLine {
  id: string;
  poste: string;
  delta: number;
  description: string;
  applied: boolean;
  sens: "debit" | "credit";
}

/** État d'une étape en cours — remplace l'ancien "PendingStep" modal */
interface ActiveStep {
  titre: string;
  icone: string;
  description: string;
  principe: string;
  conseil: string;
  entries: EntryLine[];
  baseEtat: EtatJeu;    // snapshot avant l'étape
  previewEtat: EtatJeu; // résultat complet calculé par le moteur
}

interface JournalEntry {
  id: number;
  tour: number;
  etape: number;
  joueurNom: string;
  titre: string;
  entries: EntryLine[];
  principe: string;
}

// ─── CLASSEMENT EMPLOI / RESSOURCE ───────────────────────────────────────────

const ACTIF_KEYS   = ["tresorerie","stocks","immobilisations","creancesPlus1","creancesPlus2","decouvert"];
const PASSIF_KEYS  = ["capitaux","emprunts","dettes","dettesFiscales"];
const CHARGES_KEYS = ["achats","servicesExterieurs","impotsTaxes","chargesInteret","chargesPersonnel","chargesExceptionnelles","dotationsAmortissements"];
const PRODUITS_KEYS = ["ventes","productionStockee","produitsFinanciers","revenusExceptionnels"];

function getSens(poste: string, delta: number): "debit" | "credit" {
  const p = poste.toLowerCase();
  const isActif   = ACTIF_KEYS.some(k => p.includes(k));
  const isCharge  = CHARGES_KEYS.some(k => p.includes(k));
  const isPassif  = PASSIF_KEYS.some(k => p.includes(k));
  const isProduit = PRODUITS_KEYS.some(k => p.includes(k));
  if ((isActif || isCharge) && delta >= 0) return "debit";
  if ((isActif || isCharge) && delta < 0)  return "credit";
  if ((isPassif || isProduit) && delta >= 0) return "credit";
  return "debit";
}

function nomCompte(poste: string): string {
  const map: Record<string, string> = {
    tresorerie: "Trésorerie", stocks: "Stocks de marchandises",
    immobilisations: "Immobilisations", creancesPlus1: "Créances clients C+1",
    creancesPlus2: "Créances clients C+2", decouvert: "Découvert bancaire",
    capitaux: "Capitaux propres", emprunts: "Emprunts",
    dettes: "Dettes fournisseurs", dettesFiscales: "Dettes fiscales",
    achats: "Achats (CMV)", servicesExterieurs: "Services extérieurs",
    impotsTaxes: "Impôts & taxes", chargesInteret: "Charges d'intérêt",
    chargesPersonnel: "Charges de personnel",
    chargesExceptionnelles: "Charges exceptionnelles",
    dotationsAmortissements: "Dotations aux amortissements",
    ventes: "Ventes", productionStockee: "Production stockée",
    produitsFinanciers: "Produits financiers", revenusExceptionnels: "Revenus exceptionnels",
  };
  for (const [k, v] of Object.entries(map)) if (poste.toLowerCase().includes(k)) return v;
  return poste;
}

/**
 * Applique un delta sur un poste donné du joueur (bilan ou CR).
 * Utilisé pour mettre à jour le joueur d'affichage en temps réel
 * au fur et à mesure que le joueur clique sur chaque écriture.
 */
function applyDeltaToJoueur(j: Joueur, poste: string, delta: number): void {
  // 1. Champs directs du bilan
  if (poste === "decouvert")     { j.bilan.decouvert     += delta; return; }
  if (poste === "creancesPlus1") { j.bilan.creancesPlus1 += delta; return; }
  if (poste === "creancesPlus2") { j.bilan.creancesPlus2 += delta; return; }
  if (poste === "dettes")        { j.bilan.dettes         += delta; return; }
  if (poste === "dettesFiscales"){ j.bilan.dettesFiscales += delta; return; }
  // 2. Actifs (par catégorie)
  const actif = j.bilan.actifs.find(a => (a.categorie as string) === poste);
  if (actif) { actif.valeur += delta; return; }
  // 3. Passifs (par catégorie)
  const passif = j.bilan.passifs.find(p => (p.categorie as string) === poste);
  if (passif) { passif.valeur += delta; return; }
  // 4. Charges CR
  if (poste in j.compteResultat.charges)
    (j.compteResultat.charges as Record<string, number>)[poste] += delta;
  // 5. Produits CR
  else if (poste in j.compteResultat.produits)
    (j.compteResultat.produits as Record<string, number>)[poste] += delta;
}

// ─── ETAPES ──────────────────────────────────────────────────────────────────

const ETAPE_INFO: Record<number, { icone: string; titre: string; description: string; principe: string; conseil: string }> = {
  0: {
    icone: "💼", titre: "Charges fixes & Amortissements",
    description: "Chaque trimestre, ton entreprise doit payer ses charges fixes (loyer, électricité, assurances…) et enregistrer l'usure de ses immobilisations.",
    principe: "DÉBIT Services extérieurs / CRÉDIT Trésorerie (charges fixes). DÉBIT Dotations amortissements / CRÉDIT Immobilisations (amortissements). Les charges augmentent → résultat diminue → capitaux propres diminuent à terme.",
    conseil: "⚠️ Ces charges sont OBLIGATOIRES. Si ta trésorerie passe sous zéro, un découvert bancaire s'ouvre. Au-delà de 5 de découvert → faillite !",
  },
  1: {
    icone: "📦", titre: "Achats de marchandises",
    description: "Tu peux acheter des stocks pour les revendre. Choisis la quantité et le mode de paiement : comptant (trésorerie immédiate) ou à crédit (dette fournisseur D+1).",
    principe: "Comptant : DÉBIT Stocks / CRÉDIT Trésorerie. À crédit : DÉBIT Stocks / CRÉDIT Dettes fournisseurs. Dans les deux cas, l'Actif est modifié mais le Passif l'est aussi → équilibre maintenu.",
    conseil: "💡 Acheter à crédit préserve ta trésorerie aujourd'hui mais crée une dette à rembourser au prochain tour. C'est le mécanisme du délai fournisseur.",
  },
  2: {
    icone: "⏩", titre: "Avancement des créances clients",
    description: "Les clients règlent à échéance : les Créances C+2 deviennent C+1, et les Créances C+1 entrent en trésorerie.",
    principe: "Encaissement C+1 : DÉBIT Trésorerie / CRÉDIT Créances C+1. Avancement C+2→C+1 : DÉBIT Créances C+1 / CRÉDIT Créances C+2. Mouvement interne à l'Actif : total Actif ne change pas ici.",
    conseil: "💡 Un client Grand Compte paie en C+2 : la vente est faite aujourd'hui mais encaissée dans 2 trimestres. Attention au décalage de trésorerie !",
  },
  3: {
    icone: "👔", titre: "Paiement des commerciaux",
    description: "Tes commerciaux ont travaillé ce trimestre. Tu les rémunères : charges de personnel ↑, trésorerie ↓. En contrepartie, ils t'ont apporté des clients.",
    principe: "DÉBIT Charges de personnel / CRÉDIT Trésorerie. Les salaires sont une charge d'exploitation qui réduit le résultat. Mais les commerciaux génèrent des ventes futures qui compensent.",
    conseil: "🤝 Junior → 1 Client Particulier/tour. Senior → 1 Client TPE/tour. Directrice → 1 Grand Compte/tour.",
  },
  4: {
    icone: "🤝", titre: "Traitement des ventes (Cartes Client)",
    description: "Chaque vente génère 4 écritures : une vente (produit), un stock consommé (charge), un coût des marchandises vendues (CMV), et une entrée de trésorerie ou créance.",
    principe: "① Ventes + (Produit) ② Stocks − (marchandises livrées) ③ Achats/CMV + (Coût de revient) ④ Tréso + ou Créance + (selon délai). L'équation ACTIF+CHARGES = PASSIF+PRODUITS reste vraie.",
    conseil: "🔑 C'est LE cœur de la partie double : une seule vente génère 4 écritures qui s'équilibrent. Le comptable capte l'économie réelle en langage chiffré.",
  },
  5: {
    icone: "🔄", titre: "Effets récurrents des cartes Décision",
    description: "Certaines de tes cartes Décision actives ont des effets qui se répètent chaque trimestre (abonnements, maintenance, intérêts…).",
    principe: "Ces charges récurrentes sont des Charges d'exploitation régulières : DÉBIT compte de charge / CRÉDIT Trésorerie. Elles réduisent le résultat d'exploitation à chaque tour.",
    conseil: "💡 Les cartes avec effets récurrents peuvent peser sur la trésorerie. Vérifie que tes revenus récurrents couvrent tes charges récurrentes.",
  },
  6: {
    icone: "🎯", titre: "Choix d'une carte Décision",
    description: "Tu peux investir dans une carte Décision ce trimestre. Chaque carte a des effets immédiats (ce tour) et des effets récurrents (chaque tour suivant). Ce choix est OPTIONNEL.",
    principe: "Un investissement : DÉBIT Immobilisations / CRÉDIT Trésorerie (emploi immédiat, ressource utilisée). Un recrutement : DÉBIT Charges personnel / CRÉDIT Trésorerie.",
    conseil: "🛡️ La carte Assurance Prévoyance protège des événements négatifs. La Levée de Fonds apporte des capitaux. Anticipe tes besoins !",
  },
  7: {
    icone: "🎲", titre: "Événement aléatoire",
    description: "Un événement imprévu affecte ton entreprise. Positif (subvention, client VIP) ou négatif (contrôle fiscal, crise sanitaire) : tu ne peux pas le refuser.",
    principe: "Les événements positifs sont des Produits exceptionnels (CRÉDIT Produits exceptionnels / DÉBIT Trésorerie). Les négatifs sont des Charges exceptionnelles (l'inverse).",
    conseil: "🎲 L'Assurance Prévoyance peut annuler certains événements négatifs. Avoir des réserves de trésorerie absorbe les chocs.",
  },
  8: {
    icone: "✅", titre: "Bilan de fin de trimestre",
    description: "On vérifie l'équilibre du bilan, on contrôle la solvabilité et on calcule ton score. Si c'est le dernier trimestre, on clôture l'exercice.",
    principe: "Clôture : le Résultat Net est intégré aux Capitaux propres (bénéfice → capitaux augmentent ; perte → capitaux diminuent). Le compte de résultat est remis à zéro.",
    conseil: "📊 Résultat Net = Produits − Charges. S'il est positif, ta solvabilité s'améliore. Objectif : finir avec un bilan équilibré et des capitaux propres positifs.",
  },
};

// ─── CLASSEMENT PAR DOCUMENT ─────────────────────────────────────────────────

function getDocument(poste: string): { label: string; detail: string; badge: string } {
  // Comparaison directe (les clés sont en camelCase exact — pas de toLowerCase)
  if (ACTIF_KEYS.includes(poste))    return { label: "Bilan", detail: "Actif", badge: "bg-blue-100 text-blue-700" };
  if (PASSIF_KEYS.includes(poste))   return { label: "Bilan", detail: "Passif", badge: "bg-orange-100 text-orange-700" };
  if (CHARGES_KEYS.includes(poste))  return { label: "Compte de résultat", detail: "Charge", badge: "bg-red-100 text-red-700" };
  if (PRODUITS_KEYS.includes(poste)) return { label: "Compte de résultat", detail: "Produit", badge: "bg-green-100 text-green-700" };
  return { label: "?", detail: "", badge: "bg-gray-100 text-gray-500" };
}

// ─── COMPOSANT : EntryCard ─────────────────────────────────────────────────────

function EntryCard({ entry, onApply }: { entry: EntryLine; onApply: () => void }) {
  const isDebit = entry.sens === "debit";
  return (
    <div className={`mb-2 rounded-xl border-2 transition-all ${
      entry.applied
        ? "bg-green-50 border-green-300"
        : isDebit
        ? "bg-blue-50 border-blue-200 hover:border-blue-400"
        : "bg-orange-50 border-orange-200 hover:border-orange-400"
    }`}>
      <div className="flex items-start justify-between p-2.5 gap-2">
        <div className="flex-1 min-w-0">
          <div className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${
            entry.applied ? "text-green-600" : isDebit ? "text-blue-600" : "text-orange-600"
          }`}>
            {isDebit ? "📤 DÉBIT — Emploi" : "📥 CRÉDIT — Ressource"}
          </div>
          <div className="font-medium text-sm text-gray-800">{nomCompte(entry.poste)}</div>
          {(() => { const doc = getDocument(entry.poste); return (
            <span className={`inline-block text-xs font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${doc.badge}`}>
              {doc.label === "Bilan" ? "📋" : "📈"} {doc.label}{doc.detail ? ` · ${doc.detail}` : ""}
            </span>
          ); })()}
          <div className={`text-base font-bold ${entry.delta > 0 ? "text-blue-700" : "text-red-600"}`}>
            {entry.delta > 0 ? "+" : ""}{entry.delta}
          </div>
          <div className="text-xs text-gray-400 leading-tight">{entry.description}</div>
        </div>
        <div className="shrink-0 mt-1">
          {entry.applied ? (
            <span className="text-green-500 text-2xl">✓</span>
          ) : (
            <button
              onClick={onApply}
              className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-lg whitespace-nowrap transition-all"
            >
              Saisir →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── COMPOSANT : EntryPanel ────────────────────────────────────────────────────

function EntryPanel({
  activeStep,
  displayJoueur,
  onApply,
  onConfirm,
  onCancel,
}: {
  activeStep: ActiveStep;
  displayJoueur: Joueur;
  onApply: (id: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const pendingCount = activeStep.entries.filter(e => !e.applied).length;
  const allApplied   = pendingCount === 0;
  const totalActif   = getTotalActif(displayJoueur);
  const totalPassif  = getTotalPassif(displayJoueur);
  const balanced     = Math.abs(totalActif - totalPassif) < 0.01;
  const canContinue  = allApplied && balanced;

  const debits  = activeStep.entries.filter(e => e.sens === "debit");
  const credits = activeStep.entries.filter(e => e.sens === "credit");

  return (
    <div className="space-y-3">
      {/* En-tête de l'étape */}
      <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{activeStep.icone}</span>
          <span className="font-bold text-indigo-900 text-sm">{activeStep.titre}</span>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">{activeStep.description}</p>
      </div>

      {/* Écritures à saisir */}
      {activeStep.entries.length > 0 ? (
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            ✏️ Clique sur chaque écriture pour l'appliquer :
          </div>
          {debits.length > 0 && (
            <>
              <div className="text-xs text-blue-500 font-semibold mb-1">DÉBITS (Emplois)</div>
              {debits.map(e => <EntryCard key={e.id} entry={e} onApply={() => onApply(e.id)} />)}
            </>
          )}
          {credits.length > 0 && (
            <>
              <div className="text-xs text-orange-500 font-semibold mb-1 mt-2">CRÉDITS (Ressources)</div>
              {credits.map(e => <EntryCard key={e.id} entry={e} onApply={() => onApply(e.id)} />)}
            </>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 text-center italic">
          Aucune écriture à passer pour cette étape.
        </div>
      )}

      {/* Indicateur d'équilibre en temps réel */}
      <div className={`rounded-xl p-2.5 text-center text-xs font-bold transition-all border ${
        canContinue
          ? "bg-green-50 text-green-700 border-green-200"
          : !allApplied
          ? "bg-gray-50 text-gray-400 border-gray-100"
          : "bg-red-50 text-red-600 border-red-200"
      }`}>
        <div className="text-sm">
          ACTIF <strong>{totalActif}</strong> {balanced ? "=" : "≠"} PASSIF <strong>{totalPassif}</strong>
        </div>
        <div className="mt-0.5">
          {canContinue
            ? "✅ Bilan équilibré — tu peux continuer !"
            : !allApplied
            ? `${pendingCount} écriture(s) restante(s) à saisir`
            : "⚠️ Déséquilibre détecté — vérifie tes écritures"}
        </div>
      </div>

      {/* Principe comptable */}
      <div className="bg-indigo-50 rounded-xl p-2.5 text-xs text-indigo-800 leading-relaxed border border-indigo-100">
        <span className="font-bold">📚 Principe : </span>{activeStep.principe}
      </div>

      {/* Conseil */}
      <div className="bg-amber-50 rounded-xl p-2.5 text-xs text-amber-800 leading-relaxed border border-amber-100">
        {activeStep.conseil}
      </div>

      {/* Boutons */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2 border border-gray-200 rounded-xl text-gray-500 text-xs hover:bg-gray-50 transition-colors"
        >
          ← Revenir
        </button>
        {canContinue && (
          <button
            onClick={onConfirm}
            className="flex-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors"
          >
            ✅ Continuer →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── COMPOSANT : CompanyIntro ──────────────────────────────────────────────────

function CompanyIntro({ joueurs, onStart }: { joueurs: Joueur[]; onStart: () => void }) {
  const [step, setStep] = useState(0);
  const j = joueurs[0];
  const totalActif  = getTotalActif(j);
  const totalPassif = getTotalPassif(j);
  const capitaux    = j.bilan.passifs.find(p => p.categorie === "capitaux");
  const emprunts    = j.bilan.passifs.find(p => p.categorie === "emprunts");
  const tresorerie  = j.bilan.actifs.find(a => a.categorie === "tresorerie");
  const stocks      = j.bilan.actifs.filter(a => a.categorie === "stocks");
  const immos       = j.bilan.actifs.filter(a => a.categorie === "immobilisations");

  const steps = [
    <div key={0} className="space-y-4">
      <h3 className="font-bold text-indigo-900 text-lg">📥 D'où vient l'argent de départ ?</h3>
      <p className="text-gray-600 text-sm leading-relaxed">
        Toute entreprise naît grâce à des <strong>RESSOURCES</strong> : l'argent investi par les
        propriétaires (capitaux propres) et/ou des emprunts bancaires. C'est la colonne <strong>PASSIF</strong> du bilan.
      </p>
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
        <div className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-3">📥 RESSOURCES (Passif) — Qui finance ?</div>
        <div className="space-y-2">
          {capitaux && (
            <div className="flex justify-between items-center bg-white rounded-lg p-2 border border-orange-100">
              <div>
                <div className="font-medium text-sm">{capitaux.nom}</div>
                <div className="text-xs text-gray-400">Apport des propriétaires — ressource durable</div>
              </div>
              <span className="font-bold text-orange-700 text-lg">{capitaux.valeur}</span>
            </div>
          )}
          {emprunts && (
            <div className="flex justify-between items-center bg-white rounded-lg p-2 border border-orange-100">
              <div>
                <div className="font-medium text-sm">{emprunts.nom}</div>
                <div className="text-xs text-gray-400">Financement externe — ressource à rembourser</div>
              </div>
              <span className="font-bold text-orange-700 text-lg">{emprunts.valeur}</span>
            </div>
          )}
          <div className="flex justify-between items-center bg-orange-100 rounded-lg p-2">
            <span className="font-bold text-orange-800">TOTAL RESSOURCES (Passif)</span>
            <span className="font-bold text-orange-800 text-lg">{totalPassif}</span>
          </div>
        </div>
      </div>
    </div>,

    <div key={1} className="space-y-4">
      <h3 className="font-bold text-indigo-900 text-lg">📤 Comment cet argent a-t-il été utilisé ?</h3>
      <p className="text-gray-600 text-sm leading-relaxed">
        Avec ces ressources, l'entreprise a acheté des <strong>EMPLOIS</strong> : biens durables,
        marchandises, liquidités. C'est la colonne <strong>ACTIF</strong> du bilan.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">📤 EMPLOIS (Actif) — À quoi sert l'argent ?</div>
        <div className="space-y-2">
          {immos.length > 0 && immos.map(a => (
            <div key={a.nom} className="flex justify-between items-center bg-white rounded-lg p-2 border border-blue-100">
              <div>
                <div className="font-medium text-sm">{a.nom}</div>
                <div className="text-xs text-gray-400">Investissement durable</div>
              </div>
              <span className="font-bold text-blue-700">{a.valeur}</span>
            </div>
          ))}
          {stocks.map(a => (
            <div key={a.nom} className="flex justify-between items-center bg-white rounded-lg p-2 border border-blue-100">
              <div>
                <div className="font-medium text-sm">{a.nom}</div>
                <div className="text-xs text-gray-400">Marchandises à revendre</div>
              </div>
              <span className="font-bold text-blue-700">{a.valeur}</span>
            </div>
          ))}
          {tresorerie && (
            <div className="flex justify-between items-center bg-white rounded-lg p-2 border border-blue-100">
              <div>
                <div className="font-medium text-sm">{tresorerie.nom}</div>
                <div className="text-xs text-gray-400">Liquidités disponibles</div>
              </div>
              <span className="font-bold text-blue-700">{tresorerie.valeur}</span>
            </div>
          )}
          <div className="flex justify-between items-center bg-blue-100 rounded-lg p-2">
            <span className="font-bold text-blue-800">TOTAL EMPLOIS (Actif)</span>
            <span className="font-bold text-blue-800 text-lg">{totalActif}</span>
          </div>
        </div>
      </div>
    </div>,

    <div key={2} className="space-y-4">
      <h3 className="font-bold text-indigo-900 text-lg">⚖️ L'équilibre fondamental</h3>
      <p className="text-gray-600 text-sm leading-relaxed">
        En comptabilité, le bilan est <strong>toujours équilibré</strong> : ACTIF = PASSIF.
        C'est une loi mathématique maintenue grâce à la <strong>partie double</strong>.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-700">{totalActif}</div>
          <div className="text-sm font-bold text-blue-600 mt-1">TOTAL ACTIF</div>
          <div className="text-xs text-gray-400">(Emplois)</div>
        </div>
        <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-orange-700">{totalPassif}</div>
          <div className="text-sm font-bold text-orange-600 mt-1">TOTAL PASSIF</div>
          <div className="text-xs text-gray-400">(Ressources)</div>
        </div>
      </div>
      <div className={`rounded-xl p-4 text-center font-bold text-lg ${
        totalActif === totalPassif ? "bg-green-50 text-green-700 border-2 border-green-300" : "bg-red-50 text-red-700 border-2 border-red-300"
      }`}>
        {totalActif === totalPassif ? "✅ ACTIF = PASSIF — Le bilan est équilibré !" : "⚠️ Déséquilibre !"}
      </div>
      <div className="bg-indigo-50 rounded-xl p-3 text-xs text-indigo-800 leading-relaxed">
        <strong>Dans le jeu :</strong> à chaque étape, tu vas appliquer toi-même les écritures comptables.
        Tu verras en temps réel l'effet sur le bilan. Si le bilan se déséquilibre, c'est qu'il manque
        une écriture — c'est normal dans la partie double !
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full overflow-hidden">
        <div className="bg-indigo-700 text-white p-4 flex items-center gap-3">
          <span className="text-3xl">{j.entreprise.icon}</span>
          <div>
            <div className="font-bold">{j.pseudo} — {j.entreprise.nom}</div>
            <div className="text-sm text-indigo-200">{j.entreprise.specialite}</div>
          </div>
        </div>
        <div className="flex gap-2 justify-center p-3 border-b border-gray-100">
          {[0, 1, 2].map(i => (
            <div key={i} className={`h-2 w-8 rounded-full transition-all ${i <= step ? "bg-indigo-600" : "bg-gray-200"}`} />
          ))}
        </div>
        <div className="p-6">{steps[step]}</div>
        <div className="px-6 pb-6 flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="flex-1 py-2 border border-gray-200 rounded-xl text-gray-500 text-sm hover:bg-gray-50">
              ← Précédent
            </button>
          )}
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl">
              Suivant →
            </button>
          ) : (
            <button onClick={onStart} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl">
              🚀 C&apos;est parti — Commencer !
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── COMPOSANT : SetupScreen ───────────────────────────────────────────────────

interface PlayerSetup { pseudo: string; entreprise: NomEntreprise; }

function SetupScreen({ onStart }: { onStart: (p: PlayerSetup[], nbTours: number) => void }) {
  const [nbJoueurs, setNbJoueurs] = useState(1);
  const [nbTours, setNbTours] = useState(6);
  const defaults: PlayerSetup[] = [
    { pseudo: "", entreprise: "Entreprise Orange" },
    { pseudo: "", entreprise: "Entreprise Violette" },
    { pseudo: "", entreprise: "Entreprise Bleue" },
    { pseudo: "", entreprise: "Entreprise Verte" },
  ];
  const [players, setPlayers] = useState<PlayerSetup[]>(defaults);
  const allEntreprises = ENTREPRISES.map(e => e.nom);
  const usedEnts = players.slice(0, nbJoueurs).map(p => p.entreprise);

  function update(i: number, f: "pseudo" | "entreprise", v: string) {
    const n = [...players]; n[i] = { ...n[i], [f]: v }; setPlayers(n);
  }

  const active = players.slice(0, nbJoueurs);
  const canStart = active.every(p => p.pseudo.trim().length > 0) && new Set(active.map(p => p.entreprise)).size === nbJoueurs;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-50 to-blue-100">
      <Link href="/" className="text-indigo-400 text-sm mb-6 hover:underline">← Retour à l'accueil</Link>
      <h2 className="text-3xl font-bold text-indigo-900 mb-2">🎮 Configuration</h2>
      <p className="text-indigo-500 mb-8 text-sm">Choisis le nombre de joueurs et configure ton entreprise</p>
      <div className="flex gap-2 mb-8 items-center">
        {[1, 2, 3, 4].map(n => (
          <button key={n} onClick={() => setNbJoueurs(n)}
            className={`w-12 h-12 rounded-xl font-bold text-lg transition-all ${nbJoueurs === n ? "bg-indigo-600 text-white shadow-lg scale-110" : "bg-white text-indigo-600 border-2 border-indigo-200 hover:border-indigo-400"}`}>
            {n}
          </button>
        ))}
        <span className="text-indigo-400 text-sm ml-1">joueur{nbJoueurs > 1 ? "s" : ""}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl mb-8">
        {Array.from({ length: nbJoueurs }).map((_, i) => {
          const ent = ENTREPRISES.find(e => e.nom === players[i].entreprise)!;
          return (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-indigo-100">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{ent.icon}</span>
                <input value={players[i].pseudo} onChange={e => update(i, "pseudo", e.target.value)}
                  className="flex-1 border-b-2 border-indigo-200 focus:border-indigo-500 outline-none px-1 py-0.5 font-bold text-gray-800"
                  placeholder="Ton prénom ou pseudo" maxLength={20} />
              </div>
              <select value={players[i].entreprise} onChange={e => update(i, "entreprise", e.target.value as NomEntreprise)}
                className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                {allEntreprises.map(nom => (
                  <option key={nom} value={nom} disabled={usedEnts.includes(nom) && players[i].entreprise !== nom}>
                    {nom}{usedEnts.includes(nom) && players[i].entreprise !== nom ? " (déjà prise)" : ""}
                  </option>
                ))}
              </select>
              <div className="mt-2 text-xs text-indigo-400">{ent.specialite} · <strong>{ent.type}</strong></div>
            </div>
          );
        })}
      </div>
      {/* Choix du nombre de trimestres */}
      <div className="flex gap-2 mb-6 items-center">
        <span className="text-indigo-400 text-sm mr-2">Durée de la partie :</span>
        {[4, 6, 8].map(n => (
          <button key={n} onClick={() => setNbTours(n)}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              nbTours === n
                ? "bg-indigo-600 text-white shadow-lg scale-105"
                : "bg-white text-indigo-600 border-2 border-indigo-200 hover:border-indigo-400"
            }`}>
            {n} trimestres
            <span className="block text-xs font-normal opacity-70">
              {n === 4 ? "~1h" : n === 6 ? "~1h30 ✓" : "~2h"}
            </span>
          </button>
        ))}
      </div>

      <button onClick={() => onStart(players.slice(0, nbJoueurs), nbTours)} disabled={!canStart}
        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold px-12 py-4 rounded-2xl text-lg shadow-lg">
        🚀 Suivant — Comprendre mon bilan de départ
      </button>
    </div>
  );
}

// ─── PAGE PRINCIPALE ─────────────────────────────────────────────────────────

const TABS: Array<["bilan" | "cr" | "indicateurs", string]> = [
  ["bilan",       "📋 Bilan"],
  ["cr",          "📈 Compte de résultat"],
  ["indicateurs", "📊 Indicateurs"],
];

export default function JeuPage() {
  type Phase = "setup" | "intro" | "playing" | "gameover";
  const [phase, setPhase]             = useState<Phase>("setup");
  const [etat, setEtat]               = useState<EtatJeu | null>(null);
  const [activeStep, setActiveStep]   = useState<ActiveStep | null>(null);
  const [journal, setJournal]         = useState<JournalEntry[]>([]);
  const [showJournal, setShowJournal] = useState(false);
  const [activeTab, setActiveTab]     = useState<"bilan" | "cr" | "indicateurs">("bilan");
  const [achatQte, setAchatQte]       = useState(2);
  const [achatMode, setAchatMode]     = useState<"tresorerie" | "dettes">("tresorerie");
  const [selectedDecision, setSelectedDecision] = useState<CarteDecision | null>(null);
  const [showCartes, setShowCartes]   = useState(false);
  const [tourTransition, setTourTransition] = useState<{ from: number; to: number } | null>(null);
  const [failliteInfo, setFailliteInfo] = useState<{ joueurNom: string; raison: string } | null>(null);

  // ─ Intégration Supabase — room code depuis l'URL + sauvegarde fin de partie ─
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [savedToDb, setSavedToDb] = useState(false);

  // Lit le code de session depuis l'URL (?code=KIC-XXXX)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) setRoomCode(code);
  }, []);

  // Sauvegarde automatique quand la partie est terminée ET qu'un room_code existe
  useEffect(() => {
    if (phase !== "gameover" || !etat || !roomCode || savedToDb) return;
    const joueurs = etat.joueurs.map(j => ({
      pseudo: j.pseudo,
      entreprise: j.entreprise.nom,
      scoreTotal: calculerScore(j),
      elimine: j.elimine,
      etatFinal: j,
    }));
    fetch("/api/sessions/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_code: roomCode, joueurs }),
    })
      .then(r => r.json())
      .then(() => { setSavedToDb(true); console.log("✅ Résultats sauvegardés dans Supabase"); })
      .catch(err => console.error("❌ Erreur save résultats:", err));
  }, [phase, etat, roomCode, savedToDb]);

  // ─ Joueur affiché (avec écritures partiellement appliquées si étape active) ─
  function getDisplayJoueur(): Joueur | null {
    if (!etat) return null;
    if (!activeStep) return etat.joueurs[etat.joueurActif];
    const cloned = cloneEtat(activeStep.baseEtat);
    const j = cloned.joueurs[etat.joueurActif];
    for (const entry of activeStep.entries.filter(e => e.applied)) {
      applyDeltaToJoueur(j, entry.poste, entry.delta);
    }
    return j;
  }

  // ─ Journal comptable ─────────────────────────────────────────────────────
  function addToJournal(e: EtatJeu, entries: EntryLine[], etape: number) {
    const info = ETAPE_INFO[etape];
    setJournal(prev => [{
      id: prev.length + 1,
      tour: e.tourActuel,
      etape,
      joueurNom: e.joueurs[e.joueurActif].pseudo,
      titre: info?.titre ?? `Étape ${etape}`,
      entries,
      principe: info?.principe ?? "",
    }, ...prev.slice(0, 29)]);
  }

  // ─ Démarrer une partie ───────────────────────────────────────────────────
  function handleStart(players: PlayerSetup[], nbTours: number = 6) {
    const joueursDefs = players.map(p => ({ pseudo: p.pseudo, nomEntreprise: p.entreprise }));
    const newEtat = initialiserJeu(joueursDefs, nbTours);
    setEtat(newEtat);
    setPhase("intro");
  }

  // ─ Construire l'étape active ─────────────────────────────────────────────
  function buildActiveStep(
    baseEtat: EtatJeu,
    mods: Array<{ joueurId: number; poste: string; ancienneValeur: number; nouvelleValeur: number; explication: string }>,
    previewEtat: EtatJeu,
    etape: number,
  ): ActiveStep {
    const info = ETAPE_INFO[etape];
    const entries: EntryLine[] = mods
      .filter(m => m.nouvelleValeur !== m.ancienneValeur)
      .map((m, i) => ({
        id: `e${i}`,
        poste: m.poste,
        delta: m.nouvelleValeur - m.ancienneValeur,
        description: m.explication,
        applied: false,
        sens: getSens(m.poste, m.nouvelleValeur - m.ancienneValeur),
      }));
    return { titre: info.titre, icone: info.icone, description: info.description, principe: info.principe, conseil: info.conseil, entries, baseEtat: cloneEtat(baseEtat), previewEtat };
  }

  // ─ Appliquer une écriture ────────────────────────────────────────────────
  function applyEntry(entryId: string) {
    setActiveStep(prev => prev
      ? { ...prev, entries: prev.entries.map(e => e.id === entryId ? { ...e, applied: true } : e) }
      : null
    );
  }

  // ─ Valider l'étape (après que toutes les écritures sont appliquées) ──────
  function confirmActiveStep() {
    if (!activeStep || !etat) return;
    const next = activeStep.previewEtat;
    addToJournal(next, activeStep.entries, next.etapeTour);
    avancerEtape(next);
    setEtat({ ...next });
    setActiveStep(null);
  }

  // ─ Lancer la prévisualisation d'une étape automatique ───────────────────
  function launchStep() {
    if (!etat) return;
    const next = cloneEtat(etat);
    const idx = next.joueurActif;
    let mods: Array<{ joueurId: number; poste: string; ancienneValeur: number; nouvelleValeur: number; explication: string }> = [];

    switch (next.etapeTour) {
      case 0: {
        const r = appliquerEtape0(next, idx);
        if (r.succes) mods = r.modifications;
        break;
      }
      case 2: {
        const r = appliquerAvancementCreances(next, idx);
        if (r.succes) mods = r.modifications;
        break;
      }
      case 3: {
        const clients = genererClientsParCommerciaux(next.joueurs[idx]);
        next.joueurs[idx].clientsATrait = [...next.joueurs[idx].clientsATrait, ...clients];
        const r = appliquerPaiementCommerciaux(next, idx);
        if (r.succes) mods = r.modifications;
        break;
      }
      case 4: {
        const cs = next.joueurs[idx].clientsATrait;
        for (const c of cs) {
          const r = appliquerCarteClient(next, idx, c);
          if (r.succes) mods = [...mods, ...r.modifications];
        }
        next.joueurs[idx].clientsATrait = [];
        break;
      }
      case 5: {
        const r = appliquerEffetsRecurrents(next, idx);
        if (r.succes) mods = r.modifications;
        break;
      }
      case 7: {
        if (next.piocheEvenements.length > 0) {
          const carte = next.piocheEvenements[0];
          const r = appliquerCarteEvenement(next, idx, carte);
          next.piocheEvenements = next.piocheEvenements.slice(1);
          if (r.succes) mods = r.modifications;
        }
        break;
      }
      case 8: {
        const fin = verifierFinTour(next, idx);
        confirmEndOfTurn(next, fin);
        return;
      }
      default: break;
    }
    setActiveStep(buildActiveStep(etat, mods, next, next.etapeTour));
  }

  // ─ Fin de tour ───────────────────────────────────────────────────────────
  function confirmEndOfTurn(next: EtatJeu, fin: ResultatFinTour) {
    const idx = next.joueurActif;
    const joueurNom = next.joueurs[idx].pseudo;
    // Marquer comme éliminé si faillite
    if (fin.enFaillite) {
      next.joueurs[idx].elimine = true;
    }
    const nextJoueurIdx = (idx + 1) % next.nbJoueurs;
    if (nextJoueurIdx === 0) {
      if (next.tourActuel >= next.nbToursMax) {
        setEtat(next);
        // Si faillite, afficher l'overlay faillite puis gameover
        if (fin.enFaillite) {
          setFailliteInfo({ joueurNom, raison: fin.raisonFaillite ?? "Situation financière irrécupérable" });
        }
        setPhase("gameover");
        return;
      }
      // Faillite en cours de partie (avant le dernier tour)
      if (fin.enFaillite) {
        setEtat({ ...next });
        setActiveStep(null);
        setSelectedDecision(null);
        setShowCartes(false);
        setFailliteInfo({ joueurNom, raison: fin.raisonFaillite ?? "Situation financière irrécupérable" });
        return;
      }
      // Capturer l'ancien tour AVANT cloturerAnnee (qui remet tourActuel = 1)
      const oldTour = next.tourActuel;
      cloturerAnnee(next);
      // Correction bug : utiliser oldTour + 1 au lieu de next.tourActuel++
      // (cloturerAnnee réinitialise tourActuel à 1, donc ++ donnerait toujours 2)
      next.tourActuel = oldTour + 1;
      next.etapeTour = 0;
      next.joueurActif = 0;
      // Réinitialiser la sélection de carte et afficher l'overlay de transition
      setEtat({ ...next });
      setActiveStep(null);
      setSelectedDecision(null);
      setShowCartes(false);
      setTourTransition({ from: oldTour, to: next.tourActuel });
      return;
    } else {
      avancerEtape(next);
      next.joueurActif = nextJoueurIdx;
      next.etapeTour = 0;
    }
    setEtat({ ...next });
    setActiveStep(null);
    setSelectedDecision(null);
    setShowCartes(false);
  }

  // ─ Achats de marchandises ────────────────────────────────────────────────
  function launchAchat() {
    if (!etat) return;
    const next = cloneEtat(etat);
    const r = appliquerAchatMarchandises(next, next.joueurActif, achatQte, achatMode);
    if (!r.succes) return;
    setActiveStep(buildActiveStep(etat, r.modifications, next, 1));
  }

  function skipAchat() {
    if (!etat) return;
    const next = cloneEtat(etat);
    avancerEtape(next);
    setEtat(next);
  }

  // ─ Cartes Décision ───────────────────────────────────────────────────────
  function launchDecision() {
    if (!etat || !selectedDecision) return;
    const next = cloneEtat(etat);
    const r = acheterCarteDecision(next, next.joueurActif, selectedDecision);
    if (!r.succes) return;
    setActiveStep(buildActiveStep(etat, r.modifications, next, 6));
  }

  function skipDecision() {
    if (!etat) return;
    const next = cloneEtat(etat);
    avancerEtape(next);
    setEtat(next);
    setShowCartes(false);
    setSelectedDecision(null);
  }

  // ─── RENDU ───────────────────────────────────────────────────────────────

  if (phase === "setup") return <SetupScreen onStart={handleStart} />;
  if (phase === "intro" && etat) return <CompanyIntro joueurs={etat.joueurs} onStart={() => setPhase("playing")} />;

  if (phase === "gameover" && etat) {
    const classement = [...etat.joueurs]
      .map(j => ({ ...j, score: calculerScore(j) }))
      .sort((a, b) => b.score - a.score);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-50 to-purple-100">
        <h2 className="text-4xl font-bold text-indigo-900 mb-2">🏁 Fin de partie !</h2>
        <div className="space-y-3 w-full max-w-md my-8">
          {classement.map((j, rank) => (
            <div key={j.id} className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <span className="text-2xl">{["🥇","🥈","🥉","4️⃣"][rank]}</span>
              <div className="flex-1">
                <div className="font-bold">{j.pseudo}</div>
                <div className="text-sm text-gray-400">{j.entreprise.nom}</div>
              </div>
              <div className={`text-2xl font-bold ${j.elimine ? "text-red-400 line-through" : "text-indigo-700"}`}>
                {j.elimine ? "💀" : j.score}
              </div>
            </div>
          ))}
        </div>
        {savedToDb && roomCode && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-6 py-3 text-green-700 text-sm font-medium flex items-center gap-2">
            <span>✅</span>
            <span>Résultats sauvegardés dans le tableau de bord enseignant</span>
          </div>
        )}
        <button onClick={() => { setPhase("setup"); setEtat(null); setJournal([]); setSavedToDb(false); }}
          className="bg-indigo-600 text-white font-bold px-10 py-3 rounded-2xl shadow">
          🔄 Nouvelle partie
        </button>
      </div>
    );
  }

  if (!etat) return null;

  const joueur         = etat.joueurs[etat.joueurActif];
  const displayJoueur  = getDisplayJoueur() ?? joueur;
  const cartesDisponibles = tirerCartesDecision(cloneEtat(etat), 4);
  const etapeInfo      = ETAPE_INFO[etat.etapeTour];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ─── OVERLAY TRANSITION DE TRIMESTRE ─── */}
      {tourTransition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* En-tête coloré */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-white text-center">
              <div className="text-5xl mb-2">🔔</div>
              <div className="text-xs font-bold uppercase tracking-widest opacity-75 mb-1">
                Fin du Trimestre {tourTransition.from}
              </div>
              <h2 className="text-2xl font-bold">
                Trimestre {tourTransition.to} — Prêt à démarrer !
              </h2>
            </div>
            {/* Corps */}
            <div className="px-6 py-5 space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 leading-relaxed">
                <strong>📊 Clôture effectuée :</strong> Le résultat net du trimestre {tourTransition.from} a été
                intégré aux Capitaux propres. Le Compte de résultat repart à zéro.
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800 leading-relaxed">
                <strong>🎯 Ce trimestre :</strong> Tu peux choisir une nouvelle <strong>Carte Décision</strong>
                (étape 7). Tes cartes d'investissement actives continuent à produire leurs effets récurrents.
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800 leading-relaxed">
                <strong>💡 Rappel :</strong> L'équation fondamentale reste <strong>ACTIF = PASSIF</strong>.
                Chaque écriture que tu passes doit maintenir cet équilibre.
              </div>
            </div>
            {/* Bouton démarrer */}
            <div className="px-6 pb-6">
              <button
                onClick={() => setTourTransition(null)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold py-3 rounded-xl text-lg shadow-sm transition-all"
              >
                🚀 Démarrer le Trimestre {tourTransition.to}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── OVERLAY FAILLITE ─── */}
      {failliteInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/85 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* En-tête clignotant */}
            <div className="bg-red-600 px-6 py-5 text-white text-center">
              <div className="text-5xl mb-2 animate-bounce">💥</div>
              <h2 className="text-3xl font-black tracking-widest animate-pulse">
                FAILLITE
              </h2>
              <p className="text-red-200 text-sm mt-1 font-semibold">
                {failliteInfo.joueurNom} est en cessation de paiement
              </p>
            </div>
            {/* Corps */}
            <div className="px-6 py-5 space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800 leading-relaxed">
                <strong>🚨 Raison :</strong> {failliteInfo.raison}
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 leading-relaxed">
                <strong>📚 Leçon comptable :</strong> Une entreprise est en faillite quand elle ne peut plus
                faire face à ses décaisssements. Le découvert bancaire excessif, des capitaux propres
                négatifs ou un surendettement conduisent au dépôt de bilan.
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800 leading-relaxed">
                <strong>💡 Prochain essai :</strong> Surveille ton Fonds de Roulement et ta Trésorerie
                nette. N’investis jamais plus que ce que tes revenus peuvent absorber.
              </div>
            </div>
            {/* Boutons */}
            <div className="px-6 pb-6 space-y-2">
              <button
                onClick={() => { setFailliteInfo(null); setPhase("setup"); setEtat(null); setJournal([]); }}
                className="w-full bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold py-3 rounded-xl text-lg shadow-sm transition-all"
              >
                🔄 Recommencer une nouvelle partie
              </button>
              {etat && etat.joueurs.filter(j => !j.elimine).length > 0 && (
                <button
                  onClick={() => setFailliteInfo(null)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-xl text-sm transition-all"
                >
                  ▶️ Continuer à regarder la partie
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── BARRE SUPÉRIEURE ─── */}
      <header className="bg-indigo-700 text-white px-4 py-2 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-indigo-200 hover:text-white text-sm">← Accueil</Link>
          <span className="font-bold">🎓 JE DEVIENS PATRON</span>
        </div>
        <div className="text-xs text-indigo-200 hidden sm:block">
          Trimestre {etat.tourActuel}/{etat.nbToursMax} · Étape {etat.etapeTour + 1}/9 : {etapeInfo?.titre}
        </div>
        <div className="flex items-center gap-1">
          {etat.joueurs.map((j, i) => (
            <div key={j.id} className={`px-2 py-1 rounded text-xs font-bold ${i === etat.joueurActif ? "bg-white text-indigo-700" : "text-indigo-300"} ${j.elimine ? "line-through opacity-40" : ""}`}>
              {j.entreprise.icon} {j.pseudo}
            </div>
          ))}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ─── PANNEAU GAUCHE ─── */}
        <aside className="w-72 shrink-0 flex flex-col gap-3 p-3 border-r border-gray-200 bg-white overflow-y-auto">

          {/* Guide de l'étape OU panneau d'entrée interactive */}
          {activeStep ? (
            <EntryPanel
              activeStep={activeStep}
              displayJoueur={displayJoueur}
              onApply={applyEntry}
              onConfirm={confirmActiveStep}
              onCancel={() => setActiveStep(null)}
            />
          ) : (
            <>
              <EtapeGuide etape={etat.etapeTour} tourActuel={etat.tourActuel} nbTours={etat.nbToursMax} />

              {/* Panneau d'action selon l'étape */}
              <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm">
                {etat.etapeTour === 1 ? (
                  <div className="space-y-3">
                    <div className="text-sm font-bold text-gray-700">📦 Achats de marchandises</div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">Quantité :</label>
                      <input type="number" min={0} max={10} value={achatQte}
                        onChange={e => setAchatQte(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-16 border rounded-lg px-2 py-1 text-center text-sm" />
                    </div>
                    <div className="flex gap-2">
                      {(["tresorerie","dettes"] as const).map(m => (
                        <button key={m} onClick={() => setAchatMode(m)}
                          className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-colors ${achatMode === m ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                          {m === "tresorerie" ? "💵 Comptant" : "📋 À crédit"}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={launchAchat} disabled={achatQte === 0}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm py-2 rounded-xl font-bold">
                        🔍 Voir et comprendre
                      </button>
                      <button onClick={skipAchat} className="flex-1 bg-gray-200 text-gray-700 text-sm py-2 rounded-xl">
                        Passer
                      </button>
                    </div>
                  </div>
                ) : etat.etapeTour === 6 ? (
                  <div className="space-y-2">
                    <div className="text-sm font-bold text-gray-700">🎯 Carte Décision</div>
                    <button onClick={() => setShowCartes(!showCartes)}
                      className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm py-2 rounded-xl font-medium">
                      {showCartes ? "▲ Masquer" : "▼ Voir les cartes disponibles"}
                    </button>
                    {selectedDecision && (
                      <button onClick={launchDecision}
                        className="w-full bg-green-600 text-white text-sm py-2 rounded-xl font-bold">
                        🔍 Voir et comprendre : {selectedDecision.titre}
                      </button>
                    )}
                    <button onClick={skipDecision} className="w-full bg-gray-200 text-gray-700 text-sm py-2 rounded-xl">
                      ⏭️ Passer (aucune carte)
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Étape 4 : cartes clients à traiter avant de lancer */}
                    {etat.etapeTour === 4 && joueur.clientsATrait.length > 0 && (
                      <div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          🤝 Clients à traiter ce tour
                        </div>
                        {joueur.clientsATrait.map((client, i) => {
                          const colorCls = client.delaiPaiement === 0
                            ? "border-green-200 bg-green-50 text-green-800"
                            : client.delaiPaiement === 1
                            ? "border-blue-200 bg-blue-50 text-blue-800"
                            : "border-purple-200 bg-purple-50 text-purple-800";
                          const delaiLabel = client.delaiPaiement === 0
                            ? "💵 Paiement immédiat"
                            : client.delaiPaiement === 1
                            ? "⏰ Paiement C+1"
                            : "⏰⏰ Paiement C+2";
                          return (
                            <div key={i} className={`rounded-xl border-2 p-2.5 flex items-center justify-between mb-1.5 ${colorCls}`}>
                              <div>
                                <div className="font-bold text-sm">{client.titre}</div>
                                <div className="text-xs opacity-75">{delaiLabel} · 4 écritures</div>
                              </div>
                              <div className="font-bold text-xl">+{client.montantVentes}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <button onClick={launchStep}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm shadow-sm transition-colors">
                      🔍 Voir et comprendre cette étape
                    </button>
                  </div>
                )}
              </div>

              {/* Journal comptable */}
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                <button onClick={() => setShowJournal(!showJournal)}
                  className="w-full flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <span>📖 Journal comptable ({journal.length})</span>
                  <span>{showJournal ? "▲" : "▼"}</span>
                </button>
                {showJournal && (
                  <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                    {journal.length === 0
                      ? <p className="text-xs text-gray-300 italic">Aucune opération encore</p>
                      : journal.map(e => (
                        <div key={e.id} className="bg-white rounded-lg p-2 border border-gray-100 text-xs">
                          <div className="font-bold text-indigo-700">
                            {e.joueurNom} — Tour {e.tour}, Étape {e.etape + 1}
                          </div>
                          <div className="text-gray-500 mb-1">{e.titre}</div>
                          {e.entries.filter(en => en.applied || e.entries.length === 0).map((en, i) => (
                            <div key={i} className={`flex justify-between text-xs ${en.delta > 0 ? "text-blue-600" : "text-orange-600"}`}>
                              <span>{nomCompte(en.poste)}</span>
                              <span>{en.delta > 0 ? "+" : ""}{en.delta}</span>
                            </div>
                          ))}
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            </>
          )}
        </aside>

        {/* ─── CONTENU PRINCIPAL ─── */}
        <main className="flex-1 overflow-y-auto p-4">

          {/* En-tête joueur */}
          <div className="flex items-center gap-3 mb-4 p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
            <span className="text-3xl">{joueur.entreprise.icon}</span>
            <div className="flex-1">
              <div className="font-bold text-xl text-gray-800">{joueur.pseudo}</div>
              <div className="text-sm text-gray-400">{joueur.entreprise.nom} · {joueur.entreprise.specialite}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">Trésorerie</div>
              <div className={`font-bold text-lg ${getTresorerie(displayJoueur) < 0 ? "text-red-600" : "text-green-700"}`}>
                {getTresorerie(displayJoueur)}
              </div>
              {activeStep && (
                <div className="text-xs text-indigo-500 font-medium">
                  ✏️ Saisie en cours…
                </div>
              )}
            </div>
          </div>

          {/* Onglets — clignotent quand une saisie est en cours */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {TABS.map(([tab, label]) => {
              const isLive = !!activeStep && tab !== "indicateurs";
              return (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab
                      ? "bg-indigo-600 text-white shadow-sm"
                      : isLive
                      ? "bg-white text-indigo-700 border-2 border-indigo-400 hover:border-indigo-500"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300"
                  }`}>
                  {label}
                  {isLive && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Contenu de l'onglet */}
          <div>
            {activeTab === "bilan"       && <BilanPanel joueur={displayJoueur} />}
            {activeTab === "cr"          && <CompteResultatPanel joueur={displayJoueur} />}
            {activeTab === "indicateurs" && <IndicateursPanel joueur={displayJoueur} />}
          </div>

          {/* Cartes actives */}
          {joueur.cartesActives.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Cartes actives</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {joueur.cartesActives.map(c => (
                  <div key={c.id}>
                    <CarteView carte={c} compact />
                    {c.clientParTour && (
                      <div className={`mt-1 text-xs text-center rounded-lg py-0.5 px-1 font-semibold ${
                        c.clientParTour === "particulier" ? "bg-green-100 text-green-700" :
                        c.clientParTour === "tpe"         ? "bg-blue-100 text-blue-700"   :
                                                            "bg-purple-100 text-purple-700"
                      }`}>
                        {c.clientParTour === "particulier" ? "→ 👤 Particulier/tour" :
                         c.clientParTour === "tpe"         ? "→ 🏠 TPE/tour" :
                                                             "→ 🏢 Grand Compte/tour"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sélecteur de cartes Décision */}
          {etat.etapeTour === 6 && showCartes && !activeStep && (
            <div className="mt-4">
              <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Choisissez une carte Décision</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cartesDisponibles.map(c => (
                  <CarteView key={c.id} carte={c}
                    onClick={() => setSelectedDecision(selectedDecision?.id === c.id ? null : c)}
                    selected={selectedDecision?.id === c.id} />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
