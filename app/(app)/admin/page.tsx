import { readDB } from "@/lib/db";
import Badge from "@/components/Badge";
import ResetSeedWidget from "./ResetSeedWidget";
import { FileText, Users, CheckCircle, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const db = await readDB();

  const activeAthletes = db.athletes.filter((a) => a.statut === "actif");
  const pauseAthletes = db.athletes.filter((a) => a.statut === "pause");
  const archivedAthletes = db.athletes.filter((a) => a.statut === "archive");

  const totalBasic = db.athletes.filter((a) => a.statut === "actif" && a.service === "basic").length;
  const totalPerformance = db.athletes.filter((a) => a.statut === "actif" && a.service === "performance").length;
  const totalPro = db.athletes.filter((a) => a.statut === "actif" && a.service === "pro").length;
  const totalGratuit = db.athletes.filter((a) => a.statut === "actif" && a.service === "gratuit").length;
  const totalAutre = db.athletes.filter((a) => a.statut === "actif" && a.service === "autre").length;

  const getCoach = (id: string) => {
    const c = db.coaches.find((c) => c.id === id);
    return c ? `${c.prenom} ${c.nom}` : "—";
  };

  // Athletes per coach
  const coachStats = db.coaches.map((coach) => ({
    coach,
    total: db.athletes.filter((a) => a.coachId === coach.id).length,
    actifs: db.athletes.filter((a) => a.coachId === coach.id && a.statut === "actif").length,
  }));

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1a1218]">Administration</h1>
        <p className="text-gray-500 text-sm mt-1">Vue d&apos;ensemble des contrats et de l&apos;équipe</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold">{activeAthletes.length}</p>
          <p className="text-sm text-gray-500">Athlètes actifs</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-bold">{pauseAthletes.length}</p>
          <p className="text-sm text-gray-500">En pause</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-gray-500" />
            </div>
          </div>
          <p className="text-2xl font-bold">{archivedAthletes.length}</p>
          <p className="text-sm text-gray-500">Archivés</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-[#7c1d35]/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#7c1d35]" />
            </div>
          </div>
          <p className="text-2xl font-bold">{db.athletes.length}</p>
          <p className="text-sm text-gray-500">Athlètes total</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Répartition services */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-[#1a1218] mb-4">Répartition des services (actifs)</h2>
          <div className="space-y-3">
            <ServiceBar label="Pro" count={totalPro} total={activeAthletes.length} color="bg-[#7c1d35]" />
            <ServiceBar label="Performance" count={totalPerformance} total={activeAthletes.length} color="bg-indigo-500" />
            <ServiceBar label="Basic" count={totalBasic} total={activeAthletes.length} color="bg-gray-400" />
            <ServiceBar label="Gratuit" count={totalGratuit} total={activeAthletes.length} color="bg-sky-400" />
            <ServiceBar label="Autre" count={totalAutre} total={activeAthletes.length} color="bg-slate-300" />
          </div>
        </div>

        {/* Répartition par coach */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-[#1a1218] mb-4">Charge par coach</h2>
          <div className="space-y-3">
            {coachStats.map(({ coach, total, actifs }) => (
              <div key={coach.id} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: coach.couleur }}
                >
                  {coach.prenom.charAt(0)}{coach.nom.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{coach.prenom} {coach.nom}</span>
                    <span className="text-xs text-gray-500">{actifs} actifs / {total} total</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${db.athletes.length > 0 ? (total / db.athletes.length) * 100 : 0}%`, backgroundColor: coach.couleur }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Zone dangereuse */}
      <div className="mb-6">
        <ResetSeedWidget />
      </div>

      {/* Tous les athlètes */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-bold text-[#1a1218]">Tous les athlètes actifs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Athlète</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Coach</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Service</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Discipline</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Statut</th>
              </tr>
            </thead>
            <tbody>
              {activeAthletes.map((athlete) => (
                <tr key={athlete.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{athlete.prenom} {athlete.nom}</p>
                    <p className="text-xs text-gray-400">{athlete.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{getCoach(athlete.coachId)}</td>
                  <td className="px-4 py-3"><Badge value={athlete.service} type="service" /></td>
                  <td className="px-4 py-3"><Badge value={athlete.discipline} type="discipline" /></td>
                  <td className="px-4 py-3"><Badge value={athlete.statut} type="statut_athlete" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ServiceBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-bold">{count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
