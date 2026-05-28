import { NextRequest, NextResponse } from "next/server";
import { getYoungAthletes, createYoungAthlete } from "@/lib/db";
import { YoungAthlete } from "@/lib/types";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    const youngAthletes = await getYoungAthletes();
    return NextResponse.json(youngAthletes);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ya: YoungAthlete = {
      id: `ya-${randomUUID()}`,
      prenom: body.prenom,
      nom: body.nom,
      dateNaissance: body.dateNaissance,
      discipline: body.discipline || "triathlon",
      contactParent: body.contactParent || "",
      telephoneParent: body.telephoneParent || "",
      statut: body.statut || "actif",
      createdAt: new Date().toISOString(),
    };
    const created = await createYoungAthlete(ya);
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
