import { readDB } from "@/lib/db";
import { fetchNolioAthletes, getValidToken } from "@/lib/nolio";
import { Wifi, AlertCircle } from "lucide-react";
import Link from "next/link";
import NolioTable from "./NolioTable";

export const dynamic = "force-dynamic";

export interface NolioEntry {
  nolio_id: number;
  name: string; // email
}

export default async function NolioAthletesPage() {
  const db = await readDB();

  const coachToken = db.nolioCoachToken;

  let nolioAthletes: NolioEntry[] = [];
  let fetchError: string | null = null;

  if (coachToken) {
    try {
      const validToken = await getValidToken(coachToken);

      // Persist refreshed token if changed
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

  // Build initial nolioId → crmAthleteId map from db
  const initialLinks: Record<number, string> = {};
  for (const a of db.athletes) {
    if (a.nolioId) initialLinks[a.nolioId] = a.id;
  }

  // Also include email-based links so the table can show them
  const emailLinks: Record<string, string> = {};
  for (const a of db.athletes) {
    if (a.email) emailLinks[a.email.toLowerCase().trim()] = a.id;
  }

  const linkedCount   = nolioAthletes.filter((n) => !!initialLinks[n.nolio_id]).length;
  const unlinkedCount = nolioAthletes.length - linkedCount;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
          <Link href="/equipe" className="hover:text-[#7c1d35] transition-colors">Équipe</Link>
          <span>/</span>
          <span className="text-[#1a1218] font-medium">Athlètes Nolio</span>
        </div>
        <h1 className="text-3xl font-bold text-[#1a1218] flex items-center gap-3">
          <Wifi className="w-7 h-7 text-[#7c1d35]" />
          Athlètes Nolio
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {nolioAthletes.length} athlètes dans le compte Nolio ·{" "}
          <span className="text-emerald-600 font-medium">{linkedCount} liés</span> ·{" "}
          <span className="text-amber-600 font-medium">{unlinkedCount} non liés</span>
        </p>
      </div>

      {!coachToken && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 text-sm text-amber-700">
          <AlertCircle size={18} />
          Aucun token Nolio trouvé. Connectez un compte Nolio depuis une fiche athlète.
        </div>
      )}

      {fetchError && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-5 mb-6 text-sm text-red-700">
          <AlertCircle size={18} />
          Erreur API Nolio : {fetchError}
        </div>
      )}

      {nolioAthletes.length > 0 && (
        <NolioTable
          nolioAthletes={nolioAthletes}
          crmAthletes={db.athletes}
          coaches={db.coaches}
          initialLinks={initialLinks}
          emailLinks={emailLinks}
        />
      )}
    </div>
  );
}
