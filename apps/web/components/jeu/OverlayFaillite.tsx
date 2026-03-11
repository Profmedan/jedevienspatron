"use client";

interface OverlayFailliteProps {
  joueurNom: string;
  raison: string;
  onRestart: () => void;
  onContinue: () => void;
  canContinue: boolean;
}

/**
 * Overlay affiché quand un joueur fait faillite
 * Explique la raison et propose de recommencer ou continuer
 */
export function OverlayFaillite({
  joueurNom,
  raison,
  onRestart,
  onContinue,
  canContinue,
}: OverlayFailliteProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/85 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* En-tête dramatique */}
        <div className="bg-gradient-to-br from-red-600 to-red-700 px-6 py-5 text-white text-center">
          <div className="text-5xl mb-2 animate-bounce">💥</div>
          <h2 className="text-3xl font-black tracking-widest animate-pulse">
            FAILLITE
          </h2>
          <p className="text-red-200 text-sm mt-1 font-semibold">
            {joueurNom} est en cessation de paiement
          </p>
        </div>

        {/* Corps */}
        <div className="px-6 py-5 space-y-3">
          {/* Raison */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800 leading-relaxed">
            <strong>🚨 Raison :</strong> {raison}
          </div>

          {/* Leçon comptable */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 leading-relaxed">
            <strong>📚 Leçon comptable :</strong> Une entreprise est en faillite quand
            elle ne peut plus faire face à ses décaissements. Un découvert bancaire
            excessif, des capitaux propres négatifs ou un surendettement conduisent
            au dépôt de bilan.
          </div>

          {/* Conseil */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800 leading-relaxed">
            <strong>💡 Prochain essai :</strong> Surveille ton Fonds de Roulement et
            ta Trésorerie nette. N&apos;investis jamais plus que ce que tes revenus
            peuvent absorber.
          </div>
        </div>

        {/* Boutons */}
        <div className="px-6 pb-6 space-y-2">
          <button
            onClick={onRestart}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 rounded-xl text-lg shadow-sm transition-all active:scale-95"
          >
            🔄 Recommencer une nouvelle partie
          </button>
          {canContinue && (
            <button
              onClick={onContinue}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-xl text-sm transition-all"
            >
              ▶️ Continuer à regarder la partie
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
