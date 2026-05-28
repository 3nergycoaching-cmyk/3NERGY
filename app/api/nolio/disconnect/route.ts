import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/nolio/disconnect
 * Removes the global Nolio coach token and clears all Nolio-sourced events
 * and objectifs from all athletes.
 */
export async function POST() {
  try {
    // 1. Delete all Nolio events (raw SQL — no transaction needed)
    await prisma.$executeRaw`DELETE FROM "CalendarEvent" WHERE source = 'nolio'`;

    // 2. Clear Nolio objectifs from all athletes
    const athletes = await prisma.athlete.findMany({
      select: { id: true, objectifs: true },
    });

    for (const a of athletes as { id: string; objectifs: unknown }[]) {
      const objectifs = (a.objectifs as Array<{ source?: string }> | null) ?? [];
      if (objectifs.some((o) => o.source === "nolio")) {
        await prisma.athlete.update({
          where: { id: a.id },
          data: { objectifs: objectifs.filter((o) => o.source !== "nolio") as never },
        });
      }
    }

    // 3. Remove global coach token
    await prisma.$executeRaw`DELETE FROM app_config WHERE key = 'nolioCoachToken'`;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Nolio disconnect]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
