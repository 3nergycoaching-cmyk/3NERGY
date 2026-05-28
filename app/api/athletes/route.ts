import { NextRequest, NextResponse } from "next/server";
import { getAthletes, createAthlete } from "@/lib/db";
import { Athlete } from "@/lib/types";

export async function GET() {
  try {
    const athletes = await getAthletes();
    return NextResponse.json(athletes);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const athlete: Athlete = {
      ...body,
      id: `ath-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const created = await createAthlete(athlete);
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
