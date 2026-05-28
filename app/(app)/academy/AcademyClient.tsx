"use client";

import { useState } from "react";
import { YoungAthlete, AcademySession, Coach, Discipline } from "@/lib/types";
import {
  GraduationCap, Plus, Trash2, Edit2, Save, X, Users, CalendarDays,
  UserCheck, ChevronDown, ChevronUp,
} from "lucide-react";
import Badge from "@/components/Badge";

interface Props {
  initialYoungAthletes: YoungAthlete[];
  initialSessions: AcademySession[];
  coaches: Coach[];
}

const DISCIPLINE_LABELS: Record<Discipline, string> = {
  triathlon: "Triathlon",
  cyclisme: "Cyclisme",
  course_a_pied: "Course à pied",
  autre: "Autre",
};

function calcAge(dateNaissance: string): number {
  const birth = new Date(dateNaissance);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

type Tab = "jeunes" | "presences" | "entraineurs";

// ── Blank forms ──────────────────────────────────────────────────────────────
const blankYA = (): Omit<YoungAthlete, "id" | "createdAt"> => ({
  prenom: "",
  nom: "",
  dateNaissance: "",
  discipline: "triathlon",
  contactParent: "",
  telephoneParent: "",
  emailParent: "",
  urgence: "",
  statut: "actif",
});

const blankSession = (coaches: Coach[]): Omit<AcademySession, "id"> => ({
  date: new Date().toISOString().split("T")[0],
  entraineurId: coaches[0]?.id ?? "",
  discipline: "triathlon",
  lieu: "",
  presents: [],
  notes: "",
});

export default function AcademyClient({ initialYoungAthletes, initialSessions, coaches }: Props) {
  const [tab, setTab] = useState<Tab>("jeunes");
  const [youngAthletes, setYoungAthletes] = useState(initialYoungAthletes);
  const [sessions, setSessions] = useState(initialSessions);

  // ── Jeunes state ──────────────────────────────────────────────────────────
  const [showAddYA, setShowAddYA] = useState(false);
  const [addYAForm, setAddYAForm] = useState(blankYA());
  const [editingYAId, setEditingYAId] = useState<string | null>(null);
  const [editYAForm, setEditYAForm] = useState<Omit<YoungAthlete, "id" | "createdAt">>(blankYA());
  const [deleteYATarget, setDeleteYATarget] = useState<string | null>(null);
  const [filterStatut, setFilterStatut] = useState<"tous" | "actif" | "inactif">("tous");

  // ── Sessions state ────────────────────────────────────────────────────────
  const [showAddSession, setShowAddSession] = useState(false);
  const [addSessionForm, setAddSessionForm] = useState(blankSession(coaches));
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editSessionForm, setEditSessionForm] = useState<Omit<AcademySession, "id">>(blankSession(coaches));
  const [deleteSessionTarget, setDeleteSessionTarget] = useState<string | null>(null);

  // ── Jeunes CRUD ───────────────────────────────────────────────────────────
  async function handleAddYA() {
    if (!addYAForm.prenom || !addYAForm.nom || !addYAForm.dateNaissance) return;
    const res = await fetch("/api/academy/athletes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addYAForm),
    });
    if (res.ok) {
      const created: YoungAthlete = await res.json();
      setYoungAthletes((prev) => [...prev, created]);
      setAddYAForm(blankYA());
      setShowAddYA(false);
    }
  }

  function startEditYA(ya: YoungAthlete) {
    setEditingYAId(ya.id);
    setEditYAForm({
      prenom: ya.prenom,
      nom: ya.nom,
      dateNaissance: ya.dateNaissance,
      discipline: ya.discipline,
      contactParent: ya.contactParent,
      telephoneParent: ya.telephoneParent,
      emailParent: ya.emailParent ?? "",
      urgence: ya.urgence ?? "",
      statut: ya.statut,
    });
  }

  async function handleSaveYA(id: string) {
    const res = await fetch(`/api/academy/athletes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editYAForm),
    });
    if (res.ok) {
      const updated: YoungAthlete = await res.json();
      setYoungAthletes((prev) => prev.map((y) => (y.id === id ? updated : y)));
      setEditingYAId(null);
    }
  }

  async function handleDeleteYA(id: string) {
    const res = await fetch(`/api/academy/athletes/${id}`, { method: "DELETE" });
    if (res.ok) {
      setYoungAthletes((prev) => prev.filter((y) => y.id !== id));
      setDeleteYATarget(null);
    }
  }

  // ── Sessions CRUD ─────────────────────────────────────────────────────────
  async function handleAddSession() {
    if (!addSessionForm.date || !addSessionForm.lieu) return;
    const res = await fetch("/api/academy/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addSessionForm),
    });
    if (res.ok) {
      const created: AcademySession = await res.json();
      setSessions((prev) => [created, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
      setAddSessionForm(blankSession(coaches));
      setShowAddSession(false);
    }
  }

  function startEditSession(s: AcademySession) {
    setEditingSessionId(s.id);
    setEditSessionForm({
      date: s.date,
      entraineurId: s.entraineurId,
      discipline: s.discipline,
      lieu: s.lieu,
      presents: [...s.presents],
      notes: s.notes ?? "",
    });
  }

  async function handleSaveSession(id: string) {
    const res = await fetch(`/api/academy/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editSessionForm),
    });
    if (res.ok) {
      const updated: AcademySession = await res.json();
      setSessions((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setEditingSessionId(null);
    }
  }

  async function handleDeleteSession(id: string) {
    const res = await fetch(`/api/academy/sessions/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setDeleteSessionTarget(null);
    }
  }

  function togglePresent(yaId: string, form: Omit<AcademySession, "id">, setForm: (f: Omit<AcademySession, "id">) => void) {
    const presents = form.presents.includes(yaId)
      ? form.presents.filter((id) => id !== yaId)
      : [...form.presents, yaId];
    setForm({ ...form, presents });
  }

  // ── Filtered jeunes ───────────────────────────────────────────────────────
  const filteredYA = youngAthletes.filter(
    (y) => filterStatut === "tous" || y.statut === filterStatut
  );

  // ── Coach lookup ──────────────────────────────────────────────────────────
  const coachById = Object.fromEntries(coaches.map((c) => [c.id, c]));
  const yaById = Object.fromEntries(youngAthletes.map((y) => [y.id, y]));

  // ── Sorted sessions ───────────────────────────────────────────────────────
  const sortedSessions = [...sessions].sort((a, b) => b.date.localeCompare(a.date));

  // ── Entraineurs stats ─────────────────────────────────────────────────────
  const entraineurStats = coaches.map((c) => {
    const coachSessions = sessions.filter((s) => s.entraineurId === c.id);
    const totalPresences = coachSessions.reduce((sum, s) => sum + s.presents.length, 0);
    return { coach: c, sessionCount: coachSessions.length, totalPresences };
  }).filter((e) => e.sessionCount > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 pt-8 pb-4 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#7c1d35]/10 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-[#7c1d35]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Academy</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {youngAthletes.filter((y) => y.statut === "actif").length} jeunes actifs · {sessions.length} séances
              </p>
            </div>
          </div>

          {/* Tab action buttons */}
          {tab === "jeunes" && (
            <button
              onClick={() => setShowAddYA((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-[#7c1d35] text-white rounded-lg text-sm font-medium hover:bg-[#9b2445] transition-colors"
            >
              <Plus size={16} />
              Nouveau jeune
            </button>
          )}
          {tab === "presences" && (
            <button
              onClick={() => setShowAddSession((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-[#7c1d35] text-white rounded-lg text-sm font-medium hover:bg-[#9b2445] transition-colors"
            >
              <Plus size={16} />
              Nouvelle séance
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-5">
          {([
            { key: "jeunes", label: "Jeunes", icon: Users },
            { key: "presences", label: "Présences", icon: CalendarDays },
            { key: "entraineurs", label: "Entraîneurs", icon: UserCheck },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === key
                  ? "bg-[#7c1d35] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">

        {/* ── JEUNES TAB ── */}
        {tab === "jeunes" && (
          <div>
            {/* Add form */}
            {showAddYA && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Ajouter un jeune athlète</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Prénom *</label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20"
                      value={addYAForm.prenom}
                      onChange={(e) => setAddYAForm({ ...addYAForm, prenom: e.target.value })}
                      placeholder="Lucas"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Nom *</label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20"
                      value={addYAForm.nom}
                      onChange={(e) => setAddYAForm({ ...addYAForm, nom: e.target.value })}
                      placeholder="Martin"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Date de naissance *</label>
                    <input
                      type="date"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20"
                      value={addYAForm.dateNaissance}
                      onChange={(e) => setAddYAForm({ ...addYAForm, dateNaissance: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Discipline</label>
                    <select
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20"
                      value={addYAForm.discipline}
                      onChange={(e) => setAddYAForm({ ...addYAForm, discipline: e.target.value as Discipline })}
                    >
                      {(Object.keys(DISCIPLINE_LABELS) as Discipline[]).map((d) => (
                        <option key={d} value={d}>{DISCIPLINE_LABELS[d]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Contact parent</label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20"
                      value={addYAForm.contactParent}
                      onChange={(e) => setAddYAForm({ ...addYAForm, contactParent: e.target.value })}
                      placeholder="Marie Martin"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Téléphone parent</label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20"
                      value={addYAForm.telephoneParent}
                      onChange={(e) => setAddYAForm({ ...addYAForm, telephoneParent: e.target.value })}
                      placeholder="0476/000000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Email parent</label>
                    <input
                      type="email"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20"
                      value={addYAForm.emailParent ?? ""}
                      onChange={(e) => setAddYAForm({ ...addYAForm, emailParent: e.target.value })}
                      placeholder="parent@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Contact urgence</label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20"
                      value={addYAForm.urgence ?? ""}
                      onChange={(e) => setAddYAForm({ ...addYAForm, urgence: e.target.value })}
                      placeholder="Nom 0476/000000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
                    <select
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20"
                      value={addYAForm.statut}
                      onChange={(e) => setAddYAForm({ ...addYAForm, statut: e.target.value as "actif" | "inactif" })}
                    >
                      <option value="actif">Actif</option>
                      <option value="inactif">Inactif</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleAddYA}
                    className="flex items-center gap-2 px-4 py-2 bg-[#7c1d35] text-white rounded-lg text-sm font-medium hover:bg-[#9b2445]"
                  >
                    <Save size={14} /> Enregistrer
                  </button>
                  <button
                    onClick={() => { setShowAddYA(false); setAddYAForm(blankYA()); }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                  >
                    <X size={14} /> Annuler
                  </button>
                </div>
              </div>
            )}

            {/* Filter */}
            <div className="flex gap-2 mb-4">
              {(["tous", "actif", "inactif"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatut(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterStatut === s ? "bg-[#7c1d35] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {s === "tous" ? "Tous" : s === "actif" ? "Actifs" : "Inactifs"}
                  {s !== "tous" && (
                    <span className="ml-1.5 opacity-70">
                      ({youngAthletes.filter((y) => y.statut === s).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Athlète</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Âge</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact parent</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email parent</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Urgence</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredYA.map((ya) => (
                    editingYAId === ya.id ? (
                      <tr key={ya.id} className="border-b border-gray-100 bg-blue-50/30">
                        <td className="px-4 py-2">
                          <div className="flex gap-1 flex-col">
                            <input
                              className="border border-gray-200 rounded px-2 py-1 text-sm w-full"
                              placeholder="Prénom"
                              value={editYAForm.prenom}
                              onChange={(e) => setEditYAForm({ ...editYAForm, prenom: e.target.value })}
                            />
                            <input
                              className="border border-gray-200 rounded px-2 py-1 text-sm w-full"
                              placeholder="Nom"
                              value={editYAForm.nom}
                              onChange={(e) => setEditYAForm({ ...editYAForm, nom: e.target.value })}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="date"
                            className="border border-gray-200 rounded px-2 py-1 text-sm w-36"
                            value={editYAForm.dateNaissance}
                            onChange={(e) => setEditYAForm({ ...editYAForm, dateNaissance: e.target.value })}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-1 flex-col">
                            <input
                              className="border border-gray-200 rounded px-2 py-1 text-sm w-36"
                              placeholder="Nom contact"
                              value={editYAForm.contactParent}
                              onChange={(e) => setEditYAForm({ ...editYAForm, contactParent: e.target.value })}
                            />
                            <input
                              className="border border-gray-200 rounded px-2 py-1 text-sm w-36"
                              placeholder="Téléphone"
                              value={editYAForm.telephoneParent}
                              onChange={(e) => setEditYAForm({ ...editYAForm, telephoneParent: e.target.value })}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="email"
                            className="border border-gray-200 rounded px-2 py-1 text-sm w-44"
                            placeholder="Email"
                            value={editYAForm.emailParent ?? ""}
                            onChange={(e) => setEditYAForm({ ...editYAForm, emailParent: e.target.value })}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            className="border border-gray-200 rounded px-2 py-1 text-sm w-36"
                            placeholder="Nom 0476/000000"
                            value={editYAForm.urgence ?? ""}
                            onChange={(e) => setEditYAForm({ ...editYAForm, urgence: e.target.value })}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            className="border border-gray-200 rounded px-2 py-1 text-sm"
                            value={editYAForm.statut}
                            onChange={(e) => setEditYAForm({ ...editYAForm, statut: e.target.value as "actif" | "inactif" })}
                          >
                            <option value="actif">Actif</option>
                            <option value="inactif">Inactif</option>
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <button onClick={() => handleSaveYA(ya.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded">
                              <Save size={14} />
                            </button>
                            <button onClick={() => setEditingYAId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded">
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={ya.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#7c1d35]/10 flex items-center justify-center text-[#7c1d35] text-xs font-bold flex-shrink-0">
                              {ya.prenom[0]}{ya.nom[0]}
                            </div>
                            <span className="font-medium text-gray-900">{ya.prenom} {ya.nom}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 font-medium">{calcAge(ya.dateNaissance)} ans</td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-700 font-medium">{ya.contactParent || "—"}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{ya.telephoneParent || ""}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">{ya.emailParent || "—"}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{ya.urgence || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            ya.statut === "actif"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-500"
                          }`}>
                            {ya.statut === "actif" ? "Actif" : "Inactif"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button
                              onClick={() => startEditYA(ya)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteYATarget(ya.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  ))}
                  {filteredYA.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                        Aucun jeune athlète trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PRESENCES TAB ── */}
        {tab === "presences" && (
          <div>
            {/* Add session form */}
            {showAddSession && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Nouvelle séance</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Date *</label>
                    <input
                      type="date"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20"
                      value={addSessionForm.date}
                      onChange={(e) => setAddSessionForm({ ...addSessionForm, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Entraîneur</label>
                    <select
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20"
                      value={addSessionForm.entraineurId}
                      onChange={(e) => setAddSessionForm({ ...addSessionForm, entraineurId: e.target.value })}
                    >
                      {coaches.map((c) => (
                        <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Discipline</label>
                    <select
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20"
                      value={addSessionForm.discipline}
                      onChange={(e) => setAddSessionForm({ ...addSessionForm, discipline: e.target.value as Discipline })}
                    >
                      {(Object.keys(DISCIPLINE_LABELS) as Discipline[]).map((d) => (
                        <option key={d} value={d}>{DISCIPLINE_LABELS[d]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Lieu *</label>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20"
                      value={addSessionForm.lieu}
                      onChange={(e) => setAddSessionForm({ ...addSessionForm, lieu: e.target.value })}
                      placeholder="Piscine Municipale"
                    />
                  </div>
                </div>
                {/* Présents */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 mb-2">Présents</label>
                  <div className="flex flex-wrap gap-2">
                    {youngAthletes.filter((y) => y.statut === "actif").map((ya) => (
                      <button
                        key={ya.id}
                        onClick={() => togglePresent(ya.id, addSessionForm, setAddSessionForm)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          addSessionForm.presents.includes(ya.id)
                            ? "bg-[#7c1d35] text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {ya.prenom} {ya.nom}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 resize-none"
                    value={addSessionForm.notes}
                    onChange={(e) => setAddSessionForm({ ...addSessionForm, notes: e.target.value })}
                    placeholder="Observations, points travaillés..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddSession}
                    className="flex items-center gap-2 px-4 py-2 bg-[#7c1d35] text-white rounded-lg text-sm font-medium hover:bg-[#9b2445]"
                  >
                    <Save size={14} /> Enregistrer
                  </button>
                  <button
                    onClick={() => { setShowAddSession(false); setAddSessionForm(blankSession(coaches)); }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                  >
                    <X size={14} /> Annuler
                  </button>
                </div>
              </div>
            )}

            {/* Sessions list */}
            <div className="space-y-3">
              {sortedSessions.length === 0 && (
                <div className="text-center py-16 text-gray-400 text-sm">Aucune séance enregistrée</div>
              )}
              {sortedSessions.map((session) => {
                const coach = coachById[session.entraineurId];
                const isExpanded = expandedSessionId === session.id;
                const isEditing = editingSessionId === session.id;

                return (
                  <div key={session.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    {isEditing ? (
                      <div className="p-5">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                            <input
                              type="date"
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                              value={editSessionForm.date}
                              onChange={(e) => setEditSessionForm({ ...editSessionForm, date: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Entraîneur</label>
                            <select
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                              value={editSessionForm.entraineurId}
                              onChange={(e) => setEditSessionForm({ ...editSessionForm, entraineurId: e.target.value })}
                            >
                              {coaches.map((c) => (
                                <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Discipline</label>
                            <select
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                              value={editSessionForm.discipline}
                              onChange={(e) => setEditSessionForm({ ...editSessionForm, discipline: e.target.value as Discipline })}
                            >
                              {(Object.keys(DISCIPLINE_LABELS) as Discipline[]).map((d) => (
                                <option key={d} value={d}>{DISCIPLINE_LABELS[d]}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Lieu</label>
                            <input
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                              value={editSessionForm.lieu}
                              onChange={(e) => setEditSessionForm({ ...editSessionForm, lieu: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="mb-4">
                          <label className="block text-xs font-medium text-gray-500 mb-2">Présents</label>
                          <div className="flex flex-wrap gap-2">
                            {youngAthletes.map((ya) => (
                              <button
                                key={ya.id}
                                onClick={() => togglePresent(ya.id, editSessionForm, setEditSessionForm)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                  editSessionForm.presents.includes(ya.id)
                                    ? "bg-[#7c1d35] text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                              >
                                {ya.prenom} {ya.nom}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="mb-4">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                          <textarea
                            rows={2}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                            value={editSessionForm.notes}
                            onChange={(e) => setEditSessionForm({ ...editSessionForm, notes: e.target.value })}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveSession(session.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#7c1d35] text-white rounded-lg text-sm font-medium"
                          >
                            <Save size={14} /> Enregistrer
                          </button>
                          <button
                            onClick={() => setEditingSessionId(null)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                          >
                            <X size={14} /> Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Session header */}
                        <div
                          className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                          onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-lg font-bold text-[#7c1d35]">
                                {new Date(session.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                              </div>
                              <div className="text-xs text-gray-400">
                                {new Date(session.date).getFullYear()}
                              </div>
                            </div>
                            <div className="w-px h-10 bg-gray-200" />
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge value={session.discipline} type="discipline" />
                                <span className="text-sm font-medium text-gray-900">{session.lieu}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {coach && (
                                  <span className="text-xs text-gray-500">
                                    <span
                                      className="inline-block w-2 h-2 rounded-full mr-1"
                                      style={{ backgroundColor: coach.couleur }}
                                    />
                                    {coach.prenom} {coach.nom}
                                  </span>
                                )}
                                <span className="text-xs text-gray-400">·</span>
                                <span className="text-xs text-gray-500">
                                  {session.presents.length} présent{session.presents.length > 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Present avatars */}
                            <div className="flex -space-x-1">
                              {session.presents.slice(0, 4).map((yaId) => {
                                const ya = yaById[yaId];
                                if (!ya) return null;
                                return (
                                  <div
                                    key={yaId}
                                    title={`${ya.prenom} ${ya.nom}`}
                                    className="w-6 h-6 rounded-full bg-[#7c1d35]/10 border border-white flex items-center justify-center text-[#7c1d35] text-xs font-bold"
                                  >
                                    {ya.prenom[0]}
                                  </div>
                                );
                              })}
                              {session.presents.length > 4 && (
                                <div className="w-6 h-6 rounded-full bg-gray-100 border border-white flex items-center justify-center text-gray-500 text-xs font-bold">
                                  +{session.presents.length - 4}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); startEditSession(session); }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteSessionTarget(session.id); }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                            {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
                            <div className="mb-3">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Présents</p>
                              <div className="flex flex-wrap gap-2">
                                {session.presents.length === 0 && (
                                  <span className="text-sm text-gray-400">Aucun présent enregistré</span>
                                )}
                                {session.presents.map((yaId) => {
                                  const ya = yaById[yaId];
                                  if (!ya) return null;
                                  return (
                                    <span
                                      key={yaId}
                                      className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-700"
                                    >
                                      <span className="w-4 h-4 rounded-full bg-[#7c1d35]/10 flex items-center justify-center text-[#7c1d35] text-xs font-bold">
                                        {ya.prenom[0]}
                                      </span>
                                      {ya.prenom} {ya.nom}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                            {session.notes && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
                                <p className="text-sm text-gray-600 italic">{session.notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ENTRAINEURS TAB ── */}
        {tab === "entraineurs" && (
          <div>
            {coaches.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">Aucun entraîneur</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coaches.map((coach) => {
                  const coachSessions = sessions.filter((s) => s.entraineurId === coach.id);
                  const totalPresences = coachSessions.reduce((sum, s) => sum + s.presents.length, 0);
                  const disciplines = Array.from(new Set(coachSessions.map((s) => s.discipline)));
                  const lastSession = coachSessions.sort((a, b) => b.date.localeCompare(a.date))[0];

                  return (
                    <div key={coach.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: coach.couleur }}
                        >
                          {coach.prenom[0]}{coach.nom[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{coach.prenom} {coach.nom}</p>
                          <p className="text-xs text-gray-500">{coach.role}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-[#7c1d35]">{coachSessions.length}</div>
                          <div className="text-xs text-gray-500 mt-0.5">séances</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-[#7c1d35]">{totalPresences}</div>
                          <div className="text-xs text-gray-500 mt-0.5">présences total</div>
                        </div>
                      </div>
                      {disciplines.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {disciplines.map((d) => (
                            <Badge key={d} value={d} type="discipline" />
                          ))}
                        </div>
                      )}
                      {lastSession && (
                        <p className="text-xs text-gray-400">
                          Dernière séance : {formatDate(lastSession.date)}
                        </p>
                      )}
                      {coachSessions.length === 0 && (
                        <p className="text-xs text-gray-400 italic">Aucune séance encadrée</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Delete modals ── */}
      {deleteYATarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Supprimer ce jeune ?</h3>
            <p className="text-sm text-gray-500 mb-6">
              {(() => { const y = youngAthletes.find((y) => y.id === deleteYATarget); return y ? `${y.prenom} ${y.nom}` : ""; })()} sera définitivement supprimé.
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleDeleteYA(deleteYATarget)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700">
                Supprimer
              </button>
              <button onClick={() => setDeleteYATarget(null)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteSessionTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Supprimer cette séance ?</h3>
            <p className="text-sm text-gray-500 mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDeleteSession(deleteSessionTarget)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700">
                Supprimer
              </button>
              <button onClick={() => setDeleteSessionTarget(null)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
