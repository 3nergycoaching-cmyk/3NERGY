"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wifi, WifiOff, RefreshCw, LogOut, AlertCircle } from "lucide-react";

interface Props {
  isConnected: boolean;
  hasError: boolean;
}

/**
 * Client-side action buttons for the Nolio connection status:
 *  - Connected: shows "Déconnecter Nolio" (with confirmation) + "Sync Nolio"
 *  - Not connected / error: shows "Connecter Nolio" (redirects to OAuth)
 */
export default function NolioConnectionActions({ isConnected, hasError }: Props) {
  const router = useRouter();
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/nolio/token", { method: "DELETE" });
      setConfirmDisconnect(false);
      router.refresh();
    } finally {
      setDisconnecting(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);
    try {
      const res = await fetch("/api/nolio/sync", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        const msg: string = json.error ?? "Erreur synchronisation";
        if (isAuthError(res.status, msg)) {
          // Token invalid → re-authenticate
          window.location.href = "/api/auth/nolio?returnTo=/equipe/nolio";
          return;
        }
        setSyncError(msg);
      } else {
        setSyncResult(
          `${json.totalCompetitions ?? 0} courses · ${json.matched ?? 0} athlètes · ${json.eventsAdded ?? 0} ajoutés`
        );
        router.refresh();
      }
    } catch {
      setSyncError("Erreur réseau");
    } finally {
      setSyncing(false);
    }
  }

  if (!isConnected || hasError) {
    return (
      <div className="flex items-center gap-3">
        {hasError && (
          <span className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
            <AlertCircle size={13} />
            Token expiré ou révoqué
          </span>
        )}
        <a
          href="/api/auth/nolio?returnTo=/equipe/nolio"
          className="flex items-center gap-2 bg-[#7c1d35] hover:bg-[#9b2445] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <Wifi size={15} />
          {hasError ? "Reconnecter Nolio" : "Connecter Nolio"}
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Sync feedback */}
      {syncResult && (
        <span className="text-xs text-emerald-600 font-medium bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
          {syncResult}
        </span>
      )}
      {syncError && (
        <span className="text-xs text-red-600 font-medium bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl">
          {syncError}
        </span>
      )}

      {/* Sync button */}
      <button
        onClick={handleSync}
        disabled={syncing || disconnecting}
        className="flex items-center gap-2 bg-[#7c1d35] hover:bg-[#9b2445] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
      >
        <RefreshCw size={15} className={syncing ? "animate-spin" : ""} />
        {syncing ? "Synchronisation…" : "Sync Nolio"}
      </button>

      {/* Disconnect */}
      {confirmDisconnect ? (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          <span className="text-xs text-red-700 font-medium">Confirmer la déconnexion ?</span>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-60"
          >
            {disconnecting ? "…" : "Déconnecter"}
          </button>
          <button
            onClick={() => setConfirmDisconnect(false)}
            className="text-xs text-gray-500 hover:text-gray-700 px-1.5"
          >
            Annuler
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDisconnect(true)}
          disabled={syncing || disconnecting}
          className="flex items-center gap-2 border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
        >
          <LogOut size={14} />
          Déconnecter
        </button>
      )}
    </div>
  );
}

function isAuthError(status: number, message: string): boolean {
  return (
    (status === 400 && message.toLowerCase().includes("token")) ||
    message.toLowerCase().includes("invalid_grant") ||
    message.toLowerCase().includes("refresh failed") ||
    message.toLowerCase().includes("non connecté") ||
    message.toLowerCase().includes("connectez")
  );
}
