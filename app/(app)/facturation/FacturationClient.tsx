"use client";

import { useState } from "react";
import { Athlete, Coach, StatutPaiement } from "@/lib/types";
import { CheckCircle2, CheckCircle, AlertCircle, Clock, Loader2, RefreshCw } from "lucide-react";

interface Props {
  athletes: Athlete[];
  coaches: Coach[];
}

// ── Calcul des parts ────────────────────────────────────────────────────────

function calcParts(a: Athlete, coaches: Coach[]) {
  const prix = a.prixMensuel ?? 0;
  const coach = coaches.find((c) => c.id === a.coachId);
  const coachPrenom = coach?.prenom ?? "";
  const viaAgence = a.canal === "GROWTH_OPERATOR";

  // Agence prend 30% sur le prix brut en premier
  const partAgence = viaAgence ? Math.round(prix * 0.30) : 0;

  let partCoach = 0;
  if (coachPrenom === "Kylian") {
    // Salarié, pas de commission par athlète
    partCoach = 0;
  } else if (viaAgence) {
    // Forfait standard tous coachs via Growth Operator : 50€ (200€) / 70€ (300€)
    partCoach = a.formule === "F300" ? 70 : 50;
  } else if (a.formule === "F300" || a.formule === "F200") {
    // Bonus recrutement direct (coach a ramené l'athlète sans agence) : 100€ / 70€
    partCoach = a.formule === "F300" ? 100 : 70;
  } else {
    // Base historique organique (anciennes formules 59-139€)
    if (coachPrenom === "Florent") partCoach = Math.round(prix * 0.45);
    else if (coachPrenom === "Rémi") partCoach = prix <= 69 ? 25 : prix === 99 ? 30 : 35;
  }

  const partASBL = prix - partCoach - partAgence;
  return { partCoach, partAgence, partASBL };
}

// ── Statut paiement badge statique (lecture seule) ───────────────────────────

function StatutBadgeStatic({ statut }: { statut: StatutPaiement }) {
  const base = "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold cursor-default";
  if (statut === "OK") return <span className={`${base} bg-emerald-50 text-emerald-700`}><CheckCircle size={11} /> Payé</span>;
  if (statut === "EN_RETARD") return <span className={`${base} bg-red-50 text-red-700`}><AlertCircle size={11} /> Retard</span>;
  return <span className={`${base} bg-slate-100 text-slate-500`}><Clock size={11} /> En attente</span>;
}

// ── Statut paiement badge cliquable ─────────────────────────────────────────

const CYCLE: StatutPaiement[] = ["EN_ATTENTE", "OK", "EN_RETARD"];
const currentMois = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

function StatutBadge({
  statut, moisPaiement, paiementUnique, athleteId, onUpdate,
}: {
  statut: StatutPaiement; moisPaiement?: string; paiementUnique?: number; athleteId: string;
  onUpdate: (id: string, s: StatutPaiement) => void;
}) {
  const [saving, setSaving] = useState(false);
  const mois = currentMois();
  // Paiement unique = toujours OK (pas de reset mensuel)
  const effectif: StatutPaiement = paiementUnique ? statut : (moisPaiement === mois ? statut : "EN_ATTENTE");

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = CYCLE[(CYCLE.indexOf(effectif) + 1) % CYCLE.length];
    setSaving(true);
    onUpdate(athleteId, next);
    await fetch(`/api/athletes/${athleteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statutPaiement: next, moisPaiement: mois }),
    });
    setSaving(false);
  };

  const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer select-none transition-all";
  if (saving) return <span className={`${base} bg-gray-100 text-gray-400`}><Loader2 size={11} className="animate-spin" /></span>;
  if (effectif === "OK") return (
    <span onClick={handleClick} className={`${base} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}>
      <CheckCircle2 size={11} /> Payé
    </span>
  );
  if (effectif === "EN_RETARD") return (
    <span onClick={handleClick} className={`${base} bg-red-50 text-red-700 hover:bg-red-100`}>
      <AlertCircle size={11} /> En retard
    </span>
  );
  return (
    <span onClick={handleClick} className={`${base} bg-amber-50 text-amber-700 hover:bg-amber-100`}>
      <Clock size={11} /> En attente
    </span>
  );
}

