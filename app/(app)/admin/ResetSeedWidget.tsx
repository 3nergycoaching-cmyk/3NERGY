"use client";

import { useState } from "react";
import { RotateCcw, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";

type Step = "idle" | "confirm1" | "confirm2" | "loading" | "done" | "error";

export default function ResetSeedWidget() {
  const [step, setStep] = useState<Step>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleConfirm() {
    setStep("loading");
    try {
      const res = await fetch("/api/admin/reset-seed", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Erreur inconnue");
      }
      setStep("done");
      // Hard reload after 1.5s so all server components get fresh data
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur inconnue");
      setStep("error");
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-red-50 flex items-center gap-3">
        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <RotateCcw className="w-4 h-4 text-red-600" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900 text-sm">Zone dangereuse</h2>
          <p className="text-xs text-gray-500">Actions irréversibles — à utiliser avec précaution</p>
        </div>
      </div>

      <div className="p-6">
        {step === "idle" && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Réinitialiser avec les données de démo</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Remplace toutes les données actuelles par le jeu de données fictives du fichier{" "}
                <code className="font-mono bg-gray-100 px-1 rounded text-xs">db.seed.json</code>.
                Cette opération est irréversible.
              </p>
            </div>
            <button
              onClick={() => setStep("confirm1")}
              className="ml-6 flex-shrink-0 flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
            >
              <RotateCcw size={14} />
              Réinitialiser
            </button>
          </div>
        )}

        {step === "confirm1" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Première confirmation requise</p>
                <p className="text-sm text-amber-800 mt-1">
                  Toutes les données actuelles (athlètes, leads, todos, séances, événements…) seront
                  définitivement supprimées et remplacées par les données fictives de démonstration.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep("confirm2")}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
              >
                Oui, je comprends — continuer
              </button>
              <button
                onClick={() => setStep("idle")}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {step === "confirm2" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">Dernière confirmation — action irréversible</p>
                <p className="text-sm text-red-800 mt-1">
                  Il n&apos;y a aucun retour en arrière possible. Êtes-vous absolument certain de vouloir
                  écraser toutes les données avec le seed de démonstration ?
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Confirmer la réinitialisation
              </button>
              <button
                onClick={() => setStep("idle")}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {step === "loading" && (
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin text-[#7c1d35]" />
            <span className="text-sm">Réinitialisation en cours…</span>
          </div>
        )}

        {step === "done" && (
          <div className="flex items-center gap-3 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">
              Réinitialisation réussie — rechargement de la page…
            </span>
          </div>
        )}

        {step === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-red-900 mb-1">Erreur lors de la réinitialisation</p>
            <p className="text-xs text-red-700 mb-3">{errorMsg}</p>
            <button
              onClick={() => setStep("idle")}
              className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
            >
              Réessayer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
