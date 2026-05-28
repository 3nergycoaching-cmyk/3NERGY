import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { createAthlete, createInvitation } from "@/lib/db";
import { getCoachById } from "@/lib/db";
import { sendInvitationEmail } from "@/lib/resend";
import { Athlete, OnboardingInvitation } from "@/lib/types";
import { SERVICE_TARIFS } from "@/lib/config";

/**
 * POST /api/onboarding/invite
 * Body: { prenom, nom, email, coachId }
 *
 * 1. Pre-creates athlete with statut "en_attente"
 * 2. Creates OnboardingInvitation with 7-day expiry
 * 3. Sends invitation email via Resend
 */
export async function POST(req: NextRequest) {
  try {
    const { prenom, nom, email, coachId } = await req.json();

    if (!prenom || !nom || !email || !coachId) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    // Find coach
    const coach = await getCoachById(coachId);
    if (!coach) {
      return NextResponse.json({ error: "Coach introuvable" }, { status: 404 });
    }

    // Pre-create athlete with minimal data
    const athleteId = `ath-${Date.now()}`;
    const newAthlete: Athlete = {
      id: athleteId,
      nom,
      prenom,
      email,
      telephone: "",
      discipline: "triathlon",
      coachId,
      statut: "en_attente",
      objectif: "",
      service: "basic",
      prixMensuel: SERVICE_TARIFS["basic"],
      notes: "",
      createdAt: new Date().toISOString(),
    };

    await createAthlete(newAthlete);

    // Create invitation
    const token = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const invitation: OnboardingInvitation = {
      token,
      athleteId,
      prenom,
      nom,
      email,
      coachId,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      statut: "pending",
    };

    await createInvitation(invitation);

    // Send email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3001";
    const formUrl = `${baseUrl}/onboarding/${token}`;

    try {
      await sendInvitationEmail({
        to: email,
        prenom,
        nom,
        coachPrenom: coach.prenom,
        coachNom: coach.nom,
        formUrl,
      });
    } catch (emailErr) {
      console.error("[Onboarding] Email send failed:", emailErr);
      // Don't fail the whole request — invitation is created, email can be resent
    }

    return NextResponse.json({
      success: true,
      token,
      athleteId,
      formUrl,
    });
  } catch (err) {
    console.error("[Onboarding invite]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }
}
