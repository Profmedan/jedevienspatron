"use client";

import { useState, useEffect, useRef, type MutableRefObject } from "react";
import { useRouter } from "next/navigation";
import {
  EtatJeu,
  TrimSnapshot,
  EntrepriseTemplate,
  SecteurActivite,
  calculerIndicateurs,
  calculerScore,
  getTresorerie,
} from "@jedevienspatron/game-engine";

// B8-F / B9-A : mapping `type` (libellé UI de l'entreprise de base) → `secteurActivite`
// (clé technique du moteur). Utilisé uniquement pour les templates custom
// persistés en base (Supabase) qui ne stockent pas encore `secteur_activite`.
// B9-A (2026-04-24) : Logistique et Innovation obtiennent enfin leurs modes propres
// ("logistique" et "conseil"), introduits dans le type union SecteurActivite.
// Fallback "service" (le plus conservateur : marge non nulle, pas de blocage stock).
function _deduireSecteurActivite(baseType: string | undefined): SecteurActivite {
  switch (baseType) {
    case "Production": return "production";
    case "Commerce":   return "negoce";
    case "Logistique": return "logistique";
    case "Innovation": return "conseil";
    default:           return "service";
  }
}

// ─── Types ─────────────────────────────────────────────────────────────────

type Phase = "setup" | "intro" | "playing" | "gameover";

/**
 * Schéma d'une sauvegarde localStorage.
 * SAVE_VERSION doit être incrémenté si la structure de EtatJeu change de façon
 * incompatible (sinon les anciennes sauvegardes seraient restaurées avec un
 * moteur incompatible et planteraient silencieusement).
 *
 * v2 (T25.C, 2026-04-19) — cycle 9 étapes → 8 étapes : le `etapeTour` ne
 * désigne plus les mêmes contenus. Une sauvegarde v1 restaurée sur le nouveau
 * moteur ferait planter le joueur sur une étape qui ne signifie plus la même
 * chose. Bump SAVE_VERSION 1→2 → useGamePersistence.ts:52 rejette les v1.
 *
 * v3 (B6, 2026-04-20) — ajout des champs obligatoires `compteResultatCumulePartie`
 * (Joueur) et optionnels `numeroExerciceEnCours` / `dernierTourClotureExercice`
 * (EtatJeu). Une sauvegarde v2 restaurée sur le nouveau moteur n'aurait pas
 * `compteResultatCumulePartie` → les calculs B6 planteraient au premier
 * accès. La rejection automatique (readSave retourne null si version ≠)
 * réinitialise proprement la partie : l'élève doit repartir de T1.
 *
 * v4 (B9-A, 2026-04-24) — insertion de REALISATION_METIER en position 3,
 * décalage VENTES→FACTURATION_VENTES(4), DECISION→5, EVENEMENT→6, fusion
 * CLOTURE_TRIMESTRE+BILAN→CLOTURE_BILAN(7). Une save v3 chargée ferait
 * pointer `etapeTour` sur une étape qui a changé de sens (ex. un `etapeTour=3`
 * pointait vers VENTES en v3, pointe vers REALISATION_METIER placeholder
 * en v4). Bump 3→4 rejette les v3 au chargement.
 */
const SAVE_VERSION = 4;
const SAVE_TTL_MS  = 24 * 60 * 60 * 1000; // 24 h

interface SavedGame {
  version: number;
  savedAt: number;     // timestamp Unix ms
  roomCode: string;    // inclus pour retrouver la sauvegarde solo sans URL param
  phase: Phase;
  etat: EtatJeu;
}

// Clés localStorage
const KEY_ROOM  = (code: string)  => `jdp_game_room_${code.toUpperCase()}`;
const KEY_SOLO  = (code: string)  => `jdp_game_solo_${code}`;
const KEY_SOLO_PENDING = "jdp_solo_pending_code"; // roomCode solo entre createSoloSession et handleStart

function writeSave(key: string, roomCode: string, phase: Phase, etat: EtatJeu) {
  try {
    const save: SavedGame = { version: SAVE_VERSION, savedAt: Date.now(), roomCode, phase, etat };
    localStorage.setItem(key, JSON.stringify(save));
  } catch { /* localStorage plein ou indisponible */ }
}

function readSave(key: string): SavedGame | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const save: SavedGame = JSON.parse(raw);
    if (save.version !== SAVE_VERSION) return null;
    if (Date.now() - save.savedAt > SAVE_TTL_MS) { localStorage.removeItem(key); return null; }
    return save;
  } catch { return null; }
}

function clearSave(key: string) {
  try { localStorage.removeItem(key); } catch { /* rien */ }
}

// ─── Paramètres / retour ────────────────────────────────────────────────────

