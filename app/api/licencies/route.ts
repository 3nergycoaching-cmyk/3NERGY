import { NextRequest, NextResponse } from "next/server";
import { getLicencies, createLicencie } from "@/lib/db";
import { Licencie } from "@/lib/types";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    return NextResponse.json(await getLicencies());
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const licencie: Licencie = {
      id: `lic-${randomUUID()}`,
      prenom: body.prenom,
      nom: body.nom,
      email: body.email || "",
      telephone: body.telephone || "",
      adresse: body.adresse || undefined,
      dateLicence: body.dateLicence,
      numeroLicence: body.numeroLicence || undefined,
      discipline: body.discipline || undefined,
      statut: body.statut || "actif",
      createdAt: new Date().toISOString(),
    };
    return NextResponse.json(await createLicencie(licencie), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
