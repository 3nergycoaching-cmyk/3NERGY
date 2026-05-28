import { NextRequest, NextResponse } from "next/server";
import { getLeads, createLead } from "@/lib/db";
import { Lead } from "@/lib/types";

export async function GET() {
  try {
    const leads = await getLeads();
    return NextResponse.json(leads);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const lead: Lead = {
      ...body,
      id: `lead-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const created = await createLead(lead);
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
