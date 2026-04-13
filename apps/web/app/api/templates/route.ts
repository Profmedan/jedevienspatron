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

// ─── POST /api/templates — Créer un nouveau template ─────────────────
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();

    // Validation des champs requis
    const required = [
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
    ];

    for (const field of required) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: `Champ manquant: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validation du bilan
    const balanceCheck = validateBalance({
      immo1_valeur: body.immo1_valeur,
      immo2_valeur: body.immo2_valeur,
      autres_immo: body.autres_immo,
      stocks: body.stocks,
      tresorerie: body.tresorerie,
      capitaux_propres: body.capitaux_propres,
      emprunts: body.emprunts,
      dettes: body.dettes,
    });

    if (!balanceCheck.valid) {
      return NextResponse.json(
        { error: balanceCheck.message },
        { status: 400 }
      );
    }

    // Création du template
    const { data: template, error: insertError } = await serviceClient
      .from("custom_enterprise_templates")
      .insert({
        organization_id: profile.organization_id,
        created_by: user.id,
        name: body.name,
        base_enterprise: body.base_enterprise,
        couleur: body.couleur,
        icon: body.icon,
        immo1_nom: body.immo1_nom,
        immo1_valeur: body.immo1_valeur,
        immo2_nom: body.immo2_nom,
        immo2_valeur: body.immo2_valeur,
        autres_immo: body.autres_immo,
        stocks: body.stocks,
        tresorerie: body.tresorerie,
        capitaux_propres: body.capitaux_propres,
        emprunts: body.emprunts,
        dettes: body.dettes,
        reduc_delai_paiement: body.reduc_delai_paiement ?? false,
        client_gratuit_par_tour: body.client_gratuit_par_tour ?? false,
        specialite_label: body.specialite_label ?? "",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Erreur création template:", insertError);
      return NextResponse.json(
        { error: "Impossible de créer le template" },
        { status: 500 }
      );
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (err) {
    console.error("Erreur API templates POST:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── GET /api/templates — Lister tous les templates non archivés ──────
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // RLS appliquée automatiquement par le client user
    const { data: templates, error } = await supabase
      .from("custom_enterprise_templates")
      .select("*")
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur récupération templates:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des templates" },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates });
  } catch (err) {
    console.error("Erreur API templates GET:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
