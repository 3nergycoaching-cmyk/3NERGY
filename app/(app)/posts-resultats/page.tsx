import prisma from "@/lib/prisma";
import PostsResultatsClient from "./PostsResultatsClient";

export const dynamic = "force-dynamic";

export default async function PostsResultatsPage() {
  const events = await prisma.calendarEvent.findMany({
    where: { type: "competition" },
    include: { athlete: { select: { prenom: true, nom: true, discipline: true } } },
    orderBy: { dateDebut: "desc" },
    take: 100,
  });

  const competitions = events.map((e) => ({
    id: e.id,
    titre: e.titre,
    dateDebut: e.dateDebut,
    athleteId: e.athleteId ?? null,
    athleteNom: e.athlete ? `${e.athlete.prenom} ${e.athlete.nom}` : null,
    discipline: (e.athlete?.discipline ?? null) as string | null,
  }));

  return <PostsResultatsClient competitions={competitions} />;
}
