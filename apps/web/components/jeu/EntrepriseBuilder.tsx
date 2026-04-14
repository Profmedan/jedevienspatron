"use client";

import React, { useState } from "react";
import { ENTREPRISES } from "@jedevienspatron/game-engine";
import type { EntrepriseTemplate } from "@jedevienspatron/game-engine";

interface EntrepriseBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (template: EntrepriseTemplate) => void;
}

const STEP_LABELS = [
  "Comprendre",
  "Profil",
  "Bilan",
  "Identité",
];

const COLOR_SWATCHES = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

const EMOJI_SUGGESTIONS = [
  "🏭", "🚚", "🛒", "🔬", "🏪",
  "☕", "🍔", "🧑‍💻", "⚙️", "🧪",
];

interface DifficultyPreset {
  tresorerie?: number;
  emprunts?: number;
  capitaux?: number;
}

const DIFFICULTY_PRESETS: Record<string, DifficultyPreset> = {
  easy: { tresorerie: 12, emprunts: 4, capitaux: 20 },
  normal: {}, // Use template defaults
  hard: { tresorerie: 4, emprunts: 14, capitaux: 14 },
};

export default function EntrepriseBuilder({
  isOpen,
  onClose,
  onComplete,
}: EntrepriseBuilderProps) {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<
    typeof ENTREPRISES[0] | null
  >(null);

  // Step 3: Actif side
  const [immo1Nom, setImmo1Nom] = useState("");
  const [immo1Valeur, setImmo1Valeur] = useState(0);
  const [immo2Nom, setImmo2Nom] = useState("");
  const [immo2Valeur, setImmo2Valeur] = useState(0);
  const [autresImmo, setAutresImmo] = useState(0);
  const [stocks, setStocks] = useState(0);
  const [tresorerie, setTresorerie] = useState(0);

  // Step 3: Passif side
  const [capitauxPropres, setCapitauxPropres] = useState(0);
  const [emprunts, setEmprunts] = useState(0);
  const [dettes, setDettes] = useState(0);

  // Step 4: Identité
  const [nomEntreprise, setNomEntreprise] = useState("");
  const [icon, setIcon] = useState("");
  const [couleur, setCouleur] = useState("");
  const [specialite, setSpecialite] = useState("");

  // Initialize step 3 when template is selected
  const initializeStep3 = (template: typeof ENTREPRISES[0]) => {
    const actif1 = template.actifs[0];
    const actif2 = template.actifs[1];

    setImmo1Nom(actif1.nom);
    setImmo1Valeur(actif1.valeur / 1000);

    setImmo2Nom(actif2.nom);
    setImmo2Valeur(actif2.valeur / 1000);

    const autresImmoItem = template.actifs.find(
      (a) => a.nom === "Autres Immobilisations"
    );
    setAutresImmo((autresImmoItem?.valeur ?? 0) / 1000);

    const stocksItem = template.actifs.find((a) => a.nom === "Stocks");
    setStocks((stocksItem?.valeur ?? 0) / 1000);

    const tresoItem = template.actifs.find((a) => a.nom === "Trésorerie");
    setTresorerie((tresoItem?.valeur ?? 0) / 1000);

    // Passif
    const capitaux = template.passifs.find((p) =>
      p.nom.toLowerCase().includes("capitaux")
    );
    setCapitauxPropres((capitaux?.valeur ?? 0) / 1000);

    const empruntItem = template.passifs.find((p) =>
      p.nom.toLowerCase().includes("emprunt")
    );
    setEmprunts((empruntItem?.valeur ?? 0) / 1000);

    const dettesItem = template.passifs.find((p) =>
      p.nom.toLowerCase().includes("dettes")
    );
    setDettes((dettesItem?.valeur ?? 0) / 1000);

    // Step 4 defaults
    setIcon(template.icon);
    setCouleur(template.couleur);
    setSpecialite(template.specialite);
  };

  const handleSelectTemplate = (template: typeof ENTREPRISES[0]) => {
    setSelectedTemplate(template);
    initializeStep3(template);
  };

  const totalActif = immo1Valeur + immo2Valeur + autresImmo + stocks + tresorerie;
  const totalPassif = capitauxPropres + emprunts + dettes;
  const isBalanced = Math.abs(totalActif - totalPassif) < 0.01;
  const difference = totalActif - totalPassif;

  const applyDifficultyPreset = (preset: DifficultyPreset) => {
    if (preset.tresorerie !== undefined) setTresorerie(preset.tresorerie);
    if (preset.emprunts !== undefined) setEmprunts(preset.emprunts);
    if (preset.capitaux !== undefined) setCapitauxPropres(preset.capitaux);
  };

  const handleNextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = () => {
    if (!selectedTemplate || !nomEntreprise.trim() || !isBalanced) return;

    const template: EntrepriseTemplate = {
      nom: nomEntreprise.trim(),
      type: selectedTemplate.type,
      couleur: couleur || selectedTemplate.couleur,
      icon: icon || selectedTemplate.icon,
      specialite: specialite || selectedTemplate.specialite,
      reducDelaiPaiement: selectedTemplate.reducDelaiPaiement,
      clientGratuitParTour: selectedTemplate.clientGratuitParTour,
      effetsPassifs: selectedTemplate.effetsPassifs,
      cartesLogistiquesDepart: selectedTemplate.cartesLogistiquesDepart,
      cartesLogistiquesDisponibles:
        selectedTemplate.cartesLogistiquesDisponibles,
      actifs: [
        { nom: immo1Nom, valeur: immo1Valeur * 1000 },
        { nom: immo2Nom, valeur: immo2Valeur * 1000 },
        ...(autresImmo > 0
          ? [{ nom: "Autres Immobilisations", valeur: autresImmo * 1000 }]
          : []),
        { nom: "Stocks", valeur: stocks * 1000 },
        { nom: "Trésorerie", valeur: tresorerie * 1000 },
      ],
      passifs: [
        { nom: "Capitaux propres", valeur: capitauxPropres * 1000 },
        ...(emprunts > 0
          ? [{ nom: "Emprunts", valeur: emprunts * 1000 }]
          : []),
        ...(dettes > 0
          ? [{ nom: "Dettes fournisseurs", valeur: dettes * 1000 }]
          : []),
      ],
    };

    onComplete(template);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Créer mon entreprise
          </h1>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {STEP_LABELS.map((label, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm sm:text-base transition-all ${
                step === idx + 1
                  ? "bg-cyan-400 text-slate-950 font-semibold"
                  : idx + 1 < step
                    ? "bg-white/10 text-white/70"
                    : "bg-white/5 text-slate-400"
              }`}
            >
              {idx + 1} — {label}
            </div>
          ))}
        </div>

        {/* Step 1: Comprendre le bilan */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">
                Un bilan, c'est quoi ?
              </h2>
              <p className="text-slate-300 text-base leading-relaxed">
                Une photo de votre entreprise à un instant donné.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-cyan-300">
                  À gauche — Actif
                </h3>
                <p className="text-slate-300 text-sm">
                  Ce que vous possédez. Machines, stocks, argent en banque.
                </p>
                <div className="space-y-2 p-4 bg-cyan-500/10 rounded-xl border border-cyan-400/20">
                  <div className="h-8 bg-cyan-400/30 rounded"></div>
                  <div className="h-8 bg-cyan-400/30 rounded"></div>
                  <div className="h-8 bg-cyan-400/30 rounded"></div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-amber-300">
                  À droite — Passif
                </h3>
                <p className="text-slate-300 text-sm">
                  Comment c'est financé. Votre apport, emprunts, dettes à
                  payer.
                </p>
                <div className="space-y-2 p-4 bg-amber-500/10 rounded-xl border border-amber-400/20">
                  <div className="h-8 bg-amber-400/30 rounded"></div>
                  <div className="h-8 bg-amber-400/30 rounded"></div>
                  <div className="h-8 bg-amber-400/30 rounded"></div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-green-500/10 border border-green-400/30">
              <p className="text-green-300 font-semibold text-center">
                Règle d'or: Actif = Passif. Toujours.
              </p>
            </div>

            <div className="text-center pt-4">
              <button
                onClick={handleNextStep}
                className="bg-cyan-400 text-slate-950 hover:bg-cyan-300 rounded-full px-8 py-3 font-semibold transition-all inline-flex items-center gap-2"
              >
                Suivant →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Choisir un profil */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">
              Choisissez votre profil de base
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ENTREPRISES.map((entreprise) => (
                <button
                  key={entreprise.nom}
                  onClick={() => handleSelectTemplate(entreprise)}
                  className={`p-6 rounded-2xl border-2 transition-all text-left ${
                    selectedTemplate?.nom === entreprise.nom
                      ? "border-cyan-400 bg-cyan-400/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{entreprise.icon}</div>
                    {selectedTemplate?.nom === entreprise.nom && (
                      <div className="text-cyan-400 text-2xl">✓</div>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    {entreprise.nom}
                  </h3>
                  <p className="text-sm text-slate-400 mb-2">
                    {entreprise.type}
                  </p>
                  <p className="text-sm text-cyan-300">{entreprise.specialite}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-between gap-4 pt-4">
              <button
                onClick={handlePrevStep}
                className="border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 rounded-full px-8 py-3 font-semibold transition-all inline-flex items-center gap-2"
              >
                ← Précédent
              </button>
              <button
                onClick={handleNextStep}
                disabled={!selectedTemplate}
                className={`rounded-full px-8 py-3 font-semibold transition-all inline-flex items-center gap-2 ${
                  selectedTemplate
                    ? "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                    : "bg-slate-700 text-slate-500 cursor-not-allowed"
                }`}
              >
                Suivant →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Ajuster les montants */}
        {step === 3 && selectedTemplate && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Ajustez votre bilan
            </h2>

            {/* Balance bar */}
            <div className="space-y-2 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-cyan-300">
                      Actif
                    </span>
                    <span className="text-sm font-mono text-cyan-300">
                      {totalActif.toFixed(1)}k€
                    </span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 transition-all"
                      style={{
                        width: `${totalActif > 0 ? Math.min((totalActif / Math.max(totalActif, totalPassif)) * 100, 100) : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-amber-300">
                      Passif
                    </span>
                    <span className="text-sm font-mono text-amber-300">
                      {totalPassif.toFixed(1)}k€
                    </span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 transition-all"
                      style={{
                        width: `${totalPassif > 0 ? Math.min((totalPassif / Math.max(totalActif, totalPassif)) * 100, 100) : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                {isBalanced ? (
                  <p className="text-green-400 font-semibold">
                    ✓ Bilan équilibré
                  </p>
                ) : (
                  <p className="text-red-400 font-semibold">
                    ⚠ Écart: {Math.abs(difference).toFixed(1)}k€ (
                    {difference > 0 ? "Actif" : "Passif"} trop{" "}
                    {difference > 0 ? "élevé" : "faible"})
                  </p>
                )}
              </div>
            </div>

            {/* Input grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* ACTIF */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-cyan-300">Actif</h3>

                {/* Immo 1 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-slate-300">
                      {immo1Nom}
                    </label>
                    <div className="group relative">
                      <button className="text-xs text-slate-400 hover:text-slate-200 w-5 h-5 rounded-full border border-slate-500 flex items-center justify-center">
                        ⓘ
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                        Biens durables: machines, bâtiments, véhicules
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={immo1Nom}
                    onChange={(e) => setImmo1Nom(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-2 text-white focus:border-cyan-300 focus:outline-none text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={immo1Valeur}
                      onChange={(e) =>
                        setImmo1Valeur(Math.max(0, Number(e.target.value) || 0))
                      }
                      className="flex-1 bg-black/20 border border-white/10 rounded-2xl px-4 py-2 text-white focus:border-cyan-300 focus:outline-none"
                    />
                    <span className="text-slate-400 text-sm">k€</span>
                  </div>
                </div>

                {/* Immo 2 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-slate-300">
                      {immo2Nom}
                    </label>
                    <div className="group relative">
                      <button className="text-xs text-slate-400 hover:text-slate-200 w-5 h-5 rounded-full border border-slate-500 flex items-center justify-center">
                        ⓘ
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                        Biens durables pour votre activité
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={immo2Nom}
                    onChange={(e) => setImmo2Nom(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-2 text-white focus:border-cyan-300 focus:outline-none text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={immo2Valeur}
                      onChange={(e) =>
                        setImmo2Valeur(Math.max(0, Number(e.target.value) || 0))
                      }
                      className="flex-1 bg-black/20 border border-white/10 rounded-2xl px-4 py-2 text-white focus:border-cyan-300 focus:outline-none"
                    />
                    <span className="text-slate-400 text-sm">k€</span>
                  </div>
                </div>

                {/* Autres immobilisations */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-slate-300">
                      Autres immobilisations
                    </label>
                    <div className="group relative">
                      <button className="text-xs text-slate-400 hover:text-slate-200 w-5 h-5 rounded-full border border-slate-500 flex items-center justify-center">
                        ⓘ
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                        Autres équipements durables
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={autresImmo}
                      onChange={(e) =>
                        setAutresImmo(Math.max(0, Number(e.target.value) || 0))
                      }
                      className="flex-1 bg-black/20 border border-white/10 rounded-2xl px-4 py-2 text-white focus:border-cyan-300 focus:outline-none"
                    />
                    <span className="text-slate-400 text-sm">k€</span>
                  </div>
                </div>

                {/* Stocks */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-slate-300">
                      Stocks de marchandises
                    </label>
                    <div className="group relative">
                      <button className="text-xs text-slate-400 hover:text-slate-200 w-5 h-5 rounded-full border border-slate-500 flex items-center justify-center">
                        ⓘ
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                        Marchandises non encore vendues
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={stocks}
                      onChange={(e) =>
                        setStocks(Math.max(0, Number(e.target.value) || 0))
                      }
                      className="flex-1 bg-black/20 border border-white/10 rounded-2xl px-4 py-2 text-white focus:border-cyan-300 focus:outline-none"
                    />
                    <span className="text-slate-400 text-sm">k€</span>
                  </div>
                </div>

                {/* Trésorerie */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-slate-300">
                      Trésorerie
                    </label>
                    <div className="group relative">
                      <button className="text-xs text-slate-400 hover:text-slate-200 w-5 h-5 rounded-full border border-slate-500 flex items-center justify-center">
                        ⓘ
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                        Argent disponible immédiatement
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={tresorerie}
                      onChange={(e) =>
                        setTresorerie(Math.max(0, Number(e.target.value) || 0))
                      }
                      className="flex-1 bg-black/20 border border-white/10 rounded-2xl px-4 py-2 text-white focus:border-cyan-300 focus:outline-none"
                    />
                    <span className="text-slate-400 text-sm">k€</span>
                  </div>
                </div>
              </div>

              {/* PASSIF */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-amber-300">Passif</h3>

                {/* Capitaux propres */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-slate-300">
                      Capitaux propres
                    </label>
                    <div className="group relative">
                      <button className="text-xs text-slate-400 hover:text-slate-200 w-5 h-5 rounded-full border border-slate-500 flex items-center justify-center">
                        ⓘ
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                        Votre apport personnel
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={capitauxPropres}
                      onChange={(e) =>
                        setCapitauxPropres(
                          Math.max(0, Number(e.target.value) || 0)
                        )
                      }
                      className="flex-1 bg-black/20 border border-white/10 rounded-2xl px-4 py-2 text-white focus:border-cyan-300 focus:outline-none"
                    />
                    <span className="text-slate-400 text-sm">k€</span>
                  </div>
                </div>

                {/* Emprunts */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-slate-300">
                      Emprunt bancaire
                    </label>
                    <div className="group relative">
                      <button className="text-xs text-slate-400 hover:text-slate-200 w-5 h-5 rounded-full border border-slate-500 flex items-center justify-center">
                        ⓘ
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                        Prêt bancaire à rembourser
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={emprunts}
                      onChange={(e) =>
                        setEmprunts(Math.max(0, Number(e.target.value) || 0))
                      }
                      className="flex-1 bg-black/20 border border-white/10 rounded-2xl px-4 py-2 text-white focus:border-cyan-300 focus:outline-none"
                    />
                    <span className="text-slate-400 text-sm">k€</span>
                  </div>
                </div>

                {/* Dettes fournisseurs */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-slate-300">
                      Dettes fournisseurs
                    </label>
                    <div className="group relative">
                      <button className="text-xs text-slate-400 hover:text-slate-200 w-5 h-5 rounded-full border border-slate-500 flex items-center justify-center">
                        ⓘ
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                        Factures à payer prochainement
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={dettes}
                      onChange={(e) =>
                        setDettes(Math.max(0, Number(e.target.value) || 0))
                      }
                      className="flex-1 bg-black/20 border border-white/10 rounded-2xl px-4 py-2 text-white focus:border-cyan-300 focus:outline-none"
                    />
                    <span className="text-slate-400 text-sm">k€</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Difficulty presets */}
            <div className="space-y-2 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm font-semibold text-slate-300 mb-3">
                Présets de difficulté :
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => applyDifficultyPreset(DIFFICULTY_PRESETS.easy)}
                  className="px-4 py-2 rounded-full bg-white/10 text-slate-200 hover:bg-white/20 text-sm font-semibold transition-all"
                >
                  💪 Facile
                </button>
                <button
                  onClick={() => applyDifficultyPreset(DIFFICULTY_PRESETS.normal)}
                  className="px-4 py-2 rounded-full bg-white/10 text-slate-200 hover:bg-white/20 text-sm font-semibold transition-all"
                >
                  ⚖️ Normal
                </button>
                <button
                  onClick={() => applyDifficultyPreset(DIFFICULTY_PRESETS.hard)}
                  className="px-4 py-2 rounded-full bg-white/10 text-slate-200 hover:bg-white/20 text-sm font-semibold transition-all"
                >
                  🔥 Difficile
                </button>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between gap-4 pt-4">
              <button
                onClick={handlePrevStep}
                className="border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 rounded-full px-8 py-3 font-semibold transition-all inline-flex items-center gap-2"
              >
                ← Précédent
              </button>
              <button
                onClick={handleNextStep}
                disabled={!isBalanced}
                className={`rounded-full px-8 py-3 font-semibold transition-all inline-flex items-center gap-2 ${
                  isBalanced
                    ? "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                    : "bg-slate-700 text-slate-500 cursor-not-allowed"
                }`}
              >
                Suivant →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Identité + récapitulatif */}
        {step === 4 && selectedTemplate && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Identité</h2>

            <div className="space-y-4">
              {/* Nom */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">
                  Nom de votre entreprise
                </label>
                <input
                  type="text"
                  value={nomEntreprise}
                  onChange={(e) =>
                    setNomEntreprise(e.target.value.slice(0, 30))
                  }
                  placeholder="Ma Super Entreprise"
                  className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-white focus:border-cyan-300 focus:outline-none"
                />
              </div>

              {/* Icon */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">
                  Emoji / icône
                </label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value.slice(0, 2))}
                  className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-white focus:border-cyan-300 focus:outline-none text-2xl text-center"
                />
                <div className="flex flex-wrap gap-2">
                  {EMOJI_SUGGESTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setIcon(emoji)}
                      className="text-2xl hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Couleur */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">
                  Couleur de l'entreprise
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_SWATCHES.map((col) => (
                    <button
                      key={col}
                      onClick={() => setCouleur(col)}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        couleur === col
                          ? "border-white scale-110"
                          : "border-white/20 hover:border-white/50"
                      }`}
                      style={{ backgroundColor: col }}
                    ></button>
                  ))}
                </div>
              </div>

              {/* Spécialité */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">
                  Spécialité (description courte)
                </label>
                <input
                  type="text"
                  value={specialite}
                  onChange={(e) => setSpecialite(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-white focus:border-cyan-300 focus:outline-none"
                />
              </div>
            </div>

            {/* Recap card */}
            <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="text-5xl w-16 h-16 flex items-center justify-center rounded-lg"
                  style={{ backgroundColor: couleur || selectedTemplate.couleur }}
                >
                  {icon || selectedTemplate.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {nomEntreprise || "Ma Super Entreprise"}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {specialite || selectedTemplate.specialite}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <p className="text-xs font-semibold text-cyan-400 mb-2">
                    ACTIF TOTAL
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {totalActif.toFixed(0)}k€
                  </p>
                  <div className="text-xs text-slate-400 mt-2 space-y-1">
                    <p>
                      Immo: {(immo1Valeur + immo2Valeur + autresImmo).toFixed(0)}k€
                    </p>
                    <p>Stocks: {stocks.toFixed(0)}k€</p>
                    <p>Tréso: {tresorerie.toFixed(0)}k€</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-amber-400 mb-2">
                    PASSIF TOTAL
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {totalPassif.toFixed(0)}k€
                  </p>
                  <div className="text-xs text-slate-400 mt-2 space-y-1">
                    <p>Capitaux: {capitauxPropres.toFixed(0)}k€</p>
                    <p>Emprunts: {emprunts.toFixed(0)}k€</p>
                    <p>Dettes: {dettes.toFixed(0)}k€</p>
                  </div>
                </div>
              </div>

              <div className="text-center pt-4 text-green-400 font-semibold">
                ✓ Équilibré
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between gap-4 pt-4">
              <button
                onClick={handlePrevStep}
                className="border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 rounded-full px-8 py-3 font-semibold transition-all inline-flex items-center gap-2"
              >
                ← Précédent
              </button>
              <button
                onClick={handleComplete}
                disabled={!nomEntreprise.trim()}
                className={`rounded-full px-8 py-3 font-semibold transition-all inline-flex items-center gap-2 ${
                  nomEntreprise.trim()
                    ? "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                    : "bg-slate-700 text-slate-500 cursor-not-allowed"
                }`}
              >
                🚀 Créer mon entreprise
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
