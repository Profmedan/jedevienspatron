import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { consumeCredit, releaseCredit } from "@/lib/credits";

// ─── POST /api/sessions — Créer une session ───────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Service client pour bypasser RLS (route serveur de confiance)
    const serviceClient = createServiceClient();

    // Récupère le profil
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: "Profil incomplet — organization_id manquant" },
        { status: 400 }
      );
    }

    const creditId = await consumeCredit(profile.organization_id);
    if (!creditId) {
      return NextResponse.json(
        { error: "Crédits insuffisants" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { class_id, nb_tours = 6, template_ids } = body as {
      class_id?: string;
      nb_tours?: number;
      template_ids?: string[];
    };

    // Récupère et convertit les templates personnalisés si fournis
    let enterpriseTemplates: Array<{
      nom: string;
      type: string;
      couleur: string;
      icon: string;
      specialite: string;
      actifs: Array<{ nom: string; valeur: number }>;
      passifs: Array<{ nom: string; valeur: number }>;
      effetsPassifs: Array<unknown>;
      cartesLogistiquesDepart: Array<unknown>;
      cartesLogistiquesDisponibles: Array<unknown>;
      reducDelaiPaiement: number;
      clientGratuitParTour: number;
    }> | null = null;

    if (template_ids && template_ids.length > 0) {
      const { data: templates, error: templatesError } = await serviceClient
        .from("custom_enterprise_templates")
        .select("*")
        .in("id", template_ids)
        .eq("organization_id", profile.organization_id);

      if (templatesError) {
        console.error("Erreur récupération templates:", templatesError);
        await releaseCredit(creditId);
        return NextResponse.json(
          { error: "Impossible de récupérer les templates" },
          { status: 500 }
        );
      }

      if (templates && templates.length > 0) {
        enterpriseTemplates = templates.map((template: any) => ({
          nom: template.name,
          type: template.base_enterprise,
          couleur: template.couleur,
          icon: template.icon,
          specialite: template.specialite_label,
          actifs: [
            { nom: template.immo1_nom, valeur: template.immo1_valeur },
            { nom: template.immo2_nom, valeur: template.immo2_valeur },
            ...(template.autres_immo > 0
              ? [{ nom: "Autres immobilisations", valeur: template.autres_immo }]
              : []),
            { nom: "Stocks de marchandises", valeur: template.stocks },
            { nom: "Trésorerie", valeur: template.tresorerie },
          ],
          passifs: [
            { nom: "Capitaux propres", valeur: template.capitaux_propres },
            ...(template.emprunts > 0
              ? [{ nom: "Emprunt bancaire", valeur: template.emprunts }]
              : []),
            ...(template.dettes > 0
              ? [{ nom: "Dettes fournisseurs", valeur: template.dettes }]
              : []),
          ],
          effetsPassifs: [],
          cartesLogistiquesDepart: [],
          cartesLogistiquesDisponibles: [],
          reducDelaiPaiement: template.reduc_delai_paiement,
          clientGratuitParTour: template.client_gratuit_par_tour,
        }));
      }
    }

    // Génère un room code unique via la fonction SQL
    const { data: codeResult } = await serviceClient.rpc("generate_room_code");
    const roomCode = codeResult as string;

    // Crée la session
    const { data: session, error: insertError } = await serviceClient
      .from("game_sessions")
      .insert({
        teacher_id: user.id,
        organization_id: profile.organization_id,
        class_id: class_id ?? null,
        room_code: roomCode,
        status: "waiting",
        nb_tours,
        ...(enterpriseTemplates && { enterprise_templates: enterpriseTemplates }),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Erreur création session:", insertError);

      const creditRestored = await releaseCredit(creditId);
      if (!creditRestored) {
        console.error(
          "Impossible de restaurer le crédit après échec de création de session:",
          creditId
        );
      }

      return NextResponse.json(
        { error: "Impossible de créer la session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    console.error("Erreur API sessions POST:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── GET /api/sessions — Lister les sessions de l'enseignant ──
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: sessions, error } = await supabase
      .from("game_sessions")
      .select(`
        id, room_code, status, nb_tours, created_at, finished_at,
        classes(id, name),
        game_players(id, guest_name, entreprise, final_score, is_bankrupt, rank)
      `)
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur récupération sessions:", error);
      return NextResponse.json({ error: "Erreur lors de la récupération des sessions" }, { status: 500 });
    }

    return NextResponse.json({ sessions });
  } catch (err) {
    console.error("Erreur API sessions GET:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
