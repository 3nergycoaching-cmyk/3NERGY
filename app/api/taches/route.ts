import { NextRequest, NextResponse } from "next/server";
import { getTaches, createTache } from "@/lib/db";
import { Tache } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projetId = searchParams.get("projetId");
    const taches = await getTaches();
    const filtered = projetId ? taches.filter((t) => t.projetId === projetId) : taches;
    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tache: Tache = {
      ...body,
      id: `tache-${Date.now()}`,
    };
    const created = await createTache(tache);
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
