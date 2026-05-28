import { readDB } from "@/lib/db";
import CalendrierClient from "./CalendrierClient";

export const dynamic = "force-dynamic";

export default async function CalendrierPage() {
  const db = await readDB();

  // Auto-import athlete objectifs as competition events
  const objectifEvents = (db.athletes ?? []).flatMap((athlete) =>
    (athlete.objectifs ?? []).map((obj) => ({
      id: `obj-${obj.id}`,
      titre: `${obj.titre} — ${athlete.prenom} ${athlete.nom}`,
      type: "competition" as const,
      dateDebut: obj.date,
      source: "objectif" as const,
      refId: obj.id,
    }))
  );

  // Auto-import academy sessions
  const academyEvents = (db.academySessions ?? []).map((session) => {
    const coach = db.coaches.find((c) => c.id === session.entraineurId);
    return {
      id: `academy-${session.id}`,
      titre: `Séance Academy — ${session.lieu}`,
      type: "academy" as const,
      dateDebut: session.date,
      responsable: session.entraineurId,
      source: "academy" as const,
      refId: session.id,
      description: coach ? `Entraîneur : ${coach.prenom} ${coach.nom} · ${session.presents.length} présent(s)` : undefined,
    };
  });

  // Nolio events are stored in db.events with source: "nolio"
  // They are already included in db.events — no separate list needed.
  const nolioConnectedCount = db.nolioCoachToken ? 1 : 0;

  const allEvents = [
    ...(db.events ?? []),
    ...objectifEvents,
    ...academyEvents,
  ];

  return (
    <CalendrierClient
      initialEvents={allEvents}
      manualEvents={(db.events ?? []).filter((e) => e.source === "manual" || !e.source)}
      coaches={db.coaches}
      nolioConnectedCount={nolioConnectedCount}
    />
  );
}
