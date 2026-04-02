"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EtatJeu } from "@/lib/game-engine/types";
import { calculerScore, calculerIndicateurs, getTresorerie } from "@/lib/game-engine/calculators";

export function useGameSession(phase: string, etat: EtatJeu | null) {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [savedToDb, setSavedToDb] = useState(false);
  const [isSolo, setIsSolo] = useState(false);
  const [soloLoading, setSoloLoading] = useState(false);
  const [soloError, setSoloError] = useState<string | null>(null);
  
  const router = useRouter();

  // Lecture de l'URL pour déterminer le mode
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const access = params.get("access");
      if (code) {
        setRoomCode(code);
      } else if (!access) {
        // Ni room_code ni bypass -> mode solo (auth + crédit requis)
        setIsSolo(true);
      }
    }
  }, []);

  // Sauvegarde historique solo dans localStorage
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
    };
    try {
      const existant = JSON.parse(localStorage.getItem("jdp_historique_solo") ?? "[]");
      localStorage.setItem("jdp_historique_solo", JSON.stringify([partie, ...existant].slice(0, 20)));
    } catch { /* localStorage indisponible (mode privé strict) */ }
  }, [phase, etat, roomCode]);

  // Sauvegarde Supabase si room_code présent
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

  // Initialisation d'une session solo
  async function createSoloSession(nbTours: number): Promise<boolean> {
    if (!isSolo) return true; // Si on n'est pas en solo, pas besoin de créer une session ici
    
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
          // Pas de crédits -> rediriger vers les packs
          router.push("/dashboard/packs?message=no-credits");
          return false;
        }
        if (res.status === 401) {
          router.push("/auth/login?redirectTo=/jeu");
          return false;
        }
        setSoloError(data.message ?? data.error ?? "Erreur lors de la création de la session.");
        setSoloLoading(false);
        return false;
      }
      // Session créée -> utiliser le room_code pour sauvegarder en Supabase
      setRoomCode(data.session.room_code);
      setSoloLoading(false);
      return true;
    } catch {
      setSoloError("Erreur réseau, veuillez réessayer.");
      setSoloLoading(false);
      return false;
    }
  }

  return {
    roomCode,
    isSolo,
    savedToDb,
    setSavedToDb,
    soloLoading,
    soloError,
    setSoloError,
    createSoloSession
  };
}
