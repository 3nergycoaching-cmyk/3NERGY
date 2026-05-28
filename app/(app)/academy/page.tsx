import { readDB } from "@/lib/db";
import AcademyClient from "./AcademyClient";

export const dynamic = "force-dynamic";

export default async function AcademyPage() {
  const db = await readDB();
  return (
    <AcademyClient
      initialYoungAthletes={db.youngAthletes ?? []}
      initialSessions={db.academySessions ?? []}
      coaches={db.coaches}
    />
  );
}
