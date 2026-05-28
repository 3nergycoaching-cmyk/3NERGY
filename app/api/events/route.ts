import { NextRequest, NextResponse } from "next/server";
import { getEvents, createEvent } from "@/lib/db";
import { CalendarEvent } from "@/lib/types";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    const events = await getEvents();
    return NextResponse.json(events);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event: CalendarEvent = {
      id: `ev-${randomUUID()}`,
      titre: body.titre,
      type: body.type || "autre",
      dateDebut: body.dateDebut,
      dateFin: body.dateFin || undefined,
      responsable: body.responsable || undefined,
      description: body.description || undefined,
      participants: body.participants || undefined,
      source: body.source || "manual",
      refId: body.refId || undefined,
    };
    const created = await createEvent(event);
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
