import { readDB, getAthletes, getCoaches } from "@/lib/db";
import { getLastNDays } from "@/lib/utils";
import DashboardCharts from "@/components/DashboardCharts";
import { Athlete, Coach } from "@/lib/types";
import {
  Users, TrendingUp, CalendarClock, AlertCircle, Euro,
  Globe, CheckCircle2, Clock, UserPlus,
} from "lucide-react";

export const dynamic = "force-dynamic";

// ── Commission calc (miroir de FacturationClient) ──────────────────────────
function calcParts(a: Athlete, coaches: Coach[]) {
  const prix = a.prixMensuel ?? 0;
  const coach = coaches.find((c) => c.id === a.coachId);
  const prenom = coach?.prenom ?? "";
  const viaAgence = a.canal === "GROWTH_OPERATOR";
  // Agence prend 30% sur le prix brut en premier
  const partAgence = viaAgence ? Math.round(prix * 0.30) : 0;
  let partCoach = 0;
  if (prenom === "Kylian") {
    partCoach = 0;
  } else if (viaAgence) {
    partCoach = a.formule === "F300" ? 70 : 50;
  } else if (a.formule === "F300" || a.formule === "F200") {
    partCoach = a.formule === "F300" ? 100 : 70;
  } else {
    if (prenom === "Florent") partCoach = Math.round(prix * 0.45);
    else if (prenom === "Rémi") partCoach = prix <= 69 ? 25 : prix === 99 ? 30 : 35;
  }
  return { partCoach, partAgence, partASBL: prix - partCoach - partAgence };
}

