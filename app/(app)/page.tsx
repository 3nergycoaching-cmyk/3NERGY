import { readDB } from "@/lib/db";
import { getLast14Days } from "@/lib/utils";
import DashboardCharts from "@/components/DashboardCharts";
import { SERVICE_LABELS, SERVICE_ORDER } from "@/lib/config";
import { Users, TrendingUp, CalendarClock, FolderKanban, AlertCircle, Euro, Globe } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const db = await readDB();

  const activeAthletes = db.athletes.filter((a) => a.statut === "actif");
  const activeYoung = (db.youngAthletes ?? []).filter((y) => y.statut === "actif");
  const activeLicencies = (db.licencies ?? []).filter((l) => l.statut === "actif");
  const totalCommunaute = activeAthletes.length + activeYoung.length + activeLicencies.length;

  const ongoingLeads = db.leads.filter(
    (l) => l.statut !== "coaching_demarre" && l.statut !== "perdu" && !l.converti
  );
  const pauseAthletes = db.athletes.filter((a) => a.statut === "pause");
  const activeProjects = db.projets.filter((p) => p.statut === "en_cours");

  // Athletes per coach
  const athletesByCoach = db.coaches.map((coach) => ({
    coach,
    count: db.athletes.filter(
      (a) => a.coachId === coach.id && a.statut === "actif"
    ).length,
  }));

  // ── Financial calculations ──────────────────────────────────────────────────
  // Revenus = somme des prixMensuel des athlètes ACTIFS uniquement.

  const activeAthletesFin = db.athletes.filter(
    (a) => a.statut === "actif" && (a.prixMensuel ?? 0) > 0
  );
  const currentRevenue = activeAthletesFin.reduce((sum, a) => sum + (a.prixMensuel ?? 0), 0);

  // Service breakdown — groupé par service, prix réel par athlète
  const serviceStats = SERVICE_ORDER.map((svc) => {
    const group = activeAthletesFin.filter((a) => a.service === svc);
    if (group.length === 0) return null;
    const revenue = group.reduce((sum, a) => sum + (a.prixMensuel ?? 0), 0);
    const avgPrix = Math.round(revenue / group.length);
    return {
      key: svc,
      label: SERVICE_LABELS[svc] ?? svc,
      count: group.length,
      revenue,
      avgPrix,
    };
  }).filter(Boolean) as { key: string; label: string; count: number; revenue: number; avgPrix: number }[];

  // 14-day new athletes
  const days = getLast14Days();
  const chartData = days.map((day) => ({
    date: day,
    label: new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(new Date(day)),
    athletes: db.athletes.filter(
      (a) => a.createdAt.split("T")[0] === day
    ).length,
  }));

  // Urgencies: tasks with deadline in next 7 days
  const now = new Date();
  const in7 = new Date();
  in7.setDate(in7.getDate() + 7);
  const urgentTaches = db.taches
    .filter((t) => {
      if (t.statut === "termine") return false;
      const d = new Date(t.deadline);
      return d >= now && d <= in7;
    })
    .slice(0, 6);

  const kpis = [
    {
      label: "Athlètes actifs",
      value: activeAthletes.length,
      icon: Users,
      color: "bg-[#7c1d35]",
      sub: `sur ${db.athletes.length} total`,
    },
    {
      label: "Leads en cours",
      value: ongoingLeads.length,
      icon: TrendingUp,
      color: "bg-[#e8648a]",
      sub: "dans le pipeline",
    },
    {
      label: "En pause",
      value: pauseAthletes.length,
      icon: CalendarClock,
      color: "bg-amber-500",
      sub: "athlètes en pause",
    },
    {
      label: "Projets actifs",
      value: activeProjects.length,
      icon: FolderKanban,
      color: "bg-violet-600",
      sub: "en cours",
    },
    {
      label: "Communauté",
      value: totalCommunaute,
      icon: Globe,
      color: "bg-teal-600",
      sub: `${activeAthletes.length} coachés · ${activeYoung.length} academy · ${activeLicencies.length} licenciés`,
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1a1218]">Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {kpis.map(({ label, value, icon: Icon, color, sub }) => (
          <div
            key={label}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start gap-4"
          >
            <div className={`${color} rounded-xl p-3 flex-shrink-0`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-[#1a1218]">{value}</p>
              <p className="text-sm font-medium text-[#1a1218] mt-0.5">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4 text-[#1a1218]">Nouveaux athlètes — 14 derniers jours</h2>
          <DashboardCharts data={chartData} />
        </div>

        {/* Urgencies */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-[#1a1218]">Urgences de la semaine</h2>
          </div>
          {urgentTaches.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Aucune urgence cette semaine 🎉</p>
          ) : (
            <ul className="space-y-3">
              {urgentTaches.map((t) => {
                const proj = db.projets.find((p) => p.id === t.projetId);
                const daysLeft = Math.ceil(
                  (new Date(t.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <li key={t.id} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1a1218] truncate">{t.titre}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{proj?.nom || "—"}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                      daysLeft <= 2 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      J-{daysLeft}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Athletes by Coach */}
      <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold mb-4 text-[#1a1218]">Athlètes par coach</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {athletesByCoach.map(({ coach, count }) => (
            <div key={coach.id} className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: coach.couleur }}
              >
                {coach.prenom.charAt(0)}{coach.nom.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-sm text-[#1a1218]">{coach.prenom}</p>
                <p className="text-2xl font-bold" style={{ color: coach.couleur }}>{count}</p>
                <p className="text-xs text-gray-400">athlètes</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Aperçu financier ────────────────────────────────────────────────── */}
      <div className="mt-6">
        <h2 className="text-xl font-bold text-[#1a1218] mb-4">Aperçu financier</h2>

        {/* KPI — revenus actuels uniquement */}
        <div className="bg-[#7c1d35] rounded-2xl p-6 shadow-sm mb-6 flex items-center gap-5">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Euro className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-4xl font-bold text-white">{currentRevenue.toLocaleString("fr-FR")} €</p>
            <p className="text-white/80 text-sm font-medium mt-0.5">Revenus mensuels actuels</p>
            <p className="text-white/50 text-xs mt-0.5">{activeAthletesFin.length} athlètes actifs</p>
          </div>
        </div>

        {/* Répartition par service */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-[#1a1218] mb-4">Répartition par service</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left pb-2 font-medium">Service</th>
                <th className="text-right pb-2 font-medium">Athlètes actifs</th>
                <th className="text-right pb-2 font-medium">Prix moyen</th>
                <th className="text-right pb-2 font-medium">Total mensuel</th>
              </tr>
            </thead>
            <tbody>
              {serviceStats.map((s) => (
                <tr key={s.key} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 font-medium text-[#1a1218]">{s.label}</td>
                  <td className="py-2.5 text-right text-gray-600">{s.count}</td>
                  <td className="py-2.5 text-right text-gray-400">{s.avgPrix} €</td>
                  <td className="py-2.5 text-right font-semibold text-[#1a1218]">{s.revenue.toLocaleString("fr-FR")} €</td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td className="py-2.5 px-1 font-bold text-[#1a1218] rounded-l-xl">Total</td>
                <td className="py-2.5 text-right font-bold text-[#1a1218]">{activeAthletesFin.length}</td>
                <td />
                <td className="py-2.5 text-right font-bold text-[#7c1d35] rounded-r-xl">{currentRevenue.toLocaleString("fr-FR")} €</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
