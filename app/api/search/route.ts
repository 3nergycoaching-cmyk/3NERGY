import { NextRequest, NextResponse } from "next/server";
import { getAthletes, getLeads } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.toLowerCase() || "";
    if (!q) return NextResponse.json({ athletes: [], leads: [] });

    const [athletes, leads] = await Promise.all([getAthletes(), getLeads()]);

    const filteredAthletes = athletes.filter(
      (a) =>
        a.nom.toLowerCase().includes(q) ||
        a.prenom.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q)
    );
    const filteredLeads = leads.filter(
      (l) =>
        l.nom.toLowerCase().includes(q) ||
        l.prenom.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q)
    );

    return NextResponse.json({ athletes: filteredAthletes, leads: filteredLeads });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
