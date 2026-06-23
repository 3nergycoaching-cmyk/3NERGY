import prisma from "@/lib/prisma";
import PostsResultatsClient from "./PostsResultatsClient";

export const dynamic = "force-dynamic";

/** Map Nolio raw sport name → CRM discipline key */
function nolioSportToKey(sport: string | null | undefined): string | null {
  if (!sport) return null;
  const s = sport.toLowerCase();
  if (s.includes("triathlon") || s.includes("duathlon") || s.includes("aquathlon")) return "triathlon";
  if (
    s.includes("vélo") || s.includes("velo") || s.includes("cycl") ||
    s.includes("route") || s.includes("vtt") || s.includes("bike") || s.includes("mtb")
  ) return "cyclisme";
  if (
    s.includes("course") || s.includes("running") || s.includes("trail") ||
    s.includes("pied") || s.includes("run") || s.includes("marathon") || s.includes("km")
  ) return "course_a_pied";
  return "autre";
}

export default async function PostsResultatsPage() {
  const events = await prisma.calendarEvent.findMany({
    where: { type: "competition" },
    select: {
      id: true,
      titre: true,
      dateDebut: true,
      athleteId: true,
      sport: true,
      athlete: { select: { prenom: true, nom: true } },
    },
    orderBy: { dateDebut: "desc" },
    take: 100,
  });

  const competitions = events.map((e) => ({
    id: e.id,
    titre: e.titre,
    dateDebut: e.dateDebut,
    athleteId: e.athleteId ?? null,
    athleteNom: e.athlete ? `${e.athlete.prenom} ${e.athlete.nom}` : null,
    // Discipline from the EVENT's own sport field, never from athlete profile
    sport: e.sport ?? null,
    discipline: nolioSportToKey(e.sport),
  }));

  return <PostsResultatsClient competitions={competitions} />;
}
