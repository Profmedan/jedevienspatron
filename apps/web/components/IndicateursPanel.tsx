"use client";
import { useState, useRef, useEffect } from "react";
import { Joueur, DECOUVERT_MAX, calculerIndicateurs, calculerSIG } from "@jedevienspatron/game-engine";

interface Props { joueur: Joueur; }

// ─── COMPOSANT : Ligne de la cascade SIG ──────────────────────────────────────

function SIGRow({
  label, value, isSubtotal, isTotal, sign, note,
}: {
  label: string;
  value: number;
  isSubtotal?: boolean;
  isTotal?: boolean;
  sign?: "+" | "−" | "=";
  note?: string;
}) {
  const [showNote, setShowNote] = useState(false);
  const positive = value >= 0;
  const baseClass = isTotal
    ? "bg-indigo-900/70 border border-indigo-600/40 rounded-xl text-white"
    : isSubtotal
    ? "bg-slate-800/60 border-l-4 border-cyan-500 rounded-r-lg"
    : "pl-4";

  return (
    <div>
      <div className={`flex items-center justify-between py-1.5 px-3 ${baseClass} ${note ? "cursor-pointer select-none" : ""}`}
        onClick={() => note && setShowNote(s => !s)}>
        <div className="flex items-center gap-2 flex-1">
          {sign && (
            <span className={`text-xs font-black w-4 text-center ${
              sign === "=" ? "text-cyan-400" :
              sign === "−" ? "text-red-400" : "text-emerald-400"
            } ${isTotal ? "opacity-70" : ""}`}>{sign}</span>
          )}
          <span className={`text-xs ${isTotal ? "font-bold text-white" : isSubtotal ? "font-semibold text-cyan-300" : "text-gray-300"}`}>
            {label}
          </span>
          {note && (
            <span className={`text-xs transition-transform ${showNote ? "rotate-0" : ""} ${isTotal ? "opacity-60 text-cyan-300" : "text-cyan-400"}`}>
              {showNote ? "▲" : "ⓘ"}
            </span>
          )}
        </div>
        <div className={`font-bold text-sm tabular-nums ${
          isTotal
            ? (positive ? "text-emerald-400" : "text-red-400")
            : isSubtotal
            ? (positive ? "text-cyan-300" : "text-red-400")
            : (positive ? "text-gray-300" : "text-red-400")
        }`}>
          {value >= 0 ? "+" : ""}{value}
        </div>
      </div>
      {showNote && note && (
        <div className="mx-2 mb-1 bg-blue-950/30 border border-blue-800/40 rounded-lg px-3 py-2 text-xs text-blue-200 leading-relaxed">
          {note}
        </div>
      )}
    </div>
  );
}

// ─── COMPOSANT : Indicateur simple avec jauge ────────────────────────────────

interface GaugeZone { from: number; to: number; color: string; label: string; }
interface GaugeConfig { min: number; max: number; zones: GaugeZone[]; unit?: string; }

