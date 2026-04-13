"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Edit2, Trash2, Plus, CheckCircle2, AlertCircle } from "lucide-react";

// Types
type Template = {
  id: string;
  name: string;
  base_enterprise: string;
  couleur: string;
  icon: string;
  immo1_nom: string;
  immo1_valeur: number;
  immo2_nom: string;
  immo2_valeur: number;
  autres_immo: number;
  stocks: number;
  tresorerie: number;
  capitaux_propres: number;
  emprunts: number;
  dettes: number;
  reduc_delai_paiement: boolean;
  client_gratuit_par_tour: boolean;
  specialite_label: string;
  created_at: string;
};

type FormData = Omit<Template, "id" | "created_at">;

const PRESET_COLORS = [
  "#ff6b6b",
  "#4ecdc4",
  "#45b7d1",
  "#f9ca24",
  "#6c5ce7",
  "#a29bfe",
  "#fd79a8",
  "#fdcb6e",
];

const BASE_ENTERPRISES = [
  { id: "manufacture", name: "Manufacture Belvaux" },
  { id: "veloce", name: "Véloce Transports" },
  { id: "azura", name: "Azura Commerce" },
  { id: "synergia", name: "Synergia Lab" },
];

const ENTERPRISE_DEFAULTS: Record<string, Omit<FormData, "name" | "couleur" | "icon" | "reduc_delai_paiement" | "client_gratuit_par_tour" | "specialite_label" | "base_enterprise">> = {
  manufacture: {
    immo1_nom: "Machines industrielles",
    immo1_valeur: 8000,
    immo2_nom: "Bâtiment usine",
    immo2_valeur: 8000,
    autres_immo: 0,
    stocks: 4000,
    tresorerie: 8000,
    capitaux_propres: 20000,
    emprunts: 8000,
    dettes: 0,
  },
  veloce: {
    immo1_nom: "Flotte véhicules",
    immo1_valeur: 10000,
    immo2_nom: "Entrepôt logistique",
    immo2_valeur: 6000,
    autres_immo: 0,
    stocks: 2000,
    tresorerie: 10000,
    capitaux_propres: 20000,
    emprunts: 8000,
    dettes: 0,
  },
  azura: {
    immo1_nom: "Agencement boutique",
    immo1_valeur: 6000,
    immo2_nom: "Mobilier commercial",
    immo2_valeur: 4000,
    autres_immo: 0,
    stocks: 8000,
    tresorerie: 10000,
    capitaux_propres: 20000,
    emprunts: 8000,
    dettes: 0,
  },
  synergia: {
    immo1_nom: "Équipement R&D",
    immo1_valeur: 12000,
    immo2_nom: "Brevets",
    immo2_valeur: 6000,
    autres_immo: 0,
    stocks: 2000,
    tresorerie: 8000,
    capitaux_propres: 20000,
    emprunts: 8000,
    dettes: 0,
  },
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [formData, setFormData] = useState<FormData>(getDefaultFormData("manufacture"));
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/templates");
      if (!res.ok) throw new Error("Erreur lors du chargement des templates");
      const { templates: data } = await res.json();
      setTemplates(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  function getDefaultFormData(enterpriseId: string): FormData {
    const defaults = ENTERPRISE_DEFAULTS[enterpriseId] || ENTERPRISE_DEFAULTS.manufacture;
    return {
      name: "",
      base_enterprise: enterpriseId,
      couleur: PRESET_COLORS[0],
      icon: "🏭",
      ...defaults,
      reduc_delai_paiement: false,
      client_gratuit_par_tour: false,
      specialite_label: "",
    };
  }

  function handleCreateNew() {
    setEditingId(null);
    setFormData(getDefaultFormData("manufacture"));
    setShowEditor(true);
  }

  function handleEdit(template: Template) {
    setEditingId(template.id);
    setFormData({
      name: template.name,
      base_enterprise: template.base_enterprise,
      couleur: template.couleur,
      icon: template.icon,
      immo1_nom: template.immo1_nom,
      immo1_valeur: template.immo1_valeur,
      immo2_nom: template.immo2_nom,
      immo2_valeur: template.immo2_valeur,
      autres_immo: template.autres_immo,
      stocks: template.stocks,
      tresorerie: template.tresorerie,
      capitaux_propres: template.capitaux_propres,
      emprunts: template.emprunts,
      dettes: template.dettes,
      reduc_delai_paiement: template.reduc_delai_paiement,
      client_gratuit_par_tour: template.client_gratuit_par_tour,
      specialite_label: template.specialite_label,
    });
    setShowEditor(true);
  }

  async function handleSave() {
    try {
      const url = editingId ? `/api/templates/${editingId}` : "/api/templates";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const { error: apiError } = await res.json();
        throw new Error(apiError || "Erreur lors de la sauvegarde");
      }

      await fetchTemplates();
      setShowEditor(false);
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      await fetchTemplates();
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }

  function handleBaseEnterpriseChange(enterpriseId: string) {
    const defaults = ENTERPRISE_DEFAULTS[enterpriseId] || ENTERPRISE_DEFAULTS.manufacture;
    setFormData({
      ...formData,
      base_enterprise: enterpriseId,
      ...defaults,
    });
  }

  const actif =
    formData.immo1_valeur +
    formData.immo2_valeur +
    formData.autres_immo +
    formData.stocks +
    formData.tresorerie;

  const passif = formData.capitaux_propres + formData.emprunts + formData.dettes;
  const isBalanced = actif === passif;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="hover:text-gray-400">
              <span className="text-2xl">🎯</span>
            </Link>
            <div>
              <h1 className="font-black text-gray-100 text-lg leading-none">
                SCÉNARIOS PERSONNALISÉS
              </h1>
              <p className="text-xs text-gray-400">Gestion des templates d'entreprise</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            ← Tableau de bord
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-700 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-red-100 font-semibold">Erreur</p>
              <p className="text-red-200 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Action Button */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-100">Mes scénarios</h2>
            <p className="text-gray-400 text-sm mt-1">
              Créez et gérez vos templates d'entreprise personnalisés
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2"
          >
            <Plus size={18} /> Créer un scénario
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-900 border border-gray-700 rounded-xl p-6 animate-pulse"
              >
                <div className="h-6 bg-gray-700 rounded w-1/2 mb-4" />
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && templates.length === 0 && (
          <div className="bg-gray-900 border border-dashed border-gray-700 rounded-xl p-12 text-center">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-gray-100 mb-2">
              Aucun scénario créé
            </h3>
            <p className="text-gray-400 mb-6">
              Commencez par créer votre premier template d'entreprise personnalisé
            </p>
            <button
              onClick={handleCreateNew}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors inline-flex items-center gap-2"
            >
              <Plus size={18} /> Créer un scénario
            </button>
          </div>
        )}

        {/* Templates Grid */}
        {!loading && templates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => {
              const actif =
                template.immo1_valeur +
                template.immo2_valeur +
                template.autres_immo +
                template.stocks +
                template.tresorerie;
              const passif =
                template.capitaux_propres + template.emprunts + template.dettes;
              const baseLabel =
                BASE_ENTERPRISES.find((e) => e.id === template.base_enterprise)
                  ?.name || template.base_enterprise;

              return (
                <div
                  key={template.id}
                  className="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:border-indigo-700 hover:shadow-lg shadow-black/10 transition-all"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                        style={{ backgroundColor: template.couleur + "20" }}
                      >
                        {template.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-gray-100 truncate">
                          {template.name}
                        </h3>
                        <p className="text-xs text-gray-400">{baseLabel}</p>
                        {template.specialite_label && (
                          <p className="text-xs text-indigo-400 mt-1">
                            {template.specialite_label}
                          </p>
                        )}
                      </div>
                    </div>
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: template.couleur }}
                      title={template.couleur}
                    />
                  </div>

                  {/* Bilan Summary */}
                  <div className="space-y-3 mb-4 bg-gray-800/50 rounded-lg p-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Actif</span>
                      <span className="font-semibold text-gray-100">
                        {actif.toLocaleString()}k€
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Passif</span>
                      <span className="font-semibold text-gray-100">
                        {passif.toLocaleString()}k€
                      </span>
                    </div>
                  </div>

                  {/* Options */}
                  {(template.reduc_delai_paiement || template.client_gratuit_par_tour) && (
                    <div className="text-xs text-gray-400 mb-4 space-y-1">
                      {template.reduc_delai_paiement && (
                        <div>✓ Réduction délai paiement</div>
                      )}
                      {template.client_gratuit_par_tour && (
                        <div>✓ Client gratuit par tour</div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(template)}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-100 font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit2 size={16} /> Modifier
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(template.id)}
                      className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-red-300 font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} /> Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Template Editor Modal */}
      {showEditor && (
        <TemplateEditor
          formData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          onCancel={() => setShowEditor(false)}
          isEditing={editingId !== null}
          isBalanced={isBalanced}
          actif={actif}
          passif={passif}
          onBaseEnterpriseChange={handleBaseEnterpriseChange}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm">
            <h3 className="text-lg font-bold text-gray-100 mb-2">Supprimer le scénario ?</h3>
            <p className="text-gray-400 text-sm mb-6">
              Cette action est irréversible. Le scénario sera supprimé de votre compte.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-100 font-semibold py-2 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TemplateEditor({
  formData,
  setFormData,
  onSave,
  onCancel,
  isEditing,
  isBalanced,
  actif,
  passif,
  onBaseEnterpriseChange,
}: {
  formData: FormData;
  setFormData: (data: FormData) => void;
  onSave: () => void;
  onCancel: () => void;
  isEditing: boolean;
  isBalanced: boolean;
  actif: number;
  passif: number;
  onBaseEnterpriseChange: (id: string) => void;
}) {
  const [saving, setSaving] = useState(false);

  async function handleSaveWithLoading() {
    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-2xl w-full my-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-100">
            {isEditing ? "Modifier le scénario" : "Créer un scénario"}
          </h2>
          <button
            onClick={onCancel}
            disabled={saving}
            className="text-gray-400 hover:text-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Identité */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-300 mb-4">
              Identité
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-100 mb-2">
                  Nom du scénario
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Fabrique premium"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-100 mb-2">
                  Entreprise de base
                </label>
                <select
                  value={formData.base_enterprise}
                  onChange={(e) => onBaseEnterpriseChange(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:outline-none focus:border-indigo-600"
                >
                  {BASE_ENTERPRISES.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-100 mb-2">
                    Couleur
                  </label>
                  <div className="flex gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() =>
                          setFormData({ ...formData, couleur: color })
                        }
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${
                          formData.couleur === color
                            ? "border-white"
                            : "border-gray-600 hover:border-gray-500"
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-100 mb-2">
                    Icône
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) =>
                        setFormData({ ...formData, icon: e.target.value })
                      }
                      maxLength={2}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-indigo-600 text-center text-2xl"
                    />
                    <div className="text-3xl">{formData.icon}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Bilan Actif */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-300 mb-4">
              Bilan — Actif
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-100 mb-1">
                    {formData.immo1_nom}
                  </label>
                  <input
                    type="text"
                    value={formData.immo1_nom}
                    onChange={(e) =>
                      setFormData({ ...formData, immo1_nom: e.target.value })
                    }
                    placeholder="Immobilisation 1"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-600 mb-2"
                  />
                  <input
                    type="number"
                    value={formData.immo1_valeur}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        immo1_valeur: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="Valeur (k€)"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-100 mb-1">
                    {formData.immo2_nom}
                  </label>
                  <input
                    type="text"
                    value={formData.immo2_nom}
                    onChange={(e) =>
                      setFormData({ ...formData, immo2_nom: e.target.value })
                    }
                    placeholder="Immobilisation 2"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-600 mb-2"
                  />
                  <input
                    type="number"
                    value={formData.immo2_valeur}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        immo2_valeur: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="Valeur (k€)"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-100 mb-2">
                  Autres immobilisations
                </label>
                <input
                  type="number"
                  value={formData.autres_immo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      autres_immo: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="k€"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-100 mb-2">
                    Stocks
                  </label>
                  <input
                    type="number"
                    value={formData.stocks}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stocks: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="k€"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-100 mb-2">
                    Trésorerie
                  </label>
                  <input
                    type="number"
                    value={formData.tresorerie}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tresorerie: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="k€"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Bilan Passif */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-300 mb-4">
              Bilan — Passif
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-100 mb-2">
                  Capitaux propres
                </label>
                <input
                  type="number"
                  value={formData.capitaux_propres}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capitaux_propres: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="k€"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-100 mb-2">
                    Emprunts
                  </label>
                  <input
                    type="number"
                    value={formData.emprunts}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emprunts: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="k€"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-100 mb-2">
                    Dettes
                  </label>
                  <input
                    type="number"
                    value={formData.dettes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dettes: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="k€"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Balance Validation */}
          <section className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-100">
                Vérification du bilan
              </span>
              {isBalanced ? (
                <CheckCircle2 className="text-emerald-400" size={20} />
              ) : (
                <AlertCircle className="text-red-400" size={20} />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs text-gray-400">Total Actif</p>
                <p className="text-lg font-bold text-emerald-300">
                  {actif.toLocaleString()}k€
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Total Passif</p>
                <p className="text-lg font-bold text-blue-300">
                  {passif.toLocaleString()}k€
                </p>
              </div>
            </div>
            {!isBalanced && (
              <p className="text-xs text-red-300">
                ⚠ Actif et Passif doivent être égaux. Différence: {Math.abs(actif - passif)}k€
              </p>
            )}
          </section>

          {/* Options */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-300 mb-4">
              Options mécaniques
            </h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.reduc_delai_paiement}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reduc_delai_paiement: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded bg-gray-800 border border-gray-700 accent-indigo-600"
                />
                <span className="text-sm text-gray-100">
                  Réduction délai de paiement
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.client_gratuit_par_tour}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      client_gratuit_par_tour: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded bg-gray-800 border border-gray-700 accent-indigo-600"
                />
                <span className="text-sm text-gray-100">
                  Client gratuit par tour
                </span>
              </label>

              <div>
                <label className="block text-sm font-semibold text-gray-100 mb-2">
                  Label de spécialité (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.specialite_label}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      specialite_label: e.target.value,
                    })
                  }
                  placeholder="Ex: Atelier haut de gamme"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-700">
          <button
            onClick={onCancel}
            disabled={saving}
            className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-100 font-semibold py-2.5 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSaveWithLoading}
            disabled={!formData.name || !isBalanced || saving}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
      </div>
    </div>
  );
}
