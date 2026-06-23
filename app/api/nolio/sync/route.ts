import { NextResponse } from "next/server";
import { fetchAllAthletesCompetitions } from "@/lib/nolio";
import { prisma } from "@/lib/prisma";
import { Objectif, DistanceObjectif, NolioToken } from "@/lib/types";

// Heuristic: Nolio competition name + sport → DistanceObjectif
function inferDistance(name: string, sport?: string): DistanceObjectif {
  const n = name.toLowerCase();
  const s = (sport ?? "").toLowerCase();

  if (n.includes("ironman") || n.includes("iron man")) return "Ironman";
  if (n.includes("70.3") || n.includes("half ironman")) return "70.3";
  if (n.includes("olympic") || n.includes("olympi")) return "Olympic";
  if (n.includes("sprint") && (s.includes("triathlon") || n.includes("tri"))) return "Sprint";
  if (n.includes("marathon") && !n.includes("semi") && !n.includes("half")) return "Marathon";
  if (n.includes("semi") || n.includes("half marathon") || n.includes("21km") || n.includes("21 km")) return "Semi";
  if (n.includes("10km") || n.includes("10 km") || n.includes("10k")) return "10km";
  if (n.includes("5km") || n.includes("5 km") || n.includes("5k")) return "5km";
  if (s.includes("triathlon")) return "Olympic";
  return "Autre";
}

/**
 * POST /api/nolio/sync
 *
 * Full bulk sync across all matched Nolio athletes:
 *  1. Reads the global nolioCoachToken from AppConfig
 *  2. Fetches all Nolio athletes via GET /get/athletes/
 *  3. Resolves CRM match: nolioId (priority) > email (fallback)
 *  4. For each MATCHED athlete, fetches their competitions (200ms delay between calls)
 *  5. Upserts CalendarEvent rows + athlete.objectifs for each match
 */
export async function POST() {
  try {
    // ── 1. Get global coach token ──────────────────────────────────────────────
    const tokenConfig = await prisma.appConfig.findUnique({
      where: { key: "nolioCoachToken" },
    });

    if (!tokenConfig) {
      return NextResponse.json(
        { error: "Aucun token Nolio trouvé. Connectez d'abord le compte coach Nolio depuis une fiche athlète." },
        { status: 400 }
      );
    }

    const nolioToken = tokenConfig.value as unknown as NolioToken;

    // ── 2. Build lookup maps ───────────────────────────────────────────────────
    const athletes = await prisma.athlete.findMany({
      select: { id: true, nolioId: true, email: true },
    });

    const nolioIdToCrmId = new Map<number, string>();
    const emailToCrmId   = new Map<string, string>();
    for (const a of athletes) {
      if (a.nolioId) nolioIdToCrmId.set(a.nolioId, a.id);
      if (a.email)   emailToCrmId.set(a.email.toLowerCase().trim(), a.id);
    }

    // ── 3. Fetch competitions for all matched athletes ─────────────────────────
    const { results, updatedToken } = await fetchAllAthletesCompetitions(
      nolioToken,
      emailToCrmId,
      nolioIdToCrmId,
    );

    // Persist refreshed token if it changed
    if (updatedToken.accessToken !== nolioToken.accessToken) {
      await prisma.appConfig.update({
        where: { key: "nolioCoachToken" },
        data:  { value: updatedToken as never },
      });
    }

    let eventsAdded      = 0;
    let eventsUpdated    = 0;
    let objectifsUpdated = 0;
    let matched          = 0;
    let noCompetitions   = 0;

    for (const athleteResult of results) {
      if (!athleteResult.crmAthleteId) continue;

      if (!athleteResult.competitions.length) {
        noCompetitions++;
        continue;
      }

      matched++;
      const ownerCrmId = athleteResult.crmAthleteId;

      // ── Upsert CalendarEvents ────────────────────────────────────────────────
      for (const ev of athleteResult.competitions) {
        if (!ev.refId) continue;

        const existing = await prisma.calendarEvent.findFirst({
          where: { refId: ev.refId, source: "nolio" },
          select: { id: true },
        });

        if (existing) {
          await prisma.calendarEvent.update({
            where: { id: existing.id },
            data: {
              titre:       ev.titre,
              type:        (ev.type ?? "competition") as never,
              dateDebut:   ev.dateDebut,
              dateFin:     ev.dateFin   ?? null,
              description: ev.description ?? null,
              sport:       (ev as { sport?: string }).sport ?? null,
              athleteId:   ownerCrmId,
            },
          });
          eventsUpdated++;
        } else {
          await prisma.calendarEvent.create({
            data: {
              id:          `nolio-${ev.refId}-${Date.now()}`,
              titre:       ev.titre,
              type:        (ev.type ?? "competition") as never,
              dateDebut:   ev.dateDebut,
              dateFin:     ev.dateFin   ?? null,
              description: ev.description ?? null,
              sport:       (ev as { sport?: string }).sport ?? null,
              source:      "nolio",
              refId:       ev.refId,
              athleteId:   ownerCrmId,
            },
          });
          eventsAdded++;
        }
      }

      // ── Upsert athlete.objectifs ─────────────────────────────────────────────
      const athleteRow = await prisma.athlete.findUnique({
        where:  { id: ownerCrmId },
        select: { objectifs: true },
      });

      if (athleteRow) {
        const existing = (athleteRow.objectifs as Objectif[] | null) ?? [];
        const manualObjectifs = existing.filter((o) => o.source !== "nolio");

        const nolioObjectifs: Objectif[] = athleteResult.competitions.map((ev) => ({
          id:       ev.refId ?? `nolio-obj-${Date.now()}`,
          titre:    ev.titre,
          date:     ev.dateDebut,
          distance: inferDistance(ev.titre, ev.description ?? ""),
          source:   "nolio" as const,
        }));

        const merged = [...manualObjectifs, ...nolioObjectifs].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        await prisma.athlete.update({
          where: { id: ownerCrmId },
          data:  { objectifs: merged as never },
        });

        objectifsUpdated++;
      }
    }

    const totalComps = results.reduce((s, r) => s + r.competitions.length, 0);

    console.log(
      `[Nolio sync] matched=${matched}, noCompetitions=${noCompetitions}, ` +
      `eventsAdded=${eventsAdded}, eventsUpdated=${eventsUpdated}`
    );

    return NextResponse.json({
      success: true,
      nolioAthletes:    results.length,
      matched,
      noCompetitions,
      totalCompetitions: totalComps,
      eventsAdded,
      eventsUpdated,
      objectifsUpdated,
    });
  } catch (err) {
    console.error("[Nolio bulk sync]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur synchronisation" },
      { status: 500 }
    );
  }
}