function Gauge({ value, config }: { value: number; config: GaugeConfig }) {
  const { min, max, zones, unit = "" } = config;
  const clamped = Math.max(min, Math.min(max, value));
  const pct = ((clamped - min) / (max - min)) * 100;
  const outOfRange = value < min || value > max;

  return (
    <div className="mt-2 select-none">
      <div className="relative mb-3">
        <div className="flex h-4 rounded-lg overflow-hidden border border-gray-700">
          {zones.map((z, i) => {
            const w = ((Math.min(z.to, max) - Math.max(z.from, min)) / (max - min)) * 100;
            return <div key={i} style={{ width: `${w}%`, backgroundColor: z.color, opacity: 0.7 }} />;
          })}
        </div>
        <div className="absolute top-0 h-4 w-0.5 bg-gray-300 rounded" style={{ left: `calc(${pct}% - 1px)` }} />
        <div className="absolute w-0 h-0" style={{ left: `calc(${pct}% - 5px)`, bottom: "-7px",
          borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "7px solid #d1d5db" }} />
      </div>
      <div className="text-center text-xs font-bold text-gray-200 mb-1">
        {value > 0 && "+"}{typeof value === "number" ? value.toFixed(value % 1 === 0 ? 0 : 1) : value}{unit}
        {outOfRange && <span className="text-gray-500 font-normal"> (hors échelle)</span>}
      </div>
      <div className="flex justify-between text-xs text-gray-500 px-0.5">
        <span>{min}{unit}</span><span>+{max}{unit}</span>
      </div>
      <div className="flex gap-1 flex-wrap mt-1">
        {zones.map((z, i) => (
          <span key={i} className="text-xs px-1.5 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: z.color + "33", color: z.color, border: `1px solid ${z.color}66` }}>
            {z.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── FONCTION HELPER : Analyse personnalisée par indicateur ──────────────────

function getAnalysePersonnalisee(label: string, value: number): string {
  switch (label) {
    case "Taux de marge nette":
      if (value < -10) return "Ta marge nette est très dégradée. Tes charges fixes (loyer, salaires, amortissements) sont trop lourdes par rapport à ton CA. Priorise l’augmentation du CA via recrutement plutôt que de nouveaux investissements coûteux.";
      if (value < 0) return "Tu es en légère perte. Un ou deux clients supplémentaires suffiraient à passer en positif. Recrute un commercial Junior ce trimestre.";
      if (value < 10) return "Marge légèrement positive. Bien — mais surveille tes amortissements qui grignotent le résultat. N’augmente pas tes charges fixes avant que ta marge soit > 15%.";
      return "Excellente marge. Tu peux te permettre d’investir dans un actif ou de recruter un profil plus senior.";

    case "Taux de marge EBE":
      if (value < 0) return "Ton exploitation ne génère pas assez pour couvrir ses charges de fonctionnement. Réduis les services extérieurs si possible.";
      if (value < 15) return "EBE faible. Attention : si tu ajoutes des amortissements, ton résultat d’exploitation sera négatif.";
      return "Bon EBE. Ton activité génère suffisamment pour financer ses amortissements et ses charges financières.";

    case "Rentabilité économique":
      if (value < 0) return "Tes actifs (machines, stocks, créances) ne génèrent pas de valeur. Vends les actifs non productifs ou augmente tes ventes.";
      if (value < 5) return "Rentabilité faible. Tes actifs travaillent peu. Cherche à optimiser ton stock : n’achète que ce que tu peux vendre dans le trimestre.";
      return "Bonne rentabilité économique. Continue sur cette lancée et envisage d’investir dans des actifs supplémentaires.";

    case "Ratio de solvabilité":
      if (value < 20) return "Situation risquée : ton endettement est trop élevé. Évite tout nouvel emprunt et cherche à générer des bénéfices pour reconstruire tes capitaux propres.";
      if (value < 33) return "Solvabilité acceptable mais fragile. Un mauvais trimestre peut dégrader ce ratio. Ne prends pas de nouveaux emprunts.";
      return "Solide. Tu peux potentiellement accéder à un emprunt avantageux pour financer une croissance.";

    case "Fonds de Roulement (FR)":
      if (value < 0) return "Danger : tes ressources à long terme ne couvrent pas tes actifs durables. Ta structure financière est déséquilibrée — rembourse tes dettes ou augmente tes capitaux.";
      if (value < 3) return "FR positif mais faible. Un achat d’immobilisation pourrait le faire passer en négatif. Prudence.";
      return "FR confortable. Tu as une marge de manœuvre pour financer ton cycle d’exploitation.";

    case "Besoin en Fonds de Roulement (BFR)":
      // Note: Pour BFR, on compare avec FR. On retourne ici le contexte général.
      if (value < 0) return "BFR négatif = ressources d’exploitation disponibles. Excellente maîtrise de ton cycle.";
      if (value <= 3) return "BFR couvert correctement. Situation normale, continue à surveiller ton cycle d’exploitation.";
      return "Ton BFR est élevé. Cherche à le réduire : accélère le recouvrement clients, négocie des délais fournisseurs plus longs, optimise les stocks.";

    case "Trésorerie Nette":
      if (value < 0) return "ALERTE : découvert bancaire. Risque de faillite si < -5. Stoppe tous les achats non-essentiels immédiatement.";
      if (value < 3) return "Réserve minimale. Un imprévu (événement aléatoire négatif) peut te mettre en découvert. Reconstituez un matelas.";
      return "Trésorerie saine. Tu peux absorber les imprévus et envisager des investissements.";

    case "ROE — Rentabilité financière":
      if (value < 0) return "ROE négatif : tes actionnaires perdent de l’argent. Améliore d’urgence le résultat net.";
      if (value < 10) return "ROE faible. Les capitaux investis ne génèrent pas assez de rendement. Accélère la croissance ou réduis les capitaux inactifs.";
      return "Bon ROE. Tes actionnaires sont satisfaits du rendement. Peux envisager une nouvelle levée de fonds si besoin.";

    case "Capacité d’autofinancement (CAF)":
      if (value < 0) return "CAF négative : tu ne dégages pas de trésorerie. Impossible de rembourser des dettes ou investir sans aide. Priorité absolue : redevenir positif.";
      if (value < 3) return "CAF très faible. À peine suffisant pour l’exploitation. Évite les investissements lourds ce trimestre.";
      return "CAF solide. Tu peux t’autofinancer et rembourser progressivement tes dettes.";

    case "Ratio de liquidité":
      if (value < 0.5) return "Situation CRITIQUE : tu ne peux pas payer tes dettes court terme. Action immédiate : augmente l’actif circulant ou réduis les dettes court terme.";
      if (value < 1) return "Liquidité insuffisante. Risque de ne pas pouvoir payer tes fournisseurs. Accélère les encaissements et repousse les paiements si possible.";
      if (value < 1.5) return "Liquidité correcte. À maintenir. Un imprévu pourrait créer des tensions — garde une réserve de trésorerie.";
      return "Liquidité excellente. Tu as une belle marge de manœuvre court terme.";

    case "Délai de paiement clients (jours)":
      if (value > 60) return "Délai TRÈS long ! Tes clients te font crédit trop longuement. Impact grave sur la trésorerie. Réduis les délais : demande des acomptes, favorise les paiements comptant.";
      if (value > 45) return "Délai élevé. À surveiller. Cherche à ramener les clients à C+1 ou comptant pour soulager la trésorerie.";
      if (value > 30) return "Délai correct. Peut encore être optimisé — relance les clients lents et négocie des conditions plus courtes.";
      return "Excellent délai clients. Continue ainsi pour conserver ta trésorerie saine.";

    default:
      return "";
  }
}

function Indicateur({ label, value, unit, positive, formule, definition, interpretation, objectif, gaugeConfig }: {
  label: string; value: number; unit?: string; positive?: boolean;
  formule?: string; definition?: string; interpretation?: string; objectif?: string;
  gaugeConfig?: GaugeConfig;
}) {
  const [open, setOpen]             = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const triggerRef                  = useRef<HTMLDivElement>(null);
  const tooltipRef                  = useRef<HTMLDivElement>(null);
  const analyseTexte                = getAnalysePersonnalisee(label, value);

  // Ferme le tooltip si l'utilisateur scrolle la PAGE (pas le contenu du tooltip lui-même)
  useEffect(() => {
    if (!open) return;
    const handleScroll = (e: Event) => {
      if (tooltipRef.current?.contains(e.target as Node)) return; // scroll interne → on garde
      setOpen(false);
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [open]);

  function handleToggle() {
    if (!open && triggerRef.current) {
      const rect        = triggerRef.current.getBoundingClientRect();
      const tooltipW    = 288; // w-72
      const marginRight = 8;
      const left        = Math.min(rect.left, window.innerWidth - tooltipW - marginRight);
      setTooltipPos({ top: rect.bottom + 4, left: Math.max(8, left) });
    }
    setOpen(s => !s);
  }

  return (
    <div className="relative">
      <div ref={triggerRef}
        className={`bg-gray-800 rounded-xl p-3 border border-gray-600 cursor-pointer hover:border-cyan-400/40 hover:bg-gray-700/80 transition-all ${open ? "ring-2 ring-cyan-500/50" : ""}`}
        onClick={handleToggle}>
        <div className="flex items-start justify-between gap-1">
          <div className="text-xs text-gray-400 leading-tight flex-1">{label}</div>
          <span className="text-xs text-cyan-400">ⓘ</span>
        </div>
        <div className={`text-lg font-bold tabular-nums mt-1 ${
          positive === undefined ? "text-gray-200" : positive ? "text-emerald-400" : "text-red-400"
        }`}>
          {value >= 0 ? "+" : ""}{typeof value === "number" ? value.toFixed(value % 1 === 0 ? 0 : 1) : value}{unit ?? ""}
        </div>
      </div>
      {open && (
        <div
          ref={tooltipRef}
          className="w-72 bg-gray-900/98 border border-gray-700 rounded-xl shadow-2xl p-4 text-xs space-y-2 max-h-[70vh] overflow-y-auto"
          style={{ position: "fixed", top: tooltipPos.top, left: tooltipPos.left, zIndex: 9999, minWidth: "280px" }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="font-bold text-cyan-300 text-sm">{label}</div>
            <button onClick={e => { e.stopPropagation(); setOpen(false); }}
              className="text-gray-500 hover:text-gray-300 text-lg leading-none shrink-0">×</button>
          </div>
          {formule && (
            <div className="bg-blue-950/40 border border-blue-800/40 rounded-lg p-2 font-mono text-blue-200 text-xs">= {formule}</div>
          )}
          {gaugeConfig && (
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
              <div className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">📍 Position actuelle</div>
              <Gauge value={value} config={gaugeConfig} />
            </div>
          )}
          {definition && <div><div className="font-semibold text-gray-300 mb-0.5">📖 Définition</div><p className="text-gray-300 leading-relaxed break-words">{definition}</p></div>}
          {interpretation && <div><div className="font-semibold text-gray-300 mb-0.5">🔍 Interprétation</div><p className="text-gray-300 leading-relaxed break-words">{interpretation}</p></div>}
          {analyseTexte && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <p className="text-xs font-bold text-cyan-300 mb-1">🎯 Pour toi ce trimestre</p>
              <p className="text-xs text-gray-300 leading-relaxed break-words">{analyseTexte}</p>
            </div>
          )}
          {objectif && (
            <div className={`rounded-lg p-2 border ${positive === undefined ? "bg-gray-800/40 border-gray-700" : positive ? "bg-emerald-950/30 border-emerald-700/40" : "bg-red-950/30 border-red-700/40"}`}>
              <div className={`font-semibold mb-0.5 ${positive === undefined ? "text-gray-300" : positive ? "text-emerald-300" : "text-red-300"}`}>🎯 Objectif</div>
              <p className="text-gray-300 leading-relaxed break-words">{objectif}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

type Tab = "sig" | "rentabilite" | "structure" | "ratios";

export default function IndicateursPanel({ joueur }: Props) {
  const [tab, setTab] = useState<Tab>("sig");
  const ind = calculerIndicateurs(joueur);
  const sig = calculerSIG(joueur);

  const tabs: Array<[Tab, string]> = [
    ["sig",         "📊 Résultat"],
    ["rentabilite", "💹 Rentabilité"],
    ["structure",   "🏗️ Structure"],
    ["ratios",      "⏱️ Ratios"],
  ];

  return (
    <div className="bg-gray-900 rounded-2xl shadow-sm border border-gray-700 flex flex-col max-h-full">
      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        <h3 className="font-bold text-center text-gray-100 mb-1 tracking-wide">📊 INDICATEURS FINANCIERS</h3>
        <p className="text-center text-xs text-gray-500 mb-3">Clique sur un indicateur pour son explication détaillée ⓘ</p>
        {/* Onglets */}
        <div className="grid grid-cols-4 gap-1 border-b border-gray-700 pb-0">
          {tabs.map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-xs font-bold px-2 py-2 rounded-t-lg text-center transition-all border-b-2 truncate ${
                tab === t
                  ? "bg-gray-800 text-cyan-300 border-cyan-500 shadow-sm"
                  : "text-gray-500 border-transparent hover:bg-gray-800/50 hover:text-gray-400"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-4 flex-1 overflow-y-auto">
        {/* ── ONGLET SIG ─────────────────────────────────────────────── */}
        {tab === "sig" && (
          <div className="space-y-0.5">
            <div className="mb-2">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Comment se forme votre résultat ?</div>
              <div className="text-[10px] text-gray-600 mt-0.5">Soldes Intermédiaires de Gestion (SIG) — cliquez sur chaque ligne ⓘ</div>
            </div>

            <SIGRow label="Chiffre d’affaires" value={sig.chiffreAffaires} sign="=" isSubtotal
              note="Total des ventes réalisées ce trimestre (hors revenus exceptionnels)." />
            {sig.achats > 0 && <SIGRow label="− Coût d’achat des marchandises" value={-sig.achats} sign="−"
              note="Coût des stocks consommés pour réaliser les ventes (CMV)." />}
            {sig.servicesExterieurs > 0 && <SIGRow label="− Services extérieurs (loyer, charges fixes…)" value={-sig.servicesExterieurs} sign="−"
              note="Consommations externes : loyer, électricité, frais généraux." />}

            <SIGRow label="= VALEUR AJOUTÉE" value={sig.valeurAjoutee} isTotal
              note="Richesse créée par l’entreprise = CA − Achats − Services ext." />

            {sig.chargesPersonnel > 0 && <SIGRow label="− Charges de personnel (salaires)" value={-sig.chargesPersonnel} sign="−"
              note="Rémunérations des commerciaux et employés." />}
            {sig.impotsTaxes > 0 && <SIGRow label="− Impôts & taxes" value={-sig.impotsTaxes} sign="−" />}

            <SIGRow label="= EXCÉDENT BRUT D’EXPLOITATION (EBE)" value={sig.ebe} isTotal
              note="Performance économique pure, avant financement et amortissements. Indicateur clé de la profitabilité opérationnelle." />

            {sig.dotations > 0 && <SIGRow label="− Dotations aux amortissements" value={-sig.dotations} sign="−"
              note="Usure progressive des immobilisations. Charge sans sortie de trésorerie." />}

            <SIGRow label="= RÉSULTAT D’EXPLOITATION" value={sig.resultatExploitation} isTotal
              note="Résultat lié uniquement à l’activité, indépendamment du financement et des éléments exceptionnels." />

            {(sig.produitsFinanciers > 0 || sig.chargesInteret > 0) && (
              <>
                {sig.produitsFinanciers > 0 && <SIGRow label="+ Produits financiers" value={sig.produitsFinanciers} sign="+" />}
                {sig.chargesInteret > 0 && <SIGRow label="− Charges d’intérêt & agios bancaires" value={-sig.chargesInteret} sign="−"
                  note="Intérêts sur emprunts et agios de découvert. Coût du financement externe." />}
              </>
            )}

            <SIGRow label="= RÉSULTAT COURANT AVANT IMPÔT (RCAI)" value={sig.rcai} isTotal
              note="Résultat d’exploitation ± résultat financier. Mesure la performance globale hors éléments exceptionnels." />

            {(sig.revenusExceptionnels > 0 || sig.chargesExceptionnelles > 0) && (
              <>
                {sig.revenusExceptionnels > 0 && <SIGRow label="+ Revenus exceptionnels" value={sig.revenusExceptionnels} sign="+"
                  note="Prix PME, événements favorables…" />}
                {sig.chargesExceptionnelles > 0 && <SIGRow label="− Charges exceptionnelles" value={-sig.chargesExceptionnelles} sign="−"
                  note="Litiges, ruptures fournisseur, événements défavorables…" />}
              </>
            )}

            <div className="pt-1">
              <SIGRow label="= RÉSULTAT NET" value={sig.resultatNet} isTotal
                note="Résultat final de l’entreprise. Positif → bénéfice → s’ajoute aux capitaux à la clôture. Négatif → perte → érode les capitaux propres." />
            </div>

            {/* Rappel pédagogique */}
            <div className="mt-3 bg-blue-950/30 border border-blue-800/40 rounded-xl p-3 text-xs text-blue-200 leading-relaxed">
              <strong>📚 À retenir — la cascade du résultat :</strong>
              <div className="mt-1.5 space-y-0.5 font-mono text-[10px]">
                <div>Valeur Ajoutée (VA)</div>
                <div className="opacity-60 pl-2">↓ − charges de personnel, impôts</div>
                <div>Excédent Brut d&apos;Exploitation (EBE)</div>
                <div className="opacity-60 pl-2">↓ − amortissements des équipements</div>
                <div>Résultat d&apos;exploitation</div>
                <div className="opacity-60 pl-2">↓ ± intérêts d&apos;emprunt</div>
                <div>Résultat Courant Avant Impôt (RCAI)</div>
                <div className="opacity-60 pl-2">↓ ± exceptionnel</div>
                <div className="font-bold">Résultat net</div>
              </div>
              <div className="mt-2 opacity-80">L&apos;EBE est l&apos;indicateur préféré des banques : il mesure la capacité à générer du cash <em>avant</em> financement et amortissements.</div>
            </div>
          </div>
        )}

        {/* ── ONGLET RENTABILITÉ ──────────────────────────────────────── */}
        {tab === "rentabilite" && (
          <div className="space-y-3">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">
              Indicateurs de rentabilité
            </div>
            <div className="grid grid-cols-2 gap-2 min-w-0">
              <Indicateur
                label="Taux de marge nette"
                value={parseFloat(sig.tauxMargeNette.toFixed(1))}
                unit="%"
                positive={sig.tauxMargeNette >= 5}
                formule="Résultat net ÷ CA × 100"
                definition="Part du chiffre d’affaires qui devient du bénéfice net. Mesure l’efficacité globale de l’entreprise à transformer ses ventes en profit."
                interpretation="≥ 10% : excellent. 5–10% : correct. 0–5% : faible. < 0% : perte."
                objectif="Viser ≥ 5% de marge nette. En-dessous de 0% : urgence."
                gaugeConfig={{ min: -20, max: 40, unit: "%", zones: [
                  { from: -20, to: 0, color: "#ef4444", label: "Déficitaire" },
                  { from: 0, to: 5, color: "#f59e0b", label: "Faible" },
                  { from: 5, to: 15, color: "#22c55e", label: "Correct" },
                  { from: 15, to: 40, color: "#059669", label: "Excellent" },
                ]}}
              />
              <Indicateur
                label="Taux de marge EBE"
                value={parseFloat(sig.tauxMargeEBE.toFixed(1))}
                unit="%"
                positive={sig.tauxMargeEBE >= 10}
                formule="EBE ÷ CA × 100"
                definition="Part du CA transformée en EBE. Mesure la performance opérationnelle pure, avant financement et amortissements. Indicateur privilégié par les banques."
                interpretation="≥ 15% : très sain. 10–15% : correct. 5–10% : à surveiller. < 5% : fragile."
                objectif="EBE/CA ≥ 10% dans la plupart des secteurs."
                gaugeConfig={{ min: -20, max: 50, unit: "%", zones: [
                  { from: -20, to: 0, color: "#ef4444", label: "Négatif" },
                  { from: 0, to: 10, color: "#f59e0b", label: "Faible" },
                  { from: 10, to: 50, color: "#22c55e", label: "Sain" },
                ]}}
              />
              <Indicateur
                label="ROE — Rentabilité financière"
                value={parseFloat(sig.roe.toFixed(1))}
                unit="%"
                positive={sig.roe >= 10}
                formule="Résultat net ÷ Capitaux propres × 100"
                definition="Rendement généré pour les actionnaires. Mesure l’efficacité avec laquelle l’entreprise utilise les fonds investis par ses propriétaires."
                interpretation="≥ 15% : excellent. 10–15% : bon. 5–10% : acceptable. < 5% : décevant pour les investisseurs."
                objectif="ROE ≥ 10% — au-dessous, l’investisseur pourrait préférer placer son argent ailleurs."
                gaugeConfig={{ min: -20, max: 40, unit: "%", zones: [
                  { from: -20, to: 0, color: "#ef4444", label: "Perte" },
                  { from: 0, to: 10, color: "#f59e0b", label: "Faible" },
                  { from: 10, to: 40, color: "#22c55e", label: "Bon" },
                ]}}
              />
              <Indicateur
                label="Rentabilité économique"
                value={parseFloat(sig.rentabiliteEconomique.toFixed(1))}
                unit="%"
                positive={sig.rentabiliteEconomique >= 5}
                formule="Résultat exploitation ÷ Total Actif × 100"
                definition="Efficacité avec laquelle l’entreprise utilise ses actifs pour générer un résultat d’exploitation. Indépendant du mode de financement."
                interpretation="≥ 10% : excellent. 5–10% : correct. < 5% : l’actif est mal utilisé."
                objectif="Rentabilité économique ≥ taux d’emprunt → l’entreprise crée de la valeur via l’effet de levier."
                gaugeConfig={{ min: -20, max: 30, unit: "%", zones: [
                  { from: -20, to: 0, color: "#ef4444", label: "Négatif" },
                  { from: 0, to: 5, color: "#f59e0b", label: "Faible" },
                  { from: 5, to: 30, color: "#22c55e", label: "Sain" },
                ]}}
              />
            </div>
            {/* CAF */}
            <Indicateur
              label="Capacité d’autofinancement (CAF)"
              value={ind.capaciteAutofinancement}
              positive={ind.capaciteAutofinancement >= 0}
              formule="Résultat net + Dotations aux amortissements"
              definition="La CAF mesure la capacité de l’entreprise à générer de la trésorerie par son activité. Les dotations sont réintégrées car ce sont des charges sans sortie de trésorerie."
              interpretation="Positive → l’entreprise peut s’autofinancer. Négative → elle ne peut pas rembourser ses dettes ni investir sans aide extérieure."
              objectif="CAF > 0, idéalement ≥ annuité d’emprunt."
              gaugeConfig={{ min: -10, max: 20, zones: [
                { from: -10, to: 0, color: "#ef4444", label: "Négative" },
                { from: 0, to: 3, color: "#f59e0b", label: "Faible" },
                { from: 3, to: 20, color: "#22c55e", label: "Bonne" },
              ]}}
            />
          </div>
        )}

        {/* ── ONGLET STRUCTURE ────────────────────────────────────────── */}
        {tab === "structure" && (
          <div className="space-y-3">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">
              Structure financière & Liquidité
            </div>
            <div className="grid grid-cols-2 gap-2 min-w-0">
              <Indicateur
                label="Fonds de Roulement (FR)"
                value={ind.fondsDeRoulement}
                positive={ind.fondsDeRoulement >= 0}
                formule="(Capitaux propres + Résultat + Emprunts) − Immobilisations"
                definition="Excédent des ressources stables (long terme) sur les emplois durables. Représente le 'matelas financier' disponible pour financer le cycle d’exploitation."
                interpretation="FR ≥ 0 : sain, les actifs longs sont entièrement financés par des ressources longues. FR < 0 : les immobilisations sont en partie financées par des dettes courtes — risque !"
                objectif="FR ≥ 0 est la norme. Plus le FR est élevé, plus l’entreprise est solide."
                gaugeConfig={{ min: -10, max: 20, zones: [
                  { from: -10, to: 0, color: "#ef4444", label: "Dangereux" },
                  { from: 0, to: 5, color: "#f59e0b", label: "Acceptable" },
                  { from: 5, to: 20, color: "#22c55e", label: "Confortable" },
                ]}}
              />
              <Indicateur
                label="Besoin en Fonds de Roulement (BFR)"
                value={ind.besoinFondsRoulement}
                positive={ind.besoinFondsRoulement <= 0}
                formule="Stocks + Créances clients − Dettes fournisseurs"
                definition="Besoin de financement lié au cycle d’exploitation. Représente l’argent 'gelé' entre le paiement des fournisseurs et l’encaissement des clients."
                interpretation="BFR > 0 : tu dois financer le décalage. BFR < 0 : tes fournisseurs te font plus crédit que tes clients — situation très favorable !"
                objectif="Minimiser le BFR : réduire les créances clients, négocier des délais fournisseurs, limiter les stocks."
                gaugeConfig={{ min: -5, max: 15, zones: [
                  { from: -5, to: 0, color: "#22c55e", label: "Favorable" },
                  { from: 0, to: 5, color: "#f59e0b", label: "Gérable" },
                  { from: 5, to: 15, color: "#ef4444", label: "Fort besoin" },
                ]}}
              />
              <Indicateur
                label="Trésorerie Nette"
                value={ind.tresorerieNette}
                positive={ind.tresorerieNette >= 0}
                formule="Fonds de Roulement − BFR  (ou Trésorerie − Découvert)"
                definition="Conséquence de l’équilibre entre FR et BFR. Mesure les liquidités réellement disponibles après avoir financé l’exploitation."
                interpretation="Positive → l’entreprise peut payer ses échéances. Négative → elle dépend du découvert bancaire."
                objectif={`Trésorerie nette ≥ 0. Découvert > ${DECOUVERT_MAX} → faillite dans le jeu !`}
                gaugeConfig={{ min: -8, max: 15, zones: [
                  { from: -8, to: -5, color: "#7f1d1d", label: "⚠️ Faillite" },
                  { from: -5, to: 0, color: "#ef4444", label: "Découvert" },
                  { from: 0, to: 3, color: "#f59e0b", label: "Limite" },
                  { from: 3, to: 15, color: "#22c55e", label: "Saine" },
                ]}}
              />
              <Indicateur
                label="Ratio de liquidité"
                value={parseFloat(ind.ratioLiquidite.toFixed(2))}
                positive={ind.ratioLiquidite >= 1}
                formule="Actif circulant ÷ Dettes court terme"
                definition="Capacité à rembourser les dettes à court terme avec l’actif circulant (stocks + créances + trésorerie). Mesure la solvabilité immédiate."
                interpretation="≥ 2 : très liquide. ≥ 1 : suffisant. < 1 : risque de ne pas pouvoir payer. < 0.5 : situation critique."
                objectif="Ratio ≥ 1 pour garantir la solvabilité courante."
                gaugeConfig={{ min: 0, max: 3, zones: [
                  { from: 0, to: 0.5, color: "#7f1d1d", label: "Critique" },
                  { from: 0.5, to: 1, color: "#ef4444", label: "Insuffisant" },
                  { from: 1, to: 1.5, color: "#f59e0b", label: "Correct" },
                  { from: 1.5, to: 3, color: "#22c55e", label: "Bon" },
                ]}}
              />
            </div>

            {/* Solvabilité — explication enrichie */}
            <Indicateur
              label="Ratio de solvabilité"
              value={parseFloat(ind.ratioSolvabilite.toFixed(1))}
              unit="%"
              positive={ind.ratioSolvabilite >= 30}
              formule="(Capitaux propres + Résultat) ÷ Total Passif × 100"
              definition={
                "La solvabilité mesure la part du financement couverte par les fonds propres. " +
                "Une entreprise solvable peut rembourser toutes ses dettes même en cas de liquidation. " +
                "Contrairement à la liquidité (court terme), la solvabilité évalue la solidité LONG TERME."
              }
              interpretation={
                "≥ 40% : très solide, les créanciers ont confiance. " +
                "30–40% : sain, norme française. " +
                "20–30% : acceptable mais fragile. " +
                "< 20% : l’entreprise est trop dépendante de ses créanciers — risque de faillite si les résultats se dégradent."
              }
              objectif={
                "Solvabilité ≥ 30% est la norme en France. Pour améliorer : " +
                "augmenter les capitaux (résultats positifs), rembourser les emprunts, éviter les pertes."
              }
              gaugeConfig={{ min: 0, max: 80, unit: "%", zones: [
                { from: 0, to: 20, color: "#ef4444", label: "Fragile" },
                { from: 20, to: 30, color: "#f59e0b", label: "Acceptable" },
                { from: 30, to: 80, color: "#22c55e", label: "Solide" },
              ]}}
            />

            {/* Totaux Actif/Passif + équilibre */}
            <div className="grid grid-cols-2 gap-2 min-w-0">
              <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-3">
                <div className="text-xs text-blue-300 mb-1 font-semibold">Total Actif</div>
                <div className="text-xl font-bold text-blue-200">{ind.totalActif}</div>
              </div>
              <div className="bg-amber-950/30 border border-amber-700/40 rounded-xl p-3">
                <div className="text-xs text-amber-300 mb-1 font-semibold">Total Passif</div>
                <div className="text-xl font-bold text-amber-200">{ind.totalPassif}</div>
              </div>
            </div>
            <div className={`text-center text-xs font-bold py-1.5 rounded-lg ${
              ind.equilibre ? "bg-emerald-950/30 text-emerald-300 border border-emerald-700/40" : "bg-amber-950/30 text-amber-300 border border-amber-700/40"
            }`}>
              {ind.equilibre ? "✅ Bilan équilibré (Actif = Passif)" : "⚠️ Bilan déséquilibré — vérifiez vos écritures"}
            </div>
          </div>
        )}

        {/* ── ONGLET RATIOS DE GESTION ───────────────────────────────── */}
        {tab === "ratios" && (
          <div className="space-y-3">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">
              Ratios de gestion
            </div>
            <Indicateur
              label="Délai de paiement clients (jours)"
              value={parseFloat(sig.delaiClients.toFixed(0))}
              unit=" j"
              positive={sig.delaiClients <= 45}
              formule="Créances clients × 360 ÷ CA annualisé"
              definition="Nombre de jours moyen que mettent tes clients à payer. Plus ce délai est court, meilleure est ta trésorerie."
              interpretation="≤ 30 j : excellent. 30–45 j : correct. 45–60 j : à surveiller. > 60 j : problème de recouvrement."
              objectif="Délai clients ≤ 45 jours. Favorise les clients au comptant ou avec délai C+1."
              gaugeConfig={{ min: 0, max: 120, unit: " j", zones: [
                { from: 0, to: 30, color: "#22c55e", label: "Excellent" },
                { from: 30, to: 60, color: "#f59e0b", label: "Correct" },
                { from: 60, to: 120, color: "#ef4444", label: "Long" },
              ]}}
            />

            <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-3 text-xs text-blue-200 leading-relaxed">
              <strong>📌 Note pédagogique :</strong> Dans ce jeu simplifié, il n’y a pas d’achats à crédit ni de
              stocks tournants. Le délai fournisseur et la rotation des stocks ne sont donc pas calculables.
              Dans une vraie entreprise : Délai fournisseurs = Dettes × 360 / Achats.
              Rotation stocks = Stocks × 360 / CMV.
            </div>

            {/* Récap des 8 indicateurs essentiels — groupés par catégorie */}
            <div className="bg-gray-800/40 rounded-xl p-3 border border-gray-700/50">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                🎓 Les 8 indicateurs essentiels à maîtriser
              </div>
              <div className="space-y-2">
                {/* Groupe 1 : Résultats */}
                <div className="bg-indigo-950/40 border border-indigo-700/40 rounded-lg p-2">
                  <div className="text-xs font-bold text-indigo-300 mb-1.5">📊 Résultats</div>
                  {[
                    ["1️⃣", "Valeur Ajoutée (VA)", sig.valeurAjoutee, ""],
                    ["2️⃣", "Excédent Brut d’Exploitation (EBE)", sig.ebe, ""],
                    ["3️⃣", "Résultat d’exploitation", sig.resultatExploitation, ""],
                    ["4️⃣", "Résultat net", sig.resultatNet, ""],
                  ].map(([num, label, val, unit]) => (
                    <div key={label as string} className="flex items-center justify-between py-0.5">
                      <span className="text-xs text-gray-400">{num} {label}</span>
                      <span className={`text-xs font-bold tabular-nums ${(val as number) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {(val as number) >= 0 ? "+" : ""}{val}{unit}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Groupe 2 : Structure */}
                <div className="bg-amber-950/30 border border-amber-700/40 rounded-lg p-2">
                  <div className="text-xs font-bold text-amber-300 mb-1.5">🏗️ Structure</div>
                  {[
                    ["5️⃣", "Fonds de Roulement (FR)", ind.fondsDeRoulement, ""],
                    ["6️⃣", "Besoin en Fonds de Roulement (BFR)", ind.besoinFondsRoulement, ""],
                  ].map(([num, label, val, unit]) => (
                    <div key={label as string} className="flex items-center justify-between py-0.5">
                      <span className="text-xs text-gray-400">{num} {label}</span>
                      <span className={`text-xs font-bold tabular-nums ${(val as number) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {(val as number) >= 0 ? "+" : ""}{val}{unit}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Groupe 3 : Trésorerie & Rentabilité */}
                <div className="bg-emerald-950/30 border border-emerald-700/40 rounded-lg p-2">
                  <div className="text-xs font-bold text-emerald-300 mb-1.5">💰 Trésorerie & Rentabilité</div>
                  {[
                    ["7️⃣", "Trésorerie Nette", ind.tresorerieNette, ""],
                    ["8️⃣", "Rentabilité financière (ROE)", parseFloat(sig.roe.toFixed(1)), "%"],
                  ].map(([num, label, val, unit]) => (
                    <div key={label as string} className="flex items-center justify-between py-0.5">
                      <span className="text-xs text-gray-400">{num} {label}</span>
                      <span className={`text-xs font-bold tabular-nums ${(val as number) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {(val as number) >= 0 ? "+" : ""}{val}{unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
