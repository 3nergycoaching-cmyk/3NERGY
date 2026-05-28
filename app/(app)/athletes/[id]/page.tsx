import { readDB } from "@/lib/db";
import { notFound } from "next/navigation";
import AthleteProfileClient from "./AthleteProfileClient";

export const dynamic = "force-dynamic";

export default async function AthleteProfilePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { nolio?: string };
}) {
  const db = await readDB();
  const athlete = db.athletes.find((a) => a.id === params.id);
  if (!athlete) notFound();

  const coach = db.coaches.find((c) => c.id === athlete.coachId);
  const taches = db.taches.filter((t) => t.athleteId === athlete.id);

  return (
    <AthleteProfileClient
      athlete={athlete}
      coach={coach}
      coaches={db.coaches}
      taches={taches}
      nolioStatus={searchParams.nolio as "connected" | "error" | undefined}
      nolioConnected={!!db.nolioCoachToken}
    />
  );
}
