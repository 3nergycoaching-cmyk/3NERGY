"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Athlete, Coach, StatutPaiement, Canal } from "@/lib/types";
import { Search, Plus, Mail, Loader2, X, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import NewAthleteModal from "./NewAthleteModal";

interface Props {
  athletes: Athlete[];
  coaches: Coach[];
}

const CANAL_LABELS: Record<Canal, string> = {
  ORGANIQUE: "Organique",
  GROWTH_OPERATOR: "Growth op.",
};

const ENGAGEMENT_LABELS: Record<string, string> = {
  SANS_ENGAGEMENT: "Libre",
  M3: "3 mois",
  M6: "6 mois",
  M9: "9 mois",
  M12: "12 mois",
};

function daysUntil(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const STATUT_CYCLE: StatutPaiement[] = ["EN_ATTENTE", "OK", "EN_RETARD"];
const currentMois = () => new Date().toISOString().slice(0, 7); // "YYYY-MM"

function StatutBadge({
  statut, moisPaiement, athleteId, onUpdate,
}: {
  statut: StatutPaiement; moisPaiement?: string; athleteId: string;
  onUpdate: (id: string, s: StatutPaiement) => void;
}) {
  const [saving, setSaving] = useState(false);

  // Si le paiement a été validé un mois passé → considérer EN_ATTENTE pour ce mois
  const mois = currentMois();
  const effectif: StatutPaiement = moisPaiement === mois ? statut : "EN_ATTENTE";

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = STATUT_CYCLE[(STATUT_CYCLE.indexOf(effectif) + 1) % STATUT_CYCLE.length];
    setSaving(true);
    onUpdate(athleteId, next);
    await fetch(`/api/athletes/${athleteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statutPaiement: next, moisPaiement: mois }),
    });
    setSaving(false);
  };

  const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer select-none transition-opacity";
  if (saving) return <span className={`${base} opacity-50 bg-gray-100 text-gray-500`}><Loader2 size={11} className="animate-spin" /> …</span>;
  if (effectif === "OK") return (
    <span onClick={handleClick} title="Cliquer pour changer" className={`${base} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}>
      <CheckCircle2 size={11} /> OK
    </span>
  );
  if (effectif === "EN_RETARD") return (
    <span onClick={handleClick} title="Cliquer pour changer" className={`${base} bg-red-50 text-red-700 hover:bg-red-100`}>
      <AlertCircle size={11} /> En retard
    </span>
  );
  return (
    <span onClick={handleClick} title="Cliquer pour changer" className={`${base} bg-amber-50 text-amber-700 hover:bg-amber-100`}>
      <Clock size={11} /> En attente
    </span>
  );
}

function EngagementFinBadge({ dateFinEngagement }: { dateFinEngagement?: string }) {
  const days = daysUntil(dateFinEngagement);
  if (days === null || days > 30) return null;
  if (days < 0) return (
    <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">Expiré</span>
  );
  return (
    <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700">J-{days}</span>
  );
}

export default function AthletesClient({ athletes, coaches }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"historique" | "nouveau">("historique");
  const [search, setSearch] = useState("");
  const [filterCoach, setFilterCoach] = useState("");
  const [filterCanal, setFilterCanal] = useState<Canal | "">("");
  const [filterStatutPaiement, setFilterStatutPaiement] = useState<StatutPaiement | "">("");
  const [showModal, setShowModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ prenom: "", nom: "", email: "", coachId: coaches[0]?.id ?? "" });
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ formUrl: string; prenom: string } | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Athlete | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [statutOverrides, setStatutOverrides] = useState<Record<string, { statut: StatutPaiement; mois: string }>>({});

  const handleStatutUpdate = (id: string, s: StatutPaiement) => {
    setStatutOverrides((prev) => ({ ...prev, [id]: { statut: s, mois: new Date().toISOString().slice(0, 7) } }));
  };

  const closeMenu = useCallback(() => setOpenMenuId(null), []);
  useEffect(() => {
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, [closeMenu]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.prenom || !inviteForm.nom || !inviteForm.email || !inviteForm.coachId) return;
    setInviting(true);
    setInviteError(null);
    try {
      const res = await fetch("/api/onboarding/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });
      const json = await res.json();
      if (!res.ok) { setInviteError(json.error ?? "Erreur"); return; }
      setInviteResult({ formUrl: json.formUrl, prenom: inviteForm.prenom });
      router.refresh();
    } catch { setInviteError("Erreur réseau"); }
    finally { setInviting(false); }
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setInviteResult(null);
    setInviteError(null);
    setInviteForm({ prenom: "", nom: "", email: "", coachId: coaches[0]?.id ?? "" });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/athletes/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      router.refresh();
    } finally { setDeleting(false); }
  };

  const getCoach = (id: string) => coaches.find((c) => c.id === id);

  const activeAthletes = athletes.filter((a) => a.statut === "actif");
  const tabAthletes = activeAthletes.filter((a) =>
    tab === "historique" ? a.regime === "HISTORIQUE" : a.regime === "STANDARD"
  );

  const filtered = tabAthletes
    .filter((a) => {
      const q = search.toLowerCase();
      return (
        (!q || `${a.prenom} ${a.nom}`.toLowerCase().includes(q)) &&
        (!filterCoach || a.coachId === filterCoach) &&
        (!filterCanal || a.canal === filterCanal) &&
        (!filterStatutPaiement || a.statutPaiement === filterStatutPaiement)
      );
    })
    .sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, "fr"));

  const histCount = activeAthletes.filter((a) => a.regime === "HISTORIQUE").length;
  const nouvCount = activeAthletes.filter((a) => a.regime === "STANDARD").length;

  const inputCls = "text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E6007E]/20 focus:border-[#E6007E] bg-white";

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "#0F172A" }}>Athlètes</h1>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>{activeAthletes.length} actifs</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 border border-[#E6007E] text-[#E6007E] hover:bg-[#E6007E]/5 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors">
            <Mail size={16} /> Inviter
          </button>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#E6007E] hover:bg-[#C00069] text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors">
            <Plus size={16} /> Nouvel athlète
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white border border-slate-200 rounded-2xl p-1 w-fit">
        {([
          { key: "historique", label: "Historiques", count: histCount },
          { key: "nouveau", label: "Nouvelles formules", count: nouvCount },
        ] as const).map(({ key, label, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
            style={tab === key
              ? { backgroundColor: "#E6007E", color: "#fff" }
              : { color: "#64748B" }}>
            {label}
            <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs"
              style={tab === key ? { backgroundColor: "rgba(255,255,255,0.25)" } : { backgroundColor: "#F1F5F9" }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 mb-4 flex flex-wrap gap-3 items-center"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="Rechercher..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 ${inputCls}`} />
        </div>
        <select value={filterCoach} onChange={(e) => setFilterCoach(e.target.value)} className={inputCls}>
          <option value="">Tous les entraîneurs</option>
          {coaches.map((c) => <option key={c.id} value={c.id}>{c.prenom}</option>)}
        </select>
        {tab === "nouveau" && (
          <select value={filterCanal} onChange={(e) => setFilterCanal(e.target.value as Canal | "")} className={inputCls}>
            <option value="">Tous les canaux</option>
            <option value="ORGANIQUE">Organique</option>
            <option value="GROWTH_OPERATOR">Growth operator</option>
          </select>
        )}
        <select value={filterStatutPaiement} onChange={(e) => setFilterStatutPaiement(e.target.value as StatutPaiement | "")} className={inputCls}>
          <option value="">Tous les paiements</option>
          <option value="OK">OK</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="EN_RETARD">En retard</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide" style={{ color: "#475569" }}>
                <th className="text-left px-4 py-3 font-medium">Nom</th>
                <th className="text-left px-4 py-3 font-medium">Coach</th>
                <th className="text-left px-4 py-3 font-medium">Discipline</th>
                <th className="text-right px-4 py-3 font-medium">Prix/mois</th>
                {tab === "nouveau" && <th className="text-left px-4 py-3 font-medium">Canal</th>}
                {tab === "nouveau" && <th className="text-left px-4 py-3 font-medium">Engagement</th>}
                {tab === "nouveau" && <th className="text-left px-4 py-3 font-medium">Début</th>}
                {tab === "nouveau" && <th className="text-left px-4 py-3 font-medium">Fin</th>}
                <th className="text-left px-4 py-3 font-medium">Paiement</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-sm" style={{ color: "#64748B" }}>Aucun athlète</td></tr>
              ) : filtered.map((a) => {
                const coach = getCoach(a.coachId);
                const daysLeft = daysUntil(a.dateFinEngagement);
                return (
                  <tr key={a.id}
                    onClick={() => router.push(`/athletes/${a.id}`)}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-semibold" style={{ color: "#0F172A" }}>
                      {a.prenom} {a.nom}
                    </td>
                    <td className="px-4 py-3" style={{ color: "#64748B" }}>
                      {coach ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[9px] font-bold"
                            style={{ backgroundColor: coach.couleur }}>
                            {coach.prenom.charAt(0)}
                          </span>
                          {coach.prenom}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 capitalize" style={{ color: "#64748B" }}>
                      {a.discipline?.replace("_", " ") ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: "#0F172A" }}>
                      {a.prixMensuel ? `${a.prixMensuel} €` : "—"}
                    </td>
                    {tab === "nouveau" && (
                      <td className="px-4 py-3" style={{ color: "#64748B" }}>
                        {a.canal ? CANAL_LABELS[a.canal] : "—"}
                      </td>
                    )}
                    {tab === "nouveau" && (
                      <td className="px-4 py-3" style={{ color: "#64748B" }}>
                        {a.engagement ? ENGAGEMENT_LABELS[a.engagement] ?? a.engagement : "—"}
                      </td>
                    )}
                    {tab === "nouveau" && (
                      <td className="px-4 py-3 text-xs" style={{ color: "#64748B" }}>
                        {a.dateDebut ? new Date(a.dateDebut).toLocaleDateString("fr-FR") : "—"}
                      </td>
                    )}
                    {tab === "nouveau" && (
                      <td className="px-4 py-3 text-xs" style={{ color: "#64748B" }}>
                        {a.dateFinEngagement
                          ? <>{new Date(a.dateFinEngagement).toLocaleDateString("fr-FR")}<EngagementFinBadge dateFinEngagement={a.dateFinEngagement} /></>
                          : "—"}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <StatutBadge
                        statut={statutOverrides[a.id]?.statut ?? a.statutPaiement ?? "EN_ATTENTE"}
                        moisPaiement={statutOverrides[a.id]?.mois ?? a.moisPaiement}
                        athleteId={a.id}
                        onUpdate={handleStatutUpdate}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal nouvel athlète */}
      {showModal && (
        <NewAthleteModal coaches={coaches} onClose={() => { setShowModal(false); router.refresh(); }} onCreated={() => { setShowModal(false); router.refresh(); }} />
      )}

      {/* Modal invitation */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: "#0F172A" }}>Inviter un athlète</h2>
              <button onClick={closeInviteModal}><X size={20} className="text-gray-400" /></button>
            </div>
            {inviteResult ? (
              <div className="space-y-4">
                <p className="text-sm text-green-700 bg-green-50 rounded-xl p-3">Invitation envoyée à {inviteResult.prenom} !</p>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Lien du formulaire</p>
                  <p className="text-sm font-mono break-all text-[#E6007E]">{inviteResult.formUrl}</p>
                </div>
                <button onClick={closeInviteModal} className="w-full bg-[#E6007E] text-white rounded-xl py-2.5 font-semibold text-sm">Fermer</button>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Prénom *" value={inviteForm.prenom} onChange={(e) => setInviteForm(f => ({ ...f, prenom: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E6007E]/20 focus:border-[#E6007E]" />
                  <input placeholder="Nom *" value={inviteForm.nom} onChange={(e) => setInviteForm(f => ({ ...f, nom: e.target.value }))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E6007E]/20 focus:border-[#E6007E]" />
                </div>
                <input placeholder="Email *" type="email" value={inviteForm.email} onChange={(e) => setInviteForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E6007E]/20 focus:border-[#E6007E]" />
                <select value={inviteForm.coachId} onChange={(e) => setInviteForm(f => ({ ...f, coachId: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E6007E]/20 focus:border-[#E6007E] bg-white">
                  {coaches.map((c) => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                </select>
                {inviteError && <p className="text-sm text-red-600">{inviteError}</p>}
                <button type="submit" disabled={inviting}
                  className="w-full bg-[#E6007E] hover:bg-[#C00069] text-white rounded-xl py-2.5 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                  {inviting && <Loader2 size={16} className="animate-spin" />}
                  Envoyer l'invitation
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold mb-2" style={{ color: "#0F172A" }}>Supprimer {deleteTarget.prenom} {deleteTarget.nom} ?</h2>
            <p className="text-sm mb-4" style={{ color: "#64748B" }}>Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-medium">Annuler</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2">
                {deleting && <Loader2 size={14} className="animate-spin" />} Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