interface UseGamePersistenceParams {
  phase: Phase;
  etat: EtatJeu | null;
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
  createSoloSession: (nbTours: number) => Promise<boolean>;
  /**
   * true une fois que l'Effect d'initialisation a terminé (localStorage lu,
   * éventuellement fetch /start répondu). Avant ce point, page.tsx doit
   * afficher un spinner pour éviter un flash de l'écran de setup.
   */
  persistenceReady: boolean;
  /**
   * État restauré depuis localStorage (null = pas de sauvegarde).
   * page.tsx doit lire ce champ AU MONTAGE pour sauter l'écran de setup.
   */
  restoredGame: { phase: Phase; etat: EtatJeu } | null;
  /**
   * Raison de blocage si la session est déjà en cours ou terminée sans save local.
   * null = session disponible.
   */
  sessionBlocked: "playing" | "finished" | null;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useGamePersistence({
  phase,
  etat,
  snapshotsRef,
}: UseGamePersistenceParams): UseGamePersistenceReturn {
  const [roomCode, setRoomCode]           = useState<string | null>(null);
  const [savedToDb, setSavedToDb]         = useState(false);
  const [isSolo, setIsSolo]               = useState(false);
  const [soloLoading, setSoloLoading]     = useState(false);
  const [soloError, setSoloError]         = useState<string | null>(null);
  const [customTemplates, setCustomTemplates] = useState<EntrepriseTemplate[] | null>(null);
  const [persistenceReady, setPersistenceReady] = useState(false);
  const [restoredGame, setRestoredGame]   = useState<{ phase: Phase; etat: EtatJeu } | null>(null);
  const [sessionBlocked, setSessionBlocked] = useState<"playing" | "finished" | null>(null);

  const router = useRouter();

  // Garde pour éviter double-restauration
  const initDone = useRef(false);

  // ── Effet 1 : initialisation au montage ──────────────────────────────────
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const params = new URLSearchParams(window.location.search);
    const code   = params.get("code");
    const access = params.get("access");

    if (code) {
      // ── Mode apprenant (room_code dans l'URL) ───────────────────────────
      const upperCode = code.toUpperCase();
      setRoomCode(upperCode);

      // 1. Y a-t-il une sauvegarde locale pour ce code ?
      const saved = readSave(KEY_ROOM(upperCode));
      if (saved) {
        // Sauvegarde présente → restaurer sans appeler le serveur
        setRestoredGame({ phase: saved.phase, etat: saved.etat });
        // Charger les templates en arrière-plan (non bloquant)
        _loadTemplatesForCode(upperCode);
        setPersistenceReady(true);
        return;
      }

      // 2. Pas de sauvegarde → interroger le serveur pour vérifier le statut
      fetch(`/api/sessions/${upperCode}/start`, { method: "POST" })
        .then(r => {
          if (r.status === 403) { setSessionBlocked("finished"); }
          else if (r.status === 208) { setSessionBlocked("playing"); }
          else {
            // 200 → session disponible, charger les templates
            _loadTemplatesForCode(upperCode);
          }
          setPersistenceReady(true);
        })
        .catch(() => {
          // Erreur réseau → on laisse jouer (fail-open pour ne pas bloquer un cours)
          _loadTemplatesForCode(upperCode);
          setPersistenceReady(true);
        });

    } else if (access) {
      // ── Mode bypass code ─────────────────────────────────────────────────
      // Pas de session DB → pas de blocage, pas de sauvegarde locale
      // (bypass codes sont pour démo/test, not tracking strict)
      setPersistenceReady(true);

    } else {
      // ── Mode solo (formateur/individuel authentifié) ─────────────────────
      setIsSolo(true);

      // Chercher une sauvegarde solo en cours
      const pendingCode = localStorage.getItem(KEY_SOLO_PENDING);
      if (pendingCode) {
        const saved = readSave(KEY_SOLO(pendingCode));
        if (saved) {
          setRoomCode(pendingCode);
          setRestoredGame({ phase: saved.phase, etat: saved.etat });
          setPersistenceReady(true);
          return; // Pas besoin de charger templates ni vérifier crédits
        }
        // Sauvegarde expirée → nettoyer
        localStorage.removeItem(KEY_SOLO_PENDING);
      }

      // Pas de save → flux normal (charger templates du formateur, non bloquant)
      setPersistenceReady(true);
      fetch("/api/templates")
        .then(r => (r.ok ? r.json() : null))
        .then(data => { if (data?.templates?.length) setCustomTemplates(_convertTemplates(data.templates)); })
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Effet 2 : sauvegarde continue pendant la partie ──────────────────────
  useEffect(() => {
    if (!etat || !roomCode) return;
    if (phase !== "playing" && phase !== "intro") return;

    if (isSolo) {
      writeSave(KEY_SOLO(roomCode), roomCode, phase, etat);
    } else {
      writeSave(KEY_ROOM(roomCode), roomCode, phase, etat);
    }
  }, [phase, etat, roomCode, isSolo]);

  // ── Effet 3 : fin de partie → marquer finished + nettoyer localStorage ──
  useEffect(() => {
    if (phase !== "gameover" || !etat || !roomCode) return;

    // Nettoyer la sauvegarde locale (partie terminée)
    if (isSolo) {
      clearSave(KEY_SOLO(roomCode));
      localStorage.removeItem(KEY_SOLO_PENDING);
    } else {
      clearSave(KEY_ROOM(roomCode));
      // Marquer la session comme terminée côté Supabase
      fetch(`/api/sessions/${roomCode}/start`, { method: "PATCH" }).catch(() => {});
    }
  }, [phase, etat, roomCode, isSolo]);

  // ── Effet 4 : sauvegarde historique solo dans localStorage (post-partie) ─
  useEffect(() => {
    if (phase !== "gameover" || !etat || roomCode) return; // room_code sessions → Supabase
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
    } catch { /* localStorage indisponible */ }
  }, [phase, etat, roomCode, snapshotsRef]);

  // ── Effet 5 : sauvegarde Supabase si room_code présent ──────────────────
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
      .then(() => { setSavedToDb(true); })
      .catch(err => console.error("❌ Erreur save résultats:", err));
  }, [phase, etat, roomCode, savedToDb, snapshotsRef]);

  // ── Créer une session solo (consomme 1 crédit) ──────────────────────────
  async function createSoloSession(nbTours: number): Promise<boolean> {
    if (!isSolo) return true;

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
      const code: string = data.session.room_code;
      setRoomCode(code);
      // Mémoriser le code en localStorage pour le retrouver après un refresh
      try { localStorage.setItem(KEY_SOLO_PENDING, code); } catch { /* rien */ }
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
    persistenceReady,
    restoredGame,
    sessionBlocked,
  };
}