export default async function DashboardPage() {
  const [db, athletes, coaches] = await Promise.all([readDB(), getAthletes(), getCoaches()]);

  const mois = new Date().toISOString().slice(0, 7);
  const moisLabel = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  // ── Athlètes ────────────────────────────────────────────────────────────
  const actifs = athletes.filter((a) => a.statut === "actif");
  const payants = actifs.filter((a) => (a.prixMensuel ?? 0) > 0);
  const activeYoung = (db.youngAthletes ?? []).filter((y) => y.statut === "actif");
  const activeLicencies = (db.licencies ?? []).filter((l) => l.statut === "actif");
  const communaute = actifs.length + activeYoung.length + activeLicencies.length;

  // ── Paiements du mois ────────────────────────────────────────────────────
  const getEffectif = (a: Athlete) =>
    a.paiementUnique ? (a.statutPaiement ?? "OK") : // paiement unique = toujours OK
    a.moisPaiement === mois ? (a.statutPaiement ?? "EN_ATTENTE") : "EN_ATTENTE";

  const payeCount = payants.filter((a) => getEffectif(a) === "OK").length;
  const retardCount = payants.filter((a) => getEffectif(a) === "EN_RETARD").length;
  const attenteCount = payants.length - payeCount - retardCount;
  const montantEncaisse = payants.filter((a) => getEffectif(a) === "OK").reduce((s, a) => s + (a.prixMensuel ?? 0), 0);

  // Non payés = EN_ATTENTE + EN_RETARD — top 5
  const nonPayes = payants
    .filter((a) => getEffectif(a) !== "OK")
    .sort((a, b) => (getEffectif(a) === "EN_RETARD" ? -1 : 1) - (getEffectif(b) === "EN_RETARD" ? -1 : 1))
    .slice(0, 5);

  // ── Finances ─────────────────────────────────────────────────────────────
  const totalBrut = payants.reduce((s, a) => s + (a.prixMensuel ?? 0), 0);
  let totalCoach = 0, totalAgence = 0, totalASBL = 0;
  payants.forEach((a) => {
    const p = calcParts(a, coaches);
    totalCoach += p.partCoach;
    totalAgence += p.partAgence;
    totalASBL += p.partASBL;
  });

  // ── Engagements à renouveler ─────────────────────────────────────────────
  const now = new Date();
  const in60 = new Date(); in60.setDate(in60.getDate() + 60);
  const expirations = actifs
    .filter((a) => a.dateFinEngagement && a.engagement && a.engagement !== "SANS_ENGAGEMENT")
    .map((a) => ({ ...a, fin: new Date(a.dateFinEngagement!) }))
    .filter((a) => a.fin >= now && a.fin <= in60)
    .sort((a, b) => a.fin.getTime() - b.fin.getTime())
    .slice(0, 5);

  // ── Leads ─────────────────────────────────────────────────────────────────
  const leads = db.leads ?? [];
  const leadsByStatut: Record<string, number> = {};
  const LEAD_LABELS: Record<string, string> = {
    a_contacter: "À contacter",
    appel_effectue: "Appel fait",
    en_reflexion: "En réflexion",
    demarches_admin: "Démarches admin",
    acompte_recu: "Acompte reçu",
    coaching_demarre: "Démarré",
    perdu: "Perdu",
  };
  leads.filter((l) => !l.converti && l.statut !== "perdu" && l.statut !== "coaching_demarre")
    .forEach((l) => { leadsByStatut[l.statut] = (leadsByStatut[l.statut] ?? 0) + 1; });
  const pipelineLeads = Object.entries(leadsByStatut)
    .map(([statut, count]) => ({ statut, label: LEAD_LABELS[statut] ?? statut, count }));
  const totalLeads = pipelineLeads.reduce((s, l) => s + l.count, 0);

  // ── Urgences ─────────────────────────────────────────────────────────────
  const in7 = new Date(); in7.setDate(in7.getDate() + 7);
  const urgentTaches = (db.taches ?? [])
    .filter((t) => {
      if (t.statut === "termine") return false;
      const d = new Date(t.deadline);
      return d >= now && d <= in7;
    }).slice(0, 5);

  // ── Derniers arrivants ───────────────────────────────────────────────────
  const derniersArrivants = [...athletes]
    .filter((a) => a.createdAt)
    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
    .slice(0, 5);

  // ── Chart ─────────────────────────────────────────────────────────────────
  const days = getLastNDays(30);
  const chartData = days.map((day) => ({
    date: day,
    label: new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(new Date(day)),
    athletes: athletes.filter((a) => a.createdAt?.split("T")[0] === day).length,
  }));

  // ── Entraîneurs ───────────────────────────────────────────────────────────
  const coachesAdultes = coaches.filter((c) => !c.role?.trim().toLowerCase().match(/^academy$/));
  const byCoach = coachesAdultes.map((coach) => {
    const mine = actifs.filter((a) => a.coachId === coach.id);
    const payesCoach = mine.filter((a) => getEffectif(a) === "OK").length;
    const commission = mine.reduce((s, a) => s + calcParts(a, coaches).partCoach, 0);
    return { coach, count: mine.length, payes: payesCoach, commission };
  }).filter((c) => c.count > 0);

  const fmt = (n: number) => n.toLocaleString("fr-FR") + " €";
  const pct = payants.length ? Math.round((payeCount / payants.length) * 100) : 0;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: "#0F172A" }}>Dashboard</h1>
        <p className="mt-1 text-sm capitalize" style={{ color: "#64748B" }}>
          {new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now)}
        </p>
      </div>

      {/* ── KPI row ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net ASBL */}
        <div className="bg-white rounded-2xl p-5 border col-span-2 lg:col-span-1 flex items-center gap-4"
          style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#FFF0F8" }}>
            <Euro className="w-5 h-5" style={{ color: "#E6007E" }} />
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: "#E6007E" }}>{fmt(totalASBL)}</p>
            <p className="text-sm font-medium" style={{ color: "#0F172A" }}>Net ASBL / mois</p>
            <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>brut {fmt(totalBrut)} · commissions {fmt(totalCoach + totalAgence)}</p>
          </div>
        </div>

        {/* Athlètes */}
        <div className="bg-white rounded-2xl p-5 border flex items-center gap-4"
          style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="rounded-xl p-3 flex-shrink-0" style={{ backgroundColor: "#F1F5F9" }}>
            <Users className="w-5 h-5" style={{ color: "#64748B" }} />
          </div>
          <div>
            <p className="text-3xl font-bold" style={{ color: "#0F172A" }}>{actifs.length}</p>
            <p className="text-sm font-medium" style={{ color: "#0F172A" }}>Athlètes actifs</p>
            <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>sur {athletes.length} total</p>
          </div>
        </div>

        {/* Leads */}
        <div className="bg-white rounded-2xl p-5 border flex items-center gap-4"
          style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="rounded-xl p-3 flex-shrink-0" style={{ backgroundColor: "#F1F5F9" }}>
            <TrendingUp className="w-5 h-5" style={{ color: "#64748B" }} />
          </div>
          <div>
            <p className="text-3xl font-bold" style={{ color: "#0F172A" }}>{totalLeads}</p>
            <p className="text-sm font-medium" style={{ color: "#0F172A" }}>Leads en cours</p>
            <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>dans le pipeline</p>
          </div>
        </div>

        {/* Communauté */}
        <div className="bg-white rounded-2xl p-5 border flex items-center gap-4"
          style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="rounded-xl p-3 flex-shrink-0" style={{ backgroundColor: "#F1F5F9" }}>
            <Globe className="w-5 h-5" style={{ color: "#64748B" }} />
          </div>
          <div>
            <p className="text-3xl font-bold" style={{ color: "#0F172A" }}>{communaute}</p>
            <p className="text-sm font-medium" style={{ color: "#0F172A" }}>Communauté</p>
            <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{actifs.length} suivis · {activeYoung.length} academy · {activeLicencies.length} licenciés</p>
          </div>
        </div>
      </div>

      {/* ── Paiements + Engagements ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Paiements du mois */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border"
          style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold capitalize" style={{ color: "#0F172A" }}>Paiements — {moisLabel}</h2>
              <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>Mis à jour via Falco</p>
            </div>
            <span className="text-lg font-bold" style={{ color: "#E6007E" }}>{fmt(montantEncaisse)}</span>
          </div>

          {/* Barre */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: "#F1F5F9" }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: pct === 100 ? "#10B981" : pct > 60 ? "#F59E0B" : "#E6007E" }} />
            </div>
            <span className="text-sm font-bold tabular-nums" style={{ color: "#0F172A" }}>{pct}%</span>
          </div>

          {/* Compteurs */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { icon: CheckCircle2, label: "Payés", val: payeCount, color: "#10B981", bg: "#F0FDF4" },
              { icon: Clock, label: "En attente", val: attenteCount, color: "#F59E0B", bg: "#FFFBEB" },
              { icon: AlertCircle, label: "En retard", val: retardCount, color: "#DC2626", bg: "#FEF2F2" },
            ].map(({ icon: Icon, label, val, color, bg }) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ backgroundColor: bg }}>
                <Icon size={16} className="mx-auto mb-1" style={{ color }} />
                <p className="text-2xl font-bold" style={{ color }}>{val}</p>
                <p className="text-xs font-medium" style={{ color }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Non payés */}
          {nonPayes.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#94A3B8" }}>À relancer</p>
              <div className="space-y-1.5">
                {nonPayes.map((a) => {
                  const coach = coaches.find((c) => c.id === a.coachId);
                  const isRetard = getEffectif(a) === "EN_RETARD";
                  return (
                    <div key={a.id} className="flex items-center justify-between px-3 py-2 rounded-xl"
                      style={{ backgroundColor: "#F8FAFC" }}>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: isRetard ? "#DC2626" : "#F59E0B" }} />
                        <span className="text-sm font-medium" style={{ color: "#0F172A" }}>
                          {a.prenom} {a.nom}
                        </span>
                        {coach && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: coach.couleur, fontSize: "10px" }}>
                            {coach.prenom.charAt(0)}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold" style={{ color: "#0F172A" }}>{fmt(a.prixMensuel ?? 0)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Engagements à renouveler */}
        <div className="bg-white rounded-2xl p-6 border"
          style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="w-5 h-5" style={{ color: "#F59E0B" }} />
            <h2 className="text-lg font-bold" style={{ color: "#0F172A" }}>Engagements 60j</h2>
          </div>
          {expirations.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm" style={{ color: "#64748B" }}>Aucun engagement</p>
              <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>dans les 60 prochains jours</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expirations.map((a) => {
                const daysLeft = Math.ceil((a.fin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const isUrgent = daysLeft <= 14;
                return (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-xl"
                    style={{ backgroundColor: isUrgent ? "#FEF2F2" : "#F8FAFC" }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#0F172A" }}>{a.prenom} {a.nom}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>
                        {a.fin.toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: isUrgent ? "#FEE2E2" : "#FEF3C7",
                        color: isUrgent ? "#DC2626" : "#D97706",
                      }}>
                      J-{daysLeft}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Chart + Colonne droite ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border"
          style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: "#0F172A" }}>Nouveaux athlètes — 30 derniers jours</h2>
          <DashboardCharts data={chartData} />
        </div>

        <div className="flex flex-col gap-6">
          {/* Derniers arrivants */}
          <div className="bg-white rounded-2xl p-6 border"
            style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5" style={{ color: "#E6007E" }} />
              <h2 className="text-lg font-bold" style={{ color: "#0F172A" }}>Derniers arrivants</h2>
            </div>
            {derniersArrivants.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: "#64748B" }}>Aucun athlète encore</p>
            ) : (
              <div className="space-y-2">
                {derniersArrivants.map((a) => {
                  const coach = coaches.find((c) => c.id === a.coachId);
                  const dateArrivee = new Date(a.createdAt!);
                  const isThisWeek = (now.getTime() - dateArrivee.getTime()) < 7 * 24 * 60 * 60 * 1000;
                  return (
                    <div key={a.id} className="flex items-center justify-between px-3 py-2 rounded-xl"
                      style={{ backgroundColor: "#F8FAFC" }}>
                      <div className="flex items-center gap-2 min-w-0">
                        {coach && (
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: coach.couleur }}>
                            {coach.prenom.charAt(0)}
                          </span>
                        )}
                        <span className="text-sm font-medium truncate" style={{ color: "#0F172A" }}>
                          {a.prenom} {a.nom}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        {isThisWeek && (
                          <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: "#FFF0F8", color: "#E6007E" }}>New</span>
                        )}
                        <span className="text-xs tabular-nums" style={{ color: "#94A3B8" }}>
                          {dateArrivee.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Urgences semaine */}
          <div className="bg-white rounded-2xl p-6 border"
            style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold" style={{ color: "#0F172A" }}>Urgences semaine</h2>
            </div>
            {urgentTaches.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: "#64748B" }}>Aucune urgence 🎉</p>
            ) : (
              <ul className="space-y-2">
                {urgentTaches.map((t) => {
                  const proj = db.projets?.find((p) => p.id === t.projetId);
                  const daysLeft = Math.ceil((new Date(t.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <li key={t.id} className="flex items-start gap-3 p-3 rounded-xl border"
                      style={{ backgroundColor: "#F8FAFC", borderColor: "#E2E8F0" }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "#0F172A" }}>{t.titre}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{proj?.nom || "—"}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                        daysLeft <= 2 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      }`}>J-{daysLeft}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ── Pipeline leads ────────────────────────────────────────────────────── */}
      {pipelineLeads.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border"
          style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: "#0F172A" }}>Pipeline leads</h2>
            <span className="text-sm font-semibold px-3 py-1 rounded-full"
              style={{ backgroundColor: "#F1F5F9", color: "#475569" }}>{totalLeads} en cours</span>
          </div>
          <div className="flex items-end gap-3">
            {pipelineLeads.map(({ statut, label, count }, i) => {
              const maxCount = Math.max(...pipelineLeads.map((l) => l.count));
              const heightPct = Math.max(20, Math.round((count / maxCount) * 100));
              const COLORS = ["#E6007E", "#9333EA", "#3B82F6", "#06B6D4", "#10B981"];
              const color = COLORS[i % COLORS.length];
              return (
                <div key={statut} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-lg font-bold" style={{ color }}>{count}</span>
                  <div className="w-full rounded-t-lg transition-all"
                    style={{ height: `${heightPct * 0.6}px`, backgroundColor: color, opacity: 0.85 }} />
                  <span className="text-xs text-center leading-tight" style={{ color: "#64748B" }}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Entraîneurs ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border"
        style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: "#0F172A" }}>Entraîneurs</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {byCoach.map(({ coach, count, payes, commission }) => (
            <div key={coach.id} className="rounded-2xl p-4 border"
              style={{ borderColor: "#E2E8F0", backgroundColor: "#F8FAFC" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: coach.couleur }}>
                  {coach.prenom.charAt(0)}{coach.nom.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "#0F172A" }}>{coach.prenom}</p>
                  <p className="text-xs" style={{ color: "#64748B" }}>{count} athlètes</p>
                </div>
              </div>
              {/* Mini barre paiements */}
              <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ backgroundColor: "#E2E8F0" }}>
                <div className="h-full rounded-full"
                  style={{ width: `${count ? Math.round((payes / count) * 100) : 0}%`, backgroundColor: coach.couleur }} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: "#64748B" }}>{payes}/{count} payés</span>
                {commission > 0 && <span className="font-semibold" style={{ color: "#0F172A" }}>{fmt(commission)}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
