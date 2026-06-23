import { NextRequest, NextResponse } from "next/server";
import { fetchNolioCompetitions } from "@/lib/nolio";
import { getAthleteById } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { Objectif, DistanceObjectif } from "@/lib/types";

// Heuristic: map Nolio name to DistanceObjectif
function inferDistance(name: string): DistanceObjectif {
  const n = name.toLowerCase();
  if (n.includes("ironman") || n.includes("iron man")) return "Ironman";
  if (n.includes("70.3") || n.includes("half")) return "70.3";
  if (n.includes("olympic") || n.includes("olympi")) return "Olympic";
  if (n.includes("sprint")) return "Sprint";
  if (n.includes("marathon") && !n.includes("semi") && !n.includes("half")) return "Marathon";
  if (n.includes("semi") || n.includes("half marathon") || n.includes("21")) return "Semi";
  if (n.includes("10km") || n.includes("10 km") || n.includes("10k")) return "10km";
  if (n.includes("5km") || n.includes("5 km") || n.includes("5k")) return "5km";
  return "Autre";
}

/**
 * POST /api/nolio/sync/[athleteId]
 * Legacy per-athlete sync — uses the global coach token.
 * Prefer POST /api/nolio/sync for bulk sync.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { athleteId: string } }
) {
  const { athleteId } = params;

  const athlete = await getAthleteById(athleteId);
  if (!athlete) {
    return NextResponse.json({ error: "Athlète introuvable" }, { status: 404 });
  }

  // Use global coach token (per-athlete tokens are deprecated)
  const tokenConfig = await prisma.appConfig.findUnique({ where: { key: "nolioCoachToken" } });
  if (!tokenConfig) {
    return NextResponse.json(
      { error: "Nolio non connecté. Configurez le token coach depuis une fiche athlète." },
      { status: 400 }
    );
  }

  const token = tokenConfig.value as unknown as Parameters<typeof fetchNolioCompetitions>[0];

  try {
    const { events: incoming, updatedToken } =
      await fetchNolioCompetitions(token, athleteId);

    // Persist refreshed token if it changed
    if (updatedToken.accessToken !== token.accessToken) {
      await prisma.appConfig.update({
        where: { key: "nolioCoachToken" },
        data:  { value: updatedToken as never },
      });
    }

    let added   = 0;
    let updated = 0;

    // ── 1. Upsert CalendarEvents ──────────────────────────────────────────────
    for (const ev of incoming) {
      if (!ev.refId) continue;

      const existing = await prisma.calendarEvent.findFirst({
        where: { refId: ev.refId, source: "nolio" },
        select: { id: true },
      });

      if (existing) {
        await prisma.calendarEvent.update({
          where: { id: existing.id },
          data:  {
            titre: ev.titre, dateDebut: ev.dateDebut, dateFin: ev.dateFin ?? null,
            sport: (ev as { sport?: string }).sport ?? null,
            athleteId,
          },
        });
        updated++;
      } else {
        await prisma.calendarEvent.create({
          data: {
            id:        `nolio-${ev.refId}-${Date.now()}`,
            titre:     ev.titre,
            type:      (ev.type ?? "competition") as never,
            dateDebut: ev.dateDebut,
            dateFin:   ev.dateFin ?? null,
            sport:     (ev as { sport?: string }).sport ?? null,
            source:    "nolio",
            refId:     ev.refId,
            athleteId,
          },
        });
        added++;
      }
    }

    // ── 2. Upsert athlete.objectifs (Nolio races) ─────────────────────────────
    const athleteRow = await prisma.athlete.findUnique({
      where:  { id: athleteId },
      select: { objectifs: true },
    });

    if (athleteRow) {
      const existing      = (athleteRow.objectifs as Objectif[] | null) ?? [];
      const manualObjfs   = existing.filter((o) => o.source !== "nolio");
      const nolioObjfs: Objectif[] = incoming.map((ev) => ({
        id:       ev.refId ?? `nolio-obj-${Date.now()}`,
        titre:    ev.titre,
        date:     ev.dateDebut,
        distance: inferDistance(ev.titre),
        source:   "nolio" as const,
      }));

      const merged = [...manualObjfs, ...nolioObjfs].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      await prisma.athlete.update({
        where: { id: athleteId },
        data:  { objectifs: merged as never },
      });
    }

    return NextResponse.json({
      success: true,
      added,
      updated,
      total: incoming.length,
      athleteName: `${athlete.prenom} ${athlete.nom}`,
    });
  } catch (err) {
    console.error("[Nolio per-athlete sync]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur synchronisation" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/nolio/sync/[athleteId]
 * Removes Nolio objectifs + optionally calendar events for one athlete.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { athleteId: string } }
) {
  const { athleteId } = params;
  const removeEvents = req.nextUrl.searchParams.get("removeEvents") === "true";

  // Clear Nolio objectifs for this athlete
  const athleteRow = await prisma.athlete.findUnique({
    where:  { id: athleteId },
    select: { objectifs: true },
  });

  if (athleteRow) {
    const filtered = ((athleteRow.objectifs as Objectif[] | null) ?? [])
      .filter((o) => o.source !== "nolio");
    await prisma.athlete.update({
      where: { id: athleteId },
      data:  { objectifs: filtered as never },
    });
  }

  if (removeEvents) {
    await prisma.$executeRaw`DELETE FROM "CalendarEvent" WHERE source = 'nolio' AND "athleteId" = ${athleteId}`;
  }

  return NextResponse.json({ success: true });
}