// ─── Helpers privés ────────────────────────────────────────────────────────

function _loadTemplatesForCode(code: string) {
  fetch(`/api/sessions/${code}/templates`)
    .then(r => (r.ok ? r.json() : null))
    .then(data => {
      if (data?.templates?.length) {
        // Les templates sont passés au jeu via customTemplates dans le composant parent
        // On les stocke dans sessionStorage pour pouvoir les récupérer après restauration
        try {
          sessionStorage.setItem(`jdp_templates_${code}`, JSON.stringify(data.templates));
        } catch { /* rien */ }
      }
    })
    .catch(() => {});
}

function _convertTemplates(templates: Array<Record<string, unknown>>): EntrepriseTemplate[] {
  return templates.map((t: Record<string, unknown>) => ({
    nom: t.name as string,
    type: t.base_enterprise as string,
    // B8-F : `secteurActivite` est obligatoire sur `EntrepriseTemplate` depuis B8-A.
    // La table Supabase ne stocke pas encore ce champ → on le dérive du `base_enterprise`.
    // `modeleValeur` / `clientsPassifsParTour` restent absents ici : les helpers moteur
    // (`getModeleValeurEntreprise`) retombent sur le défaut par secteur.
    secteurActivite: _deduireSecteurActivite(t.base_enterprise as string | undefined),
    couleur: t.couleur as string,
    icon: t.icon as string,
    specialite: (t.specialite_label as string) || "",
    actifs: [
      { nom: t.immo1_nom as string, valeur: t.immo1_valeur as number },
      { nom: t.immo2_nom as string, valeur: t.immo2_valeur as number },
      ...((t.autres_immo as number) > 0 ? [{ nom: "Autres immobilisations", valeur: t.autres_immo as number }] : []),
      { nom: "Stocks de marchandises", valeur: t.stocks as number },
      { nom: "Trésorerie", valeur: t.tresorerie as number },
    ],
    passifs: [
      { nom: "Capitaux propres", valeur: t.capitaux_propres as number },
      ...((t.emprunts as number) > 0 ? [{ nom: "Emprunt bancaire", valeur: t.emprunts as number }] : []),
      ...((t.dettes as number) > 0 ? [{ nom: "Dettes fournisseurs", valeur: t.dettes as number }] : []),
    ],
    effetsPassifs: [],
    cartesLogistiquesDepart: [],
    cartesLogistiquesDisponibles: [],
    reducDelaiPaiement: t.reduc_delai_paiement as boolean ?? false,
    clientGratuitParTour: t.client_gratuit_par_tour as boolean ?? false,
  }));
}
