"use client";

import { useState } from "react";
import { RefreshCw, Wifi, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface SyncResult {
  nolioAthletes: number;
  matched: number;
  unmatched: number;
  totalCompetitions: number;
  eventsAdded: number;
  eventsUpdated: number;
  objectifsUpdated: number;
}

export default function SyncNolioButton() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/nolio/sync", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Erreur synchronisation");
        return;
      }
      setResult(json);
      router.refresh();
    } catch {
      setError("Erreur réseau");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Result toast */}
      {result && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium px-3 py-2 rounded-xl">
          <CheckCircle2 size={13} />
          {result.totalCompetitions} courses · {result.matched} athlètes matchés · {result.eventsAdded} nouveaux événements
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3 py-2 rounded-xl">
          <AlertCircle size={13} />
          {error}
        </div>
      )}

      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-2 bg-[#7c1d35] hover:bg-[#9b2445] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
      >
        {syncing ? (
          <RefreshCw size={15} className="animate-spin" />
        ) : (
          <Wifi size={15} />
        )}
        {syncing ? "Synchronisation..." : "Sync Nolio"}
      </button>
    </div>
  );
}
