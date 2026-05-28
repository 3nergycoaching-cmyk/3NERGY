import { NextRequest, NextResponse } from "next/server";
import { getInvitationByToken, updateInvitation, updateAthlete } from "@/lib/db";
import { OnboardingData } from "@/lib/types";
import { sendCompletionNotification } from "@/lib/resend";
import { SERVICE_TARIFS } from "@/lib/config";

type Params = { params: { token: string } };

/**
 * GET /api/onboarding/[token]
 * Returns invitation metadata for the public form to pre-fill name/email.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = params;
  const inv = await getInvitationByToken(token);

  if (!inv) {
    return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
  }

  if (inv.statut === "completed") {
    return NextResponse.json({ error: "Ce formulaire a déjà été complété." }, { status: 410 });
  }

  if (new Date() > new Date(inv.expiresAt)) {
    // Mark as expired lazily
    await updateInvitation(token, { statut: "expired" });
    return NextResponse.json({ error: "Ce lien d'invitation a expiré. Contacte ton coach." }, { status: 410 });
  }

  return NextResponse.json({
    prenom:    inv.prenom,
    nom:       inv.nom,
    email:     inv.email,
    expiresAt: inv.expiresAt,
  });
}

/**
 * POST /api/onboarding/[token]
 * Submits the completed form.
 * Updates the athlete record and marks invitation as completed.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const { token } = params;

  try {
    const inv = await getInvitationByToken(token);

    if (!inv) {
      return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
    }
    if (inv.statut === "completed") {
      return NextResponse.json({ error: "Ce formulaire a déjà été complété." }, { status: 410 });
    }
    if (new Date() > new Date(inv.expiresAt)) {
      await updateInvitation(token, { statut: "expired" });
      return NextResponse.json({ error: "Ce lien d'invitation a expiré." }, { status: 410 });
    }

    const data: OnboardingData = await req.json();

    // Determine service and price from formule
    const serviceMap: Record<string, "basic" | "performance" | "pro"> = {
      basic: "basic",
      performance: "performance",
      pro: "pro",
    };
    const service = serviceMap[data.formule] ?? "basic";
    const prixMensuel = SERVICE_TARIFS[service] ?? 69;

    // Update athlete with all onboarding data
    await updateAthlete(inv.athleteId, {
      nom:       data.nom,
      prenom:    data.prenom,
      email:     data.email,
      telephone: data.telephone,
      adresse:   `${data.adresse}, ${data.codePostal} ${data.localite}, ${data.pays}`,
      discipline: data.discipline as "triathlon" | "cyclisme" | "course_a_pied",
      service,
      prixMensuel,
      objectif:  data.objectifsSportifs,
      statut:    "actif",
      notes: [
        `Nationalité : ${data.nationalite}`,
        `Date de naissance : ${data.dateNaissance}`,
        `Contact urgence : ${data.contactUrgence}`,
        `Contraintes : ${data.contraintes}`,
        `Blessures/fragilités : ${data.historiquesBlessures}`,
        `Option visio : ${data.optionVisio ? "Oui (+30€)" : "Non"}`,
        `Licence LF3 : ${data.licenceLF3 === "oui" ? "Oui" : "Non"}`,
        `Photos/vidéos : ${data.acceptPhotos === "oui" ? "Accepté" : "Refusé"}`,
        `Inscrit via formulaire onboarding le ${new Date().toLocaleDateString("fr-FR")}`,
      ].join("\n"),
    });

    // Mark invitation as completed
    await updateInvitation(token, {
      statut:      "completed",
      completedAt: new Date().toISOString(),
    });

    // Send completion notification to 3NERGY
    try {
      await sendCompletionNotification({
        athletePrenom: data.prenom,
        athleteNom:    data.nom,
        formule:       data.formule,
        optionVisio:   data.optionVisio,
        licenceLF3:    data.licenceLF3,
      });
    } catch (emailErr) {
      console.error("[Onboarding] Notification email failed:", emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Onboarding submit]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
