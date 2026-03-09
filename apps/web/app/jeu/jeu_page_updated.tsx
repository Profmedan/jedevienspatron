"use client";

import { useState } from "react";
import Link from "next/link";
import { EtatJeu, NomEntreprise, CarteDecision, Joueur } from "@/lib/game-engine/types";
import { ENTREPRISES } from "@/lib/game-engine/data/entreprises";
import {
  initialiserJeu,
  avancerEtape,
  appliquerEtape0,
  appliquerAchatMarchandises,
  appliquerAvancementCreances,
  appliquerPaiementCommerciaux,
  appliquerCarteClient,
  appliquerEffetsRecurrents,
  tirerCartesDecision,
  acheterCarteDecision,
  appliquerCarteEvenement,
  verifierFinTour,
  cloturerAnnee,
  genererClientsParCommerciaux,
} from "@/lib/game-engine/engine";
import { calculerScore, calculerIndicateurs } from "@/lib/game-engine/calculators";
import BilanPanel from "@/components/BilanPanel";
import CompteResultatPanel from "@/components/CompteResultatPanel";
import CarteView from "@/components/CarteView";
import EtapeGuide from "@/components/EtapeGuide";
import IndicateursPanel from "@/components/IndicateursPanel";

// Deep clone via JSON for pure state
function cloneEtat(etat: EtatJeu): EtatJeu {
  return JSON.parse(JSON.stringify(etat));
}

// ─── SETUP SCREEN ─────────────────────────────────────────────────────────────

interface PlayerSetup {
  pseudo: string;
  entreprise: NomEntreprise;
}

