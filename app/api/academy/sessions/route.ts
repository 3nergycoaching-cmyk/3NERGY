import { NextRequest, NextResponse } from "next/server";
import { getAcademySessions, createAcademySession } from "@/lib/db";
import { AcademySession } from "@/lib/types";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    const sessions = await getAcademySessions();
    return NextResponse.json(sessions);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session: AcademySession = {
      id: `as-${randomUUID()}`,
      date: body.date,
      entraineurId: body.entraineurId,
      discipline: body.discipline || "triathlon",
      lieu: body.lieu || "",
      presents: body.presents || [],
      notes: body.notes || undefined,
    };
    const created = await createAcademySession(session);
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