// ── Génère les N derniers mois (format YYYY-MM) ───────────────────────────────
function getRecentMonths(): string[] {
  const months: string[] = [];
  const now = new Date();
  const start = new Date(2026, 8, 1); // septembre 2026
  for (let d = new Date(now.getFullYear(), now.getMonth(), 1); d >= start; d.setMonth(d.getMonth() - 1)) {
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

function formatMoisLabel(m: string): string {
  const [y, mo] = m.split("-");
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

// ── Page principale ──────────────────────────────────────────────────────────

export default function FacturationClient({ athletes, coaches }: Props) {
  const moisCourant = currentMois();
  const moisOptions = getRecentMonths();

  const [selectedMois, setSelectedMois] = useState(moisCourant);
  const isCurrentMonth = selectedMois === moisCourant;

  const [overrides, setOverrides] = useState<Record<string, { statut: StatutPaiement; mois: string }>>({});
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ updated: number; invoicesChecked: number } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleFalcoSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);
    try {
      const res = await fetch("/api/sync/falco", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setSyncError(json.error ?? "Erreur inconnue");
      } else {
        setSyncResult({ updated: json.updated, invoicesChecked: json.invoicesChecked });
        // Apply updates optimistically so UI reflects immediately
        if (json.details?.length) {
          setOverrides((prev) => {
            const next = { ...prev };
            for (const d of json.details) {
              next[d.id] = { statut: "OK" as StatutPaiement, mois: currentMois() };
            }
            return next;
          });
        }
      }
    } catch {
      setSyncError("Impossible de contacter le serveur");
    } finally {
      setSyncing(false);
    }
  };
  const handleUpdate = (id: string, s: StatutPaiement) =>
    setOverrides((prev) => ({ ...prev, [id]: { statut: s, mois: moisCourant } }));

  const getEffectif = (a: Athlete): StatutPaiement => {
    if (a.paiementUnique) return a.statutPaiement ?? "OK"; // paiement unique = toujours OK
    // Mois passé → lecture seule depuis l'historique
    if (!isCurrentMonth) {
      return (a.paiementsHistorique?.[selectedMois] as StatutPaiement) ?? "EN_ATTENTE";
    }
    // Mois courant → overrides + moisPaiement courant
    if (overrides[a.id]) return overrides[a.id].mois === moisCourant ? overrides[a.id].statut : "EN_ATTENTE";
    return (a.moisPaiement === moisCourant ? a.statutPaiement : "EN_ATTENTE") ?? "EN_ATTENTE";
  };

  const getCoach = (id: string) => coaches.find((c) => c.id === id);

  // Totaux globaux
  const totalBrut = athletes.reduce((s, a) => s + (a.prixMensuel ?? 0), 0);
  let totalCoach = 0, totalAgence = 0, totalASBL = 0;
  athletes.forEach((a) => {
    const p = calcParts(a, coaches);
    totalCoach += p.partCoach;
    totalAgence += p.partAgence;
    totalASBL += p.partASBL;
  });

  // Stats paiements
  const payeCount = athletes.filter((a) => getEffectif(a) === "OK").length;
  const retardCount = athletes.filter((a) => getEffectif(a) === "EN_RETARD").length;
  const attenteCount = athletes.length - payeCount - retardCount;
  const totalPaye = athletes.filter((a) => getEffectif(a) === "OK").reduce((s, a) => s + (a.prixMensuel ?? 0), 0);

  // Résumé par entraîneur — commission due sur tous les athlètes actifs (indépendant du paiement)
  const byCoach: Record<string, { coach: Coach; count: number; total: number }> = {};
  athletes.forEach((a) => {
    const { partCoach } = calcParts(a, coaches);
    if (partCoach === 0) return;
    if (!byCoach[a.coachId]) byCoach[a.coachId] = { coach: coaches.find(c => c.id === a.coachId)!, count: 0, total: 0 };
    byCoach[a.coachId].count++;
    byCoach[a.coachId].total += partCoach;
  });

  const fmt = (n: number) => n.toLocaleString("fr-FR") + " €";
  const thCls = "text-left px-4 py-3 font-medium text-xs uppercase tracking-wide";

  // Tri : en retard → en attente → payé
  const ORDER: StatutPaiement[] = ["EN_RETARD", "EN_ATTENTE", "OK"];
  const sorted = [...athletes].sort((a, b) =>
    ORDER.indexOf(getEffectif(a)) - ORDER.indexOf(getEffectif(b))
  );

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold capitalize" style={{ color: "#0F172A" }}>Facturation</h1>
        <p className="text-sm mt-1" style={{ color: "#64748B" }}>{athletes.length} athlètes actifs payants</p>
      </div>

      {/* Section A — Paiements du mois */}
      <section>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold capitalize" style={{ color: "#0F172A" }}>Paiements</h2>
            {/* Sélecteur de mois */}
            <select
              value={selectedMois}
              onChange={(e) => setSelectedMois(e.target.value)}
              className="text-sm font-semibold px-3 py-1.5 rounded-lg border outline-none capitalize cursor-pointer"
              style={{ borderColor: "#E2E8F0", color: "#0F172A", backgroundColor: "#F8FAFC" }}
            >
              {moisOptions.map((m) => (
                <option key={m} value={m} className="capitalize">
                  {formatMoisLabel(m)}{m === moisCourant ? " (actuel)" : ""}
                </option>
              ))}
            </select>
            {!isCurrentMonth && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: "#FFF0F8", color: "#E6007E" }}>
                Lecture seule
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isCurrentMonth && syncResult && (
              <span className="text-xs" style={{ color: "#10B981" }}>
                ✓ {syncResult.updated} mis à jour ({syncResult.invoicesChecked} factures Falco)
              </span>
            )}
            {isCurrentMonth && syncError && (
              <span className="text-xs" style={{ color: "#DC2626" }}>{syncError}</span>
            )}
            {isCurrentMonth && (
              <button
                onClick={handleFalcoSync}
                disabled={syncing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-50"
                style={{ borderColor: "#E2E8F0", color: "#475569", backgroundColor: "#F8FAFC" }}
              >
                <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
                {syncing ? "Sync Falco…" : "Sync Falco"}
              </button>
            )}
            <span className="text-sm font-semibold" style={{ color: "#E6007E" }}>{totalPaye.toLocaleString("fr-FR")} € encaissés</span>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#F1F5F9" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${athletes.length ? (payeCount / athletes.length) * 100 : 0}%`, backgroundColor: "#10B981" }}
            />
          </div>
          <span className="text-sm font-semibold tabular-nums" style={{ color: "#0F172A" }}>{payeCount}/{athletes.length}</span>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-emerald-600 font-medium">{payeCount} payés</span>
            {retardCount > 0 && <span className="text-red-600 font-medium">{retardCount} en retard</span>}
            <span style={{ color: "#94A3B8" }}>{attenteCount} en attente</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "#E2E8F0", backgroundColor: "#F8FAFC", color: "#475569" }}>
                  <th className={thCls}>Athlète</th>
                  <th className={thCls}>Entraîneur</th>
                  <th className="text-right px-4 py-3 font-medium text-xs uppercase tracking-wide">Prix</th>
                  <th className="text-right px-4 py-3 font-medium text-xs uppercase tracking-wide">Part entraîneur</th>
                  <th className="text-right px-4 py-3 font-medium text-xs uppercase tracking-wide">Part ASBL</th>
                  <th className="px-4 py-3 font-medium text-xs uppercase tracking-wide">Paiement</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((a) => {
                  const coach = getCoach(a.coachId);
                  const { partCoach, partASBL } = calcParts(a, coaches);
                  const effectif = getEffectif(a);
                  const isPaid = effectif === "OK";
                  return (
                    <tr key={a.id} className="border-b transition-colors" style={{ borderColor: "#F1F5F9", opacity: isPaid ? 0.7 : 1 }}>
                      <td className="px-4 py-3 font-semibold text-sm" style={{ color: "#0F172A" }}>
                        {a.prenom} {a.nom}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#64748B" }}>
                        {coach && (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[9px] font-bold"
                              style={{ backgroundColor: coach.couleur }}>{coach.prenom.charAt(0)}</span>
                            {coach.prenom}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-sm" style={{ color: "#0F172A" }}>{fmt(a.prixMensuel)}</td>
                      <td className="px-4 py-3 text-right text-sm" style={{ color: partCoach > 0 ? "#0F172A" : "#94A3B8" }}>
                        {partCoach > 0 ? fmt(partCoach) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold" style={{ color: "#E6007E" }}>{fmt(partASBL)}</td>
                      <td className="px-4 py-3">
                        {isCurrentMonth ? (
                          <StatutBadge
                            statut={overrides[a.id]?.statut ?? a.statutPaiement ?? "EN_ATTENTE"}
                            moisPaiement={overrides[a.id]?.mois ?? a.moisPaiement}
                            paiementUnique={a.paiementUnique}
                            athleteId={a.id}
                            onUpdate={handleUpdate}
                          />
                        ) : (
                          // Mois passé — badge statique
                          <StatutBadgeStatic statut={getEffectif(a)} />
                        )}
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ backgroundColor: "#F8FAFC" }}>
                  <td colSpan={2} className="px-4 py-3 font-bold text-sm" style={{ color: "#0F172A" }}>Total</td>
                  <td className="px-4 py-3 text-right font-bold text-sm" style={{ color: "#0F172A" }}>{fmt(totalBrut)}</td>
                  <td className="px-4 py-3 text-right font-bold text-sm" style={{ color: "#0F172A" }}>{fmt(totalCoach)}</td>
                  <td className="px-4 py-3 text-right font-bold text-sm" style={{ color: "#E6007E" }}>{fmt(totalASBL)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section B — Résumé par entraîneur */}
      <section>
        <h2 className="text-lg font-bold mb-3" style={{ color: "#0F172A" }}>Résumé par entraîneur</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.values(byCoach).sort((a, b) => b.total - a.total).map(({ coach, count, total }) => (
            <div key={coach.id} className="bg-white rounded-2xl p-5 border flex items-center gap-4"
              style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: coach.couleur }}>
                {coach.prenom.charAt(0)}{coach.nom.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "#0F172A" }}>{coach.prenom} {coach.nom}</p>
                <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{count} athlète{count > 1 ? "s" : ""}</p>
                <p className="text-xl font-bold mt-1" style={{ color: coach.couleur }}>{fmt(total)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section C — Revenus ASBL */}
      <section>
        <h2 className="text-lg font-bold mb-3" style={{ color: "#0F172A" }}>Revenus ASBL</h2>
        <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Total brut", value: totalBrut, color: "#0F172A" },
              { label: "Commissions entraîneurs", value: -totalCoach, color: "#DC2626" },
              { label: "Commissions agence", value: -totalAgence, color: "#7C3AED" },
              { label: "Net ASBL", value: totalASBL, color: "#E6007E" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: "#64748B" }}>{label}</p>
                <p className="text-2xl font-bold" style={{ color }}>
                  {value < 0 ? "-" : ""}{fmt(Math.abs(value))}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
