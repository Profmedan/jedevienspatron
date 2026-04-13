import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// ─── Validation du bilan (Actif = Passif) ───────────────────────────
function validateBalance(data: {
  immo1_valeur: number;
  immo2_valeur: number;
  autres_immo: number;
  stocks: number;
  tresorerie: number;
  capitaux_propres: number;
  emprunts: number;
  dettes: number;
}): { valid: boolean; message?: string } {
  const actif =
    data.immo1_valeur +
    data.immo2_valeur +
    data.autres_immo +
    data.stocks +
    data.tresorerie;

  const passif = data.capitaux_propres + data.emprunts + data.dettes;

  if (actif !== passif) {
    return {
      valid: false,
      message: `Bilan déséquilibré: Actif (${actif}) ≠ Passif (${passif})`,
    };
  }

  return { valid: true };
}

// ─── PUT /api/templates/[id] — Mettre à jour un template ─────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Service client pour bypasser RLS
    const serviceClient = createServiceClient();

    // Récupère le profil
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: "Profil incomplet — organization_id manquant" },
        { status: 400 }
      );
    }

    // Vérifier que le template existe et appartient à l'organisation
    const { data: existingTemplate, error: selectError } = await serviceClient
      .from("custom_enterprise_templates")
      .select("id, organization_id")
      .eq("id", id)
      .single();

    if (selectError || !existingTemplate) {
      return NextResponse.json(
        { error: "Template introuvable" },
        { status: 404 }
      );
    }

    if (existingTemplate.organization_id !== profile.organization_id) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Champs autorisés pour la mise à jour (exclure id, organization_id, created_by, created_at)
    const allowedFields = [
      "name",
      "base_enterprise",
      "couleur",
      "icon",
      "immo1_nom",
      "immo1_valeur",
      "immo2_nom",
      "immo2_valeur",
      "autres_immo",
      "stocks",
      "tresorerie",
      "capitaux_propres",
      "emprunts",
      "dettes",
      "reduc_delai_paiement",
      "client_gratuit_par_tour",
      "specialite_label",
    ];

    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Si des champs de bilan sont présents, valider l'équilibre
    if (
      updateData.immo1_valeur !== undefined ||
      updateData.immo2_valeur !== undefined ||
      updateData.autres_immo !== undefined ||
      updateData.stocks !== undefined ||
      updateData.tresorerie !== undefined ||
      updateData.capitaux_propres !== undefined ||
      updateData.emprunts !== undefined ||
      updateData.dettes !== undefined
    ) {
      // Récupérer les valeurs actuelles
      const { data: current } = await serviceClient
        .from("custom_enterprise_templates")
        .select(
          "immo1_valeur, immo2_valeur, autres_immo, stocks, tresorerie, capitaux_propres, emprunts, dettes"
        )
        .eq("id", id)
        .single();

      if (!current) {
        return NextResponse.json(
          { error: "Template introuvable" },
          { status: 404 }
        );
      }

      // Construire les valeurs pour validation
      const balanceData = {
        immo1_valeur:
          (updateData.immo1_valeur as number) ?? current.immo1_valeur,
        immo2_valeur:
          (updateData.immo2_valeur as number) ?? current.immo2_valeur,
        autres_immo:
          (updateData.autres_immo as number) ?? current.autres_immo,
        stocks: (updateData.stocks as number) ?? current.stocks,
        tresorerie:
          (updateData.tresorerie as number) ?? current.tresorerie,
        capitaux_propres:
          (updateData.capitaux_propres as number) ??
          current.capitaux_propres,
        emprunts: (updateData.emprunts as number) ?? current.emprunts,
        dettes: (updateData.dettes as number) ?? current.dettes,
      };

      const balanceCheck = validateBalance(balanceData);
      if (!balanceCheck.valid) {
        return NextResponse.json(
          { error: balanceCheck.message },
          { status: 400 }
        );
      }
    }

    // Toujours mettre à jour updated_at
    updateData.updated_at = new Date().toISOString();

    // Mise à jour du template
    const { data: updatedTemplate, error: updateError } = await serviceClient
      .from("custom_enterprise_templates")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Erreur mise à jour template:", updateError);
      return NextResponse.json(
        { error: "Impossible de mettre à jour le template" },
        { status: 500 }
      );
    }

    return NextResponse.json({ template: updatedTemplate });
  } catch (err) {
    console.error("Erreur API templates PUT:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── DELETE /api/templates/[id] — Soft-delete un template ────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Service client pour bypasser RLS
    const serviceClient = createServiceClient();

    // Récupère le profil
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: "Profil incomplet — organization_id manquant" },
        { status: 400 }
      );
    }

    // Vérifier que le template existe et appartient à l'organisation
    const { data: existingTemplate, error: selectError } = await serviceClient
      .from("custom_enterprise_templates")
      .select("id, organization_id")
      .eq("id", id)
      .single();

    if (selectError || !existingTemplate) {
      return NextResponse.json(
        { error: "Template introuvable" },
        { status: 404 }
      );
    }

    if (existingTemplate.organization_id !== profile.organization_id) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    // Soft-delete : set is_archived = true
    const { error: updateError } = await serviceClient
      .from("custom_enterprise_templates")
      .update({
        is_archived: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("Erreur soft-delete template:", updateError);
      return NextResponse.json(
        { error: "Impossible de supprimer le template" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Template supprimé" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Erreur API templates DELETE:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
