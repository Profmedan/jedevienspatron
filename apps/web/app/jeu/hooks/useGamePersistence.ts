"use client";

import { useState, useEffect, type MutableRefObject } from "react";
import { useRouter } from "next/navigation";
import {
  EtatJeu,
  TrimSnapshot,
  EntrepriseTemplate,
  calculerIndicateurs,
  calculerScore,
  getTresorerie,
} from "@jedevienspatron/game-engine";

// ─── Types ─────────────────────────────────────────────────────────────────

type Phase = "setup" | "intro" | "playing" | "gameover";

interface UseGamePersistenceParams {
  phase: Phase;
  etat: EtatJeu | null;
  /** Ref vers les snapshots trimestriels accumulés par useGameFlow (ref pour éviter dépendance circulaire) */
  snapshotsRef: MutableRefObject<TrimSnapshot[]>;
}

interface UseGamePersistenceReturn {
  roomCode: string | null;
  savedToDb: boolean;
  setSavedToDb: (v: boolean) => void;
  isSolo: boolean;
  soloLoading: boolean;
  soloError: string | null;
  setSoloError: (v: string | null) => void;
  customTemplates: EntrepriseTemplate[] | null;
  /** Crée une session solo (consomme 1 crédit). Retourne true si OK, false si erreur/redirect. */
  createSoloSession: (nbTours: number) => Promise<boolean>;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useGamePersistence({
  phase,
  etat,
  snapshotsRef,
}: UseGamePersistenceParams): UseGamePersistenceReturn {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [savedToDb, setSavedToDb] = useState(false);
  const [isSolo, setIsSolo] = useState(false);
  const [soloLoading, setSoloLoading] = useState(false);
  const [soloError, setSoloError] = useState<string | null>(null);
  const [customTemplates, setCustomTemplates] = useState<EntrepriseTemplate[] | null>(null);

  const router = useRouter();

  // ── Effet 1 : lecture des paramètres URL et chargement du template au montage ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const access = params.get("access");
    if (code) {
      setRoomCode(code);
      // Charger les templates snapshotés dans la session
      fetch(`/api/sessions/${code}/templates`)
        .then(r => {
          if (r.ok) return r.json();
          throw new Error("Impossible de charger les templates");
        })
        .then(data => {
          if (data.templates && Array.isArray(data.templates) && data.templates.length > 0) {
            setCustomTemplates(data.templates);
          }
        })
        .catch(err => console.warn("Templates non disponibles:", err));
    } else if (!access) {
      // Ni room_code ni bypass → mode solo (auth + crédit requis)
      setIsSolo(true);
      // Charger les templates personnalisés du formateur connecté
      fetch("/api/templates")
        .then(r => {
          if (r.ok) return r.json();
          return null;
        })
        .then(data => {
          if (data?.templates && Array.isArray(data.templates) && data.templates.length > 0) {
            // Convertir les templates DB en format EntrepriseTemplate pour le moteur
            const converted: EntrepriseTemplate[] = data.templates.map((t: any) => ({
              nom: t.name,
              type: t.base_enterprise,
              couleur: t.couleur,
              icon: t.icon,
              specialite: t.specialite_label || "",
              actifs: [
                { nom: t.immo1_nom, valeur: t.immo1_valeur },
                { nom: t.immo2_nom, valeur: t.immo2_valeur },
                ...(t.autres_immo > 0 ? [{ nom: "Autres immobilisations", valeur: t.autres_immo }] : []),
                { nom: "Stocks de marchandises", valeur: t.stocks },
                { nom: "Trésorerie", valeur: t.tresorerie },
              ],
              passifs: [
                { nom: "Capitaux propres", valeur: t.capitaux_propres },
                ...(t.emprunts > 0 ? [{ nom: "Emprunt bancaire", valeur: t.emprunts }] : []),
                ...(t.dettes > 0 ? [{ nom: "Dettes fournisseurs", valeur: t.dettes }] : []),
              ],
              effetsPassifs: [],
              cartesLogistiquesDepart: [],
              cartesLogistiquesDisponibles: [],
              reducDelaiPaiement: t.reduc_delai_paiement ?? false,
              clientGratuitParTour: t.client_gratuit_par_tour ?? false,
            }));
            setCustomTemplates(converted);
          }
        })
        .catch(() => {}); // pas connecté ou pas de templates → silencieux
    }
  }, []);

  // ── Effet 2 : sauvegarde historique solo dans localStorage ───────────────
  useEffect(() => {
    if (phase !== "gameover" || !etat || roomCode) return;
    const j = etat.joueurs[0];
    const indicateurs = calculerIndicateurs(j);
    const partie = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      pseudo: j.pseudo,
      entreprise: j.entreprise.nom,
      score: calculerScore(j),
      resultatNet: indicateurs.resultatNet,
      tresorerie: getTresorerie(j),
      trimestresJoues: etat.tourActuel,
      faillite: j.elimine,
      snapshots: snapshotsRef.current,
    };
    try {
      const existant = JSON.parse(localStorage.getItem("jdp_historique_solo") ?? "[]");
      localStorage.setItem("jdp_historique_solo", JSON.stringify([partie, ...existant].slice(0, 20)));
    } catch { /* localStorage indisponible (mode privé strict) */ }
  }, [phase, etat, roomCode, snapshotsRef]);

  // ── Effet 3 : sauvegarde Supabase si room_code présent ──────────────────
  useEffect(() => {
    if (phase !== "gameover" || !etat || !roomCode || savedToDb) return;
    const joueurs = etat.joueurs.map(j => ({
      pseudo: j.pseudo,
      entreprise: j.entreprise.nom,
      scoreTotal: calculerScore(j),
      elimine: j.elimine,
      etatFinal: j,
      snapshots: snapshotsRef.current,
    }));
    fetch("/api/sessions/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_code: roomCode, joueurs }),
    })
      .then(r => r.json())
      .then(() => { setSavedToDb(true); console.log("✅ Résultats sauvegardés dans Supabase"); })
      .catch(err => console.error("❌ Erreur save résultats:", err));
  }, [phase, etat, roomCode, savedToDb, snapshotsRef]);

  // ── Créer une session solo (consomme 1 crédit) ──────────────────────────
  async function createSoloSession(nbTours: number): Promise<boolean> {
    if (!isSolo) return true; // pas en mode solo, rien à faire

    setSoloLoading(true);
    setSoloError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nb_tours: nbTours }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402 || (data.message ?? data.error ?? "").toLowerCase().includes("crédit")) {
          router.push("/dashboard/packs?message=no-credits");
          setSoloLoading(false);
          return false;
        }
        if (res.status === 401) {
          router.push("/auth/login?redirectTo=/jeu");
          setSoloLoading(false);
          return false;
        }
        setSoloError(data.message ?? data.error ?? "Erreur lors de la création de la session.");
        setSoloLoading(false);
        return false;
      }
      // Session créée → utiliser le room_code pour sauvegarder en Supabase
      setRoomCode(data.session.room_code);
    } catch {
      setSoloError("Erreur réseau, veuillez réessayer.");
      setSoloLoading(false);
      return false;
    }
    setSoloLoading(false);
    return true;
  }

  return {
    roomCode,
    savedToDb,
    setSavedToDb,
    isSolo,
    soloLoading,
    soloError,
    setSoloError,
    customTemplates,
    createSoloSession,
  };
}
