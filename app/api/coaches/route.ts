import { NextRequest, NextResponse } from "next/server";
import { getCoaches, createCoach } from "@/lib/db";
import { Coach } from "@/lib/types";

export async function GET() {
  try {
    const coaches = await getCoaches();
    return NextResponse.json(coaches);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const coach: Coach = {
      ...body,
      id: `coach-${Date.now()}`,
    };
    const created = await createCoach(coach);
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
