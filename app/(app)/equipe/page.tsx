import { readDB } from "@/lib/db";
import { fetchNolioAthletes, getValidToken } from "@/lib/nolio";
import EquipeClient from "./EquipeClient";

export const dynamic = "force-dynamic";

export interface NolioEntry {
  nolio_id: number;
  name: string;
}

export default async function EquipePage() {
  const db = await readDB();

  let nolioAthletes: NolioEntry[] = [];
  let fetchError: string | null = null;
  const coachToken = db.nolioCoachToken;

  if (coachToken) {
    try {
      const validToken = await getValidToken(coachToken);
      if (validToken.accessToken !== coachToken.accessToken) {
        const { writeDB } = await import("@/lib/db");
        db.nolioCoachToken = validToken;
        await writeDB(db);
      }
      const raw = await fetchNolioAthletes(validToken);
      nolioAthletes = raw.map((r) => ({ nolio_id: r.nolio_id, name: String(r.name) }));
    } catch (err) {
      fetchError = err instanceof Error ? err.message : "Erreur API Nolio";
    }
  }

  const initialLinks: Record<number, string> = {};
  for (const a of db.athletes) {
    if (a.nolioId) initialLinks[a.nolioId] = a.id;
  }
  const emailLinks: Record<string, string> = {};
  for (const a of db.athletes) {
    if (a.email) emailLinks[a.email.toLowerCase().trim()] = a.id;
  }

  return (
    <EquipeClient
      coaches={db.coaches}
      athletes={db.athletes}
      nolioAthletes={nolioAthletes}
      fetchError={fetchError}
      isConnected={!!coachToken && !fetchError}
      hasError={!!coachToken && !!fetchError}
      initialLinks={initialLinks}
      emailLinks={emailLinks}
    />
  );
}
