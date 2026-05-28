import { NextRequest, NextResponse } from "next/server";
import { getProjets, createProjet } from "@/lib/db";
import { Projet } from "@/lib/types";

export async function GET() {
  try {
    const projets = await getProjets();
    return NextResponse.json(projets);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const projet: Projet = {
      ...body,
      id: `proj-${Date.now()}`,
    };
    const created = await createProjet(projet);
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