function SetupScreen({ onStart }: { onStart: (players: PlayerSetup[]) => void }) {
  const [nbJoueurs, setNbJoueurs] = useState(2);
  const defaultPlayers: PlayerSetup[] = [
    { pseudo: "Joueur 1", entreprise: "Entreprise Orange" },
    { pseudo: "Joueur 2", entreprise: "Entreprise Violette" },
    { pseudo: "Joueur 3", entreprise: "Entreprise Bleue" },
    { pseudo: "Joueur 4", entreprise: "Entreprise Verte" },
  ];
  const [players, setPlayers] = useState<PlayerSetup[]>(defaultPlayers);
  const allEntreprises = ENTREPRISES.map((e) => e.nom);
  const usedEntreprises = players.slice(0, nbJoueurs).map((p) => p.entreprise);

  function updatePlayer(idx: number, field: "pseudo" | "entreprise", value: string) {
    const next = [...players];
    next[idx] = { ...next[idx], [field]: value };
    setPlayers(next);
  }

  const active = players.slice(0, nbJoueurs);
  const pseudosOk = active.every((p) => p.pseudo.trim().length > 0);
  const entreprisesOk = new Set(active.map((p) => p.entreprise)).size === nbJoueurs;
  const canStart = pseudosOk && entreprisesOk;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-50 to-blue-100">
      <Link href="/" className="text-indigo-400 text-sm mb-6 hover:underline">← Retour à l&apos;accueil</Link>
      <h2 className="text-3xl font-bold text-indigo-900 mb-2">🎮 Configuration de la partie</h2>
      <p className="text-indigo-500 mb-8 text-sm">Choisissez le nombre de joueurs et configurez chaque équipe</p>

      <div className="flex gap-3 mb-8">
        {[2, 3, 4].map((n) => (
          <button
            key={n}
            onClick={() => setNbJoueurs(n)}
            className={`w-14 h-14 rounded-2xl font-bold text-xl transition-all ${nbJoueurs === n ? "bg-indigo-600 text-white shadow-lg scale-110" : "bg-white text-indigo-600 border-2 border-indigo-200 hover:border-indigo-400"}`}
          >
            {n}
          </button>
        ))}
        <span className="self-center text-indigo-400 text-sm">joueur(s)</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mb-8">
        {Array.from({ length: nbJoueurs }).map((_, i) => {
          const ent = ENTREPRISES.find((e) => e.nom === players[i].entreprise)!;
          return (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-indigo-100">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{ent.icon}</span>
                <input
                  value={players[i].pseudo}
                  onChange={(e) => updatePlayer(i, "pseudo", e.target.value)}
                  className="flex-1 border-b-2 border-indigo-200 focus:border-indigo-500 outline-none px-1 py-0.5 font-bold text-gray-800"
                  placeholder={`Joueur ${i + 1}`}
                  maxLength={20}
                />
              </div>
              <select
                value={players[i].entreprise}
                onChange={(e) => updatePlayer(i, "entreprise", e.target.value as NomEntreprise)}
                className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                {allEntreprises.map((nom) => (
                  <option
                    key={nom}
                    value={nom}
                    disabled={usedEntreprises.includes(nom) && players[i].entreprise !== nom}
                  >
                    {nom}{usedEntreprises.includes(nom) && players[i].entreprise !== nom ? " (déjà prise)" : ""}
                  </option>
                ))}
              </select>
              <div className="mt-2 text-xs text-indigo-400">
                {ent.specialite} · <strong>{ent.type}</strong>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => onStart(players.slice(0, nbJoueurs))}
        disabled={!canStart}
        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold px-12 py-4 rounded-2xl text-lg shadow-lg transition-all"
      >
        🚀 Lancer la partie
      </button>
    </div>
  );
}

// ─── GAME OVER SCREEN ─────────────────────────────────────────────────────────

function GameOverScreen({ etat, onRestart }: { etat: EtatJeu; onRestart: () => void }) {
  const classement = [...etat.joueurs]
    .map((j) => ({ ...j, score: calculerScore(j) }))
    .sort((a, b) => b.score - a.score);
  const medals = ["🥇", "🥈", "🥉", "4️⃣"];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-50 to-purple-100">
      <h2 className="text-4xl font-bold text-indigo-900 mb-2">🏁 Fin de la partie !</h2>
      <p className="text-indigo-500 mb-8">Classement final après 4 tours</p>
      <div className="space-y-3 w-full max-w-md mb-8">
        {classement.map((j, rank) => (
          <div key={j.id} className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-indigo-100">
            <span className="text-2xl">{medals[rank]}</span>
            <div className="flex-1">
              <div className="font-bold text-gray-800">{j.pseudo}</div>
              <div className="text-sm text-indigo-400">{j.entreprise.nom}</div>
            </div>
            <div className={`text-2xl font-bold ${j.elimine ? "text-red-400 line-through" : "text-indigo-700"}`}>
              {j.elimine ? "💀" : j.score}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={onRestart}
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-10 py-3 rounded-2xl shadow-lg"
      >
        🔄 Nouvelle partie
      </button>
    </div>
  );
}

// ─── ANALYSE FINANCIÈRE ────────────────────────────────────────────────────────

interface MessageAnalyse {
  niveau: "rouge" | "jaune" | "vert";
  message: string;
}

function analyserSituationFinanciere(joueur: Joueur): MessageAnalyse[] {
  const ind = calculerIndicateurs(joueur);
  const messages: MessageAnalyse[] = [];

  // 1. Trésorerie nette
  if (ind.tresorerieNette < 0) {
    messages.push({
      niveau: "rouge",
      message: `⚠️ Votre trésorerie nette est négative (${ind.tresorerieNette}). Votre fonds de roulement ne couvre pas votre BFR : risque de rupture de trésorerie. Réduisez vos stocks et accélérez l'encaissement de vos créances.`,
    });
  } else if (ind.tresorerieNette < 5) {
    messages.push({
      niveau: "jaune",
      message: `🔶 Votre trésorerie nette est faible (${ind.tresorerieNette}). Vous restez solvable mais la marge de sécurité est étroite. Surveillez vos délais d'encaissement.`,
    });
  } else {
    messages.push({
      niveau: "vert",
      message: `✅ Votre trésorerie nette est positive (${ind.tresorerieNette}). Votre équilibre financier est maîtrisé.`,
    });
  }

  // 2. Fonds de roulement
  if (ind.fondsDeRoulement < 0) {
    messages.push({
      niveau: "rouge",
      message: `⚠️ Votre fonds de roulement est négatif (${ind.fondsDeRoulement}). Vos ressources stables ne financent pas la totalité de vos immobilisations : fragilité structurelle.`,
    });
  } else if (ind.besoinFondsRoulement > ind.fondsDeRoulement) {
    messages.push({
      niveau: "jaune",
      message: `🔶 Votre BFR (${ind.besoinFondsRoulement}) dépasse votre FR (${ind.fondsDeRoulement}). Pensez à négocier des délais fournisseurs ou à réduire vos stocks.`,
    });
  }

  // 3. Résultat net
  if (ind.resultatNet < 0) {
    messages.push({
      niveau: "rouge",
      message: `📉 Votre résultat est déficitaire (${ind.resultatNet}). Vos charges dépassent vos produits. Identifiez les postes à réduire pour revenir à l'équilibre.`,
    });
  } else if (ind.resultatNet === 0) {
    messages.push({
      niveau: "jaune",
      message: `⚖️ Votre résultat net est nul. Vous êtes à l'équilibre — mais sans bénéfice, vos capitaux propres ne se renforcent pas.`,
    });
  } else {
    messages.push({
      niveau: "vert",
      message: `📈 Votre résultat net est bénéficiaire (${ind.resultatNet}). Vos capitaux propres progressent ce trimestre.`,
    });
  }

  // 4. Solvabilité
  if (ind.ratioSolvabilite < 20) {
    messages.push({
      niveau: "rouge",
      message: `⚠️ Votre ratio de solvabilité est très faible (${ind.ratioSolvabilite.toFixed(0)}%). Les tiers financent l'essentiel de votre actif — votre indépendance financière est menacée.`,
    });
  } else if (ind.ratioSolvabilite < 33) {
    messages.push({
      niveau: "jaune",
      message: `🔶 Votre solvabilité est acceptable (${ind.ratioSolvabilite.toFixed(0)}%) mais pourrait être renforcée par des bénéfices mis en réserve.`,
    });
  } else {
    messages.push({
      niveau: "vert",
      message: `✅ Votre solvabilité est solide (${ind.ratioSolvabilite.toFixed(0)}%). Vos capitaux propres représentent une part significative du passif.`,
    });
  }

  return messages;
}

// ─── OVERLAY DE TRANSITION DE TRIMESTRE ───────────────────────────────────────

interface TourTransitionData {
  etat: EtatJeu;
  prochainTour: number;
}

function TourTransitionOverlay({
  data,
  onDemarrer,
}: {
  data: TourTransitionData;
  onDemarrer: () => void;
}) {
  const niveauColors = {
    rouge: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800" },
    jaune: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800" },
    vert: { bg: "bg-green-50", border: "border-green-200", text: "text-green-800" },
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-4">
        {/* Header */}
        <div className="bg-indigo-700 text-white rounded-t-3xl px-6 py-5 text-center">
          <div className="text-3xl mb-1">📊</div>
          <h2 className="text-xl font-bold">Bilan du Trimestre {data.prochainTour - 1}</h2>
          <p className="text-indigo-200 text-sm mt-1">
            Analyse de votre situation financière avant le trimestre {data.prochainTour}
          </p>
        </div>

        {/* Analyses par joueur */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {data.etat.joueurs.map((joueur) => {
            const messages = analyserSituationFinanciere(joueur);
            return (
              <div key={joueur.id} className="border border-gray-100 rounded-2xl overflow-hidden">
                {/* Joueur header */}
                <div className="bg-indigo-50 px-4 py-3 flex items-center gap-2">
                  <span className="text-2xl">{joueur.entreprise.icon}</span>
                  <div>
                    <div className="font-bold text-indigo-900">{joueur.pseudo}</div>
                    <div className="text-xs text-indigo-400">{joueur.entreprise.nom}</div>
                  </div>
                  {joueur.elimine && (
                    <span className="ml-auto text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">
                      💀 En faillite
                    </span>
                  )}
                </div>

                {/* Messages */}
                <div className="p-3 space-y-2">
                  {joueur.elimine ? (
                    <p className="text-sm text-gray-500 italic px-1">
                      Cette entreprise a été éliminée et ne participe plus à la partie.
                    </p>
                  ) : (
                    messages.map((msg, i) => {
                      const colors = niveauColors[msg.niveau];
                      return (
                        <div
                          key={i}
                          className={`${colors.bg} ${colors.border} border rounded-xl px-3 py-2 text-sm ${colors.text}`}
                        >
                          {msg.message}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-3xl">
          <p className="text-xs text-indigo-500 text-center mb-3">
            👉 Consultez l&apos;onglet <strong>Indicateurs</strong> pendant la partie pour le détail complet de vos ratios financiers.
          </p>
          <button
            onClick={onDemarrer}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl text-base shadow-sm transition-colors"
          >
            🚀 Démarrer le Trimestre {data.prochainTour}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN GAME PAGE ───────────────────────────────────────────────────────────

export default function JeuPage() {
  const [etat, setEtat] = useState<EtatJeu | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"bilan" | "cr" | "indicateurs">("bilan");
  const [showCartes, setShowCartes] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<CarteDecision | null>(null);
  const [achatQte, setAchatQte] = useState(2);
  const [achatMode, setAchatMode] = useState<"tresorerie" | "dettes">("tresorerie");
  const [gameOver, setGameOver] = useState(false);
  const [tourTransitionState, setTourTransitionState] = useState<TourTransitionData | null>(null);

  function addMsg(msg: string) {
    setMessages((prev) => [msg, ...prev.slice(0, 9)]);
  }

  function handleStart(players: PlayerSetup[]) {
    const joueursDefs = players.map((p) => ({
      pseudo: p.pseudo,
      nomEntreprise: p.entreprise,
    }));
    const newEtat = initialiserJeu(joueursDefs);
    setEtat(newEtat);
    setMessages([]);
    addMsg("🎮 Partie commencée ! Tour 1 — Étape 1 : Charges fixes");
  }

  function applyStep() {
    if (!etat) return;
    const next = cloneEtat(etat);
    const idx = next.joueurActif;
    const joueur = next.joueurs[idx];

    switch (next.etapeTour) {
      case 0: {
        const res = appliquerEtape0(next, idx);
        if (!res.succes) { addMsg("❌ " + res.messageErreur); return; }
        addMsg("💼 Charges fixes & amortissements appliqués");
        break;
      }
      case 2: {
        const res = appliquerAvancementCreances(next, idx);
        if (!res.succes) { addMsg("❌ " + res.messageErreur); return; }
        addMsg("⏩ Créances avancées (C+2→C+1→Tréso)");
        break;
      }
      case 3: {
        const clients = genererClientsParCommerciaux(joueur);
        next.joueurs[idx].clientsATrait = [...next.joueurs[idx].clientsATrait, ...clients];
        const res = appliquerPaiementCommerciaux(next, idx);
        if (!res.succes) { addMsg("❌ " + res.messageErreur); return; }
        addMsg(`👔 Commerciaux payés. ${clients.length} client(s) généré(s)`);
        break;
      }
      case 4: {
        const clientsATrait = next.joueurs[idx].clientsATrait;
        if (clientsATrait.length === 0) {
          addMsg("🤝 Aucun client à traiter ce tour.");
        } else {
          for (const client of clientsATrait) {
            const res = appliquerCarteClient(next, idx, client);
            if (!res.succes) addMsg("❌ " + res.messageErreur);
          }
          next.joueurs[idx].clientsATrait = [];
          addMsg(`🤝 ${clientsATrait.length} client(s) traité(s) — 4 écritures chacun`);
        }
        break;
      }
      case 5: {
        const res = appliquerEffetsRecurrents(next, idx);
        if (!res.succes) { addMsg("❌ " + res.messageErreur); return; }
        addMsg("🔄 Effets récurrents des cartes Décision appliqués");
        break;
      }
      case 6: {
        // Handled by dedicated button — skip to next
        addMsg("⏭️ Étape Décision : choisissez une carte ou passez");
        setEtat(next);
        return;
      }
      case 7: {
        if (next.piocheEvenements.length === 0) {
          addMsg("📭 Pioche événements vide.");
        } else {
          const carte = next.piocheEvenements[0];
          const res = appliquerCarteEvenement(next, idx, carte);
          next.piocheEvenements = next.piocheEvenements.slice(1);
          if (!res.succes) { addMsg("❌ " + res.messageErreur); return; }
          addMsg(`🎲 Événement : ${carte.titre}`);
        }
        break;
      }
      case 8: {
        const fin = verifierFinTour(next, idx);
        if (fin.enFaillite) {
          addMsg(`💀 ${joueur.pseudo} est en faillite : ${fin.raisonFaillite ?? ""}`);
        }
        addMsg(`✅ Score de ${joueur.pseudo} : ${fin.score} — ${fin.message}`);

        // Check if all players done this tour
        const nextJoueurIdx = (idx + 1) % next.nbJoueurs;
        if (nextJoueurIdx === 0) {
          // All players done — check if game is over
          if (next.tourActuel >= 4) {
            setGameOver(true);
            setEtat(next);
            return;
          }
          // Show transition overlay with financial analysis before next tour
          setEtat(next);
          setTourTransitionState({ etat: next, prochainTour: next.tourActuel + 1 });
          return;
        } else {
          avancerEtape(next);
          next.joueurActif = nextJoueurIdx;
          next.etapeTour = 0;
          addMsg(`👤 Au tour de ${next.joueurs[nextJoueurIdx].pseudo}`);
        }
        setEtat(next);
        return;
      }
    }

    avancerEtape(next);
    setEtat(next);
  }

  function handleAchat() {
    if (!etat) return;
    const next = cloneEtat(etat);
    const res = appliquerAchatMarchandises(next, next.joueurActif, achatQte, achatMode);
    if (!res.succes) { addMsg("❌ " + res.messageErreur); return; }
    avancerEtape(next);
    addMsg(`📦 Achat de ${achatQte} unité(s) — mode ${achatMode === "tresorerie" ? "comptant" : "à crédit"}`);
    setEtat(next);
  }

  function handleSkipAchat() {
    if (!etat) return;
    const next = cloneEtat(etat);
    avancerEtape(next);
    addMsg("⏭️ Achat de marchandises ignoré");
    setEtat(next);
  }

  function handleBuyDecision() {
    if (!etat || !selectedDecision) return;
    const next = cloneEtat(etat);
    const res = acheterCarteDecision(next, next.joueurActif, selectedDecision);
    if (!res.succes) { addMsg("❌ " + res.messageErreur); return; }
    avancerEtape(next);
    addMsg(`🎯 Carte achetée : ${selectedDecision.titre}`);
    setSelectedDecision(null);
    setShowCartes(false);
    setEtat(next);
  }

  function handleDemarrerTourSuivant() {
    if (!tourTransitionState) return;
    const next = cloneEtat(tourTransitionState.etat);
    cloturerAnnee(next);
    next.tourActuel++;
    next.etapeTour = 0;
    next.joueurActif = 0;
    addMsg(`🔔 Trimestre ${next.tourActuel} commence !`);
    setTourTransitionState(null);
    setEtat(next);
  }

  function handleSkipDecision() {
    if (!etat) return;
    const next = cloneEtat(etat);
    avancerEtape(next);
    addMsg("⏭️ Aucune carte Décision achetée ce tour");
    setShowCartes(false);
    setEtat(next);
  }

  if (!etat) return <SetupScreen onStart={handleStart} />;
  if (gameOver) return <GameOverScreen etat={etat} onRestart={() => { setEtat(null); setGameOver(false); setMessages([]); }} />;
  if (tourTransitionState) return (
    <TourTransitionOverlay
      data={tourTransitionState}
      onDemarrer={handleDemarrerTourSuivant}
    />
  );

  const joueur = etat.joueurs[etat.joueurActif];
  const cartesDisponibles = (() => {
    // Preview without mutating
    const preview = cloneEtat(etat);
    return tirerCartesDecision(preview, 4);
  })();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* TOP BAR */}
      <header className="bg-indigo-700 text-white px-4 py-2 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-indigo-200 hover:text-white text-sm">← Accueil</Link>
          <span className="font-bold text-lg">🎓 KICLEPATRON</span>
        </div>
        <div className="text-sm font-medium hidden sm:block">
          Tour {etat.tourActuel}/4 · Étape {etat.etapeTour + 1}/9
        </div>
        <div className="flex items-center gap-1">
          {etat.joueurs.map((j, i) => (
            <div
              key={j.id}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${i === etat.joueurActif ? "bg-white text-indigo-700 shadow" : "text-indigo-300"} ${j.elimine ? "line-through opacity-40" : ""}`}
            >
              {j.entreprise.icon} {j.pseudo}
            </div>
          ))}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL */}
        <aside className="w-72 flex flex-col gap-3 p-3 border-r border-gray-200 bg-white overflow-y-auto shrink-0">
          <EtapeGuide etape={etat.etapeTour} tourActuel={etat.tourActuel} nbTours={4} />

          {/* Action panel */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm">
            {etat.etapeTour === 1 ? (
              <div className="space-y-3">
                <div className="text-sm font-bold text-gray-700">📦 Achats de marchandises</div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 shrink-0">Quantité :</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={achatQte}
                    onChange={(e) => setAchatQte(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 border rounded-lg px-2 py-1 text-center text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  {(["tresorerie", "dettes"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setAchatMode(m)}
                      className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-all ${achatMode === m ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                      {m === "tresorerie" ? "💵 Comptant" : "📋 À crédit"}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAchat} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2 rounded-xl font-bold">
                    ✅ Acheter
                  </button>
                  <button onClick={handleSkipAchat} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm py-2 rounded-xl">
                    Passer
                  </button>
                </div>
              </div>
            ) : etat.etapeTour === 6 ? (
              <div className="space-y-2">
                <div className="text-sm font-bold text-gray-700 mb-2">🎯 Carte Décision</div>
                <button
                  onClick={() => setShowCartes(!showCartes)}
                  className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm py-2 rounded-xl font-medium"
                >
                  {showCartes ? "▲ Masquer les cartes" : "▼ Voir les cartes disponibles"}
                </button>
                {selectedDecision && (
                  <button
                    onClick={handleBuyDecision}
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2 rounded-xl font-bold"
                  >
                    ✅ Acheter : {selectedDecision.titre}
                  </button>
                )}
                <button onClick={handleSkipDecision} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm py-2 rounded-xl">
                  ⏭️ Passer cette étape
                </button>
              </div>
            ) : (
              <button
                onClick={applyStep}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-sm"
              >
                ▶️ Appliquer l&apos;étape
              </button>
            )}
          </div>

          {/* Message log */}
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">📋 Journal</div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-xs text-gray-300 italic">Aucun message</div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className={`text-xs ${i === 0 ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                    {m}
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-4">
          {/* Player header */}
          <div className="flex items-center gap-3 mb-4 p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
            <span className="text-3xl">{joueur.entreprise.icon}</span>
            <div className="flex-1">
              <div className="font-bold text-xl text-gray-800">{joueur.pseudo}</div>
              <div className="text-sm text-gray-400">{joueur.entreprise.nom} · {joueur.entreprise.specialite}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">Cartes actives</div>
              <div className="font-bold text-indigo-600">{joueur.cartesActives.length}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {([
              ["bilan", "📋 Bilan"],
              ["cr", "📈 Résultat"],
              ["indicateurs", "📊 Indicateurs"],
            ] as const).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab ? "bg-indigo-600 text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="animate-slide-in">
            {activeTab === "bilan" && <BilanPanel joueur={joueur} />}
            {activeTab === "cr" && <CompteResultatPanel joueur={joueur} />}
            {activeTab === "indicateurs" && <IndicateursPanel joueur={joueur} />}
          </div>

          {/* Active cards */}
          {joueur.cartesActives.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                Cartes actives ({joueur.cartesActives.length})
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {joueur.cartesActives.map((c) => (
                  <CarteView key={c.id} carte={c} compact />
                ))}
              </div>
            </div>
          )}

          {/* Decision cards picker */}
          {etat.etapeTour === 6 && showCartes && (
            <div className="mt-4 animate-slide-in">
              <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                🎯 Choisissez une carte Décision
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cartesDisponibles.map((c) => (
                  <CarteView
                    key={c.id}
                    carte={c}
                    onClick={() => setSelectedDecision(selectedDecision?.id === c.id ? null : c)}
                    selected={selectedDecision?.id === c.id}
                  />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
