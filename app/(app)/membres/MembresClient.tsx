"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Users, GraduationCap, BadgeCheck, Plus, Edit2, Trash2, Save, X,
  ExternalLink, Phone, Mail, MapPin, Calendar, Check,
} from "lucide-react";
import { Athlete, Coach, YoungAthlete, Licencie, Discipline, StatutLicencie } from "@/lib/types";
import Badge from "@/components/Badge";

interface Props {
  athletes: Athlete[];
  coaches: Coach[];
  youngAthletes: YoungAthlete[];
  initialLicencies: Licencie[];
}

type Tab = "athletes" | "academie" | "licencies";

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
  if (now.getMonth() - birth.getMonth() < 0 ||
    (now.getMonth() - birth.getMonth() === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

const blankForm = (): Omit<Licencie, "id" | "createdAt"> => ({
  prenom: "",
  nom: "",
  email: "",
  telephone: "",
  adresse: "",
  dateLicence: "",
  numeroLicence: "",
  discipline: undefined,
  statut: "actif",
});

export default function MembresClient({ athletes, coaches, youngAthletes, initialLicencies }: Props) {
  const [tab, setTab] = useState<Tab>("athletes");
  const [licencies, setLicencies] = useState(initialLicencies);

  // Athletes filters
  const [athleteFilter, setAthleteFilter] = useState<"actif" | "pause" | "archive" | "tous">("actif");

  // Prix mensuel inline editing
  const [editingPrixId, setEditingPrixId] = useState<string | null>(null);
  const [prixValues, setPrixValues] = useState<Record<string, number>>(
    () => Object.fromEntries(athletes.map((a) => [a.id, a.prixMensuel ?? 0]))
  );
  const prixInputRef = useRef<HTMLInputElement>(null);

  // Licenciés state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(blankForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Omit<Licencie, "id" | "createdAt">>(blankForm());
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [licFilter, setLicFilter] = useState<"tous" | "actif" | "expire">("tous");

  const coachById = Object.fromEntries(coaches.map((c) => [c.id, c]));

  // ── Prix mensuel inline save ────────────────────────────────────────────
  async function savePrix(athleteId: string) {
    const prix = prixValues[athleteId] ?? 0;
    setEditingPrixId(null);
    try {
      await fetch(`/api/athletes/${athleteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prixMensuel: prix }),
      });
    } catch {
      // revert on error
      const original = athletes.find((a) => a.id === athleteId)?.prixMensuel ?? 0;
      setPrixValues((prev) => ({ ...prev, [athleteId]: original }));
    }
  }

  // ── Licenciés CRUD ──────────────────────────────────────────────────────
  async function handleAdd() {
    if (!addForm.prenom || !addForm.nom || !addForm.dateLicence) return;
    const res = await fetch("/api/licencies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    if (res.ok) {
      const created: Licencie = await res.json();
      setLicencies((prev) => [...prev, created]);
      setAddForm(blankForm());
      setShowAddForm(false);
    }
  }

  async function handleSave(id: string) {
    const res = await fetch(`/api/licencies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const updated: Licencie = await res.json();
      setLicencies((prev) => prev.map((l) => (l.id === id ? updated : l)));
      setEditingId(null);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/licencies/${id}`, { method: "DELETE" });
    if (res.ok) {
      setLicencies((prev) => prev.filter((l) => l.id !== id));
      setDeleteTarget(null);
    }
  }

  function startEdit(l: Licencie) {
    setEditingId(l.id);
    setEditForm({
      prenom: l.prenom,
      nom: l.nom,
      email: l.email,
      telephone: l.telephone,
      adresse: l.adresse ?? "",
      dateLicence: l.dateLicence,
      numeroLicence: l.numeroLicence ?? "",
      discipline: l.discipline,
      statut: l.statut,
    });
  }

  // ── Derived counts ──────────────────────────────────────────────────────
  const activeAthletes = athletes.filter((a) => a.statut === "actif").length;
  const activeYoung = youngAthletes.filter((y) => y.statut === "actif").length;
  const activeLic = licencies.filter((l) => l.statut === "actif").length;
  const totalCommunaute = activeAthletes + activeYoung + activeLic;

  const filteredAthletes = athletes.filter(
    (a) => athleteFilter === "tous" || a.statut === athleteFilter
  );
  const filteredLicencies = licencies.filter(
    (l) => licFilter === "tous" || l.statut === licFilter
  );

  const tabs = [
    { key: "athletes" as const, label: "Athlètes coachés", icon: Users, count: athletes.filter((a) => a.statut === "actif").length },
    { key: "academie" as const, label: "Académie", icon: GraduationCap, count: youngAthletes.filter((y) => y.statut === "actif").length },
    { key: "licencies" as const, label: "Licenciés", icon: BadgeCheck, count: licencies.filter((l) => l.statut === "actif").length },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 pt-8 pb-4 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#7c1d35]/10 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-[#7c1d35]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Membres</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Communauté 3NERGY —{" "}
                <span className="font-semibold text-[#7c1d35]">{totalCommunaute}</span> membres actifs
              </p>
            </div>
          </div>

          {tab === "licencies" && (
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-[#7c1d35] text-white rounded-lg text-sm font-medium hover:bg-[#9b2445] transition-colors"
            >
              <Plus size={16} />
              Nouveau licencié
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === key ? "bg-[#7c1d35] text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon size={15} />
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                tab === key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">

        {/* ── ATHLÈTES TAB ── */}
        {tab === "athletes" && (
          <div>
            {/* Link to /athletes */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex gap-2">
                {(["actif", "pause", "archive", "tous"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setAthleteFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      athleteFilter === s ? "bg-[#7c1d35] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {s === "actif" ? "Actifs" : s === "pause" ? "En pause" : s === "archive" ? "Archivés" : "Tous"}
                    <span className="ml-1.5 opacity-70">
                      ({s === "tous" ? athletes.length : athletes.filter((a) => a.statut === s).length})
                    </span>
                  </button>
                ))}
              </div>
              <Link
                href="/athletes"
                className="flex items-center gap-1.5 text-sm text-[#7c1d35] font-medium hover:underline"
              >
                Gérer les athlètes
                <ExternalLink size={13} />
              </Link>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Athlète</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Formule</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prix/mois</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Coach</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAthletes.map((athlete) => {
                    const coach = coachById[athlete.coachId];
                    const isEditingPrix = editingPrixId === athlete.id;
                    const prix = prixValues[athlete.id] ?? 0;
                    return (
                      <tr key={athlete.id} className="border-b border-gray-100 hover:bg-gray-50/40 transition-colors">
                        {/* Nom */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#7c1d35]/10 flex items-center justify-center text-[#7c1d35] text-xs font-bold flex-shrink-0">
                              {athlete.prenom[0]}{athlete.nom[0]}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{athlete.prenom} {athlete.nom}</p>
                              <p className="text-xs text-gray-400">{athlete.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Formule */}
                        <td className="px-4 py-3">
                          <Badge value={athlete.service} type="service" />
                        </td>

                        {/* Prix mensuel — inline editable */}
                        <td className="px-4 py-2 text-right">
                          {isEditingPrix ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                ref={prixInputRef}
                                type="number"
                                min="0"
                                step="1"
                                value={prix}
                                onChange={(e) => setPrixValues((prev) => ({ ...prev, [athlete.id]: parseFloat(e.target.value) || 0 }))}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") savePrix(athlete.id);
                                  if (e.key === "Escape") setEditingPrixId(null);
                                }}
                                className="w-20 px-2 py-1 border border-[#7c1d35]/40 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20"
                                autoFocus
                              />
                              <span className="text-xs text-gray-400">€</span>
                              <button onClick={() => savePrix(athlete.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                                <Check size={13} />
                              </button>
                              <button onClick={() => setEditingPrixId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                                <X size={13} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditingPrixId(athlete.id); }}
                              className="group flex items-center justify-end gap-1.5 ml-auto hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors"
                              title="Modifier le prix"
                            >
                              <span className={`text-sm font-semibold ${prix > 0 ? "text-[#1a1218]" : "text-gray-300"}`}>
                                {prix > 0 ? `${prix} €` : "—"}
                              </span>
                              <Edit2 size={11} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                            </button>
                          )}
                        </td>

                        {/* Coach */}
                        <td className="px-4 py-3">
                          {coach ? (
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: coach.couleur }} />
                              <span className="text-gray-600 text-sm">{coach.prenom} {coach.nom}</span>
                            </div>
                          ) : <span className="text-gray-400">—</span>}
                        </td>

                        {/* Statut */}
                        <td className="px-4 py-3"><Badge value={athlete.statut} type="statut_athlete" /></td>
                      </tr>
                    );
                  })}
                  {filteredAthletes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">
                        Aucun athlète dans cette catégorie.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ACADÉMIE TAB ── */}
        {tab === "academie" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-gray-500">
                {youngAthletes.filter((y) => y.statut === "actif").length} jeunes actifs
              </p>
              <Link
                href="/academy"
                className="flex items-center gap-1.5 text-sm text-[#7c1d35] font-medium hover:underline"
              >
                Gérer l&apos;Academy
                <ExternalLink size={13} />
              </Link>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Jeune athlète</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Âge</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact parent</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Urgence</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {youngAthletes.map((ya) => (
                    <tr key={ya.id} className="border-b border-gray-100 hover:bg-gray-50/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-bold flex-shrink-0">
                            {ya.prenom[0]}{ya.nom[0]}
                          </div>
                          <span className="font-medium text-gray-900">{ya.prenom} {ya.nom}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium">{calcAge(ya.dateNaissance)} ans</td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-700 font-medium">{ya.contactParent || "—"}</div>
                        {ya.telephoneParent && (
                          <div className="text-xs text-gray-400 mt-0.5">{ya.telephoneParent}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{ya.emailParent || "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{ya.urgence || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          ya.statut === "actif" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {ya.statut === "actif" ? "Actif" : "Inactif"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {youngAthletes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">Aucun jeune enregistré</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── LICENCIÉS TAB ── */}
        {tab === "licencies" && (
          <div>
            {/* Add form */}
            {showAddForm && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Nouveau licencié</h3>
                <LicencieForm
                  form={addForm}
                  onChange={setAddForm}
                  onSubmit={handleAdd}
                  onCancel={() => { setShowAddForm(false); setAddForm(blankForm()); }}
                  submitLabel="Enregistrer"
                />
              </div>
            )}

            {/* Filter */}
            <div className="flex gap-2 mb-4">
              {(["tous", "actif", "expire"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setLicFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    licFilter === s ? "bg-[#7c1d35] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {s === "tous" ? "Tous" : s === "actif" ? "Actifs" : "Expirés"}
                  <span className="ml-1.5 opacity-70">
                    ({s === "tous" ? licencies.length : licencies.filter((l) => l.statut === s).length})
                  </span>
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Licencié</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Discipline</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Licence</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredLicencies.map((lic) =>
                    editingId === lic.id ? (
                      <tr key={lic.id} className="border-b border-gray-100 bg-blue-50/20">
                        <td colSpan={6} className="px-4 py-4">
                          <LicencieForm
                            form={editForm}
                            onChange={setEditForm}
                            onSubmit={() => handleSave(lic.id)}
                            onCancel={() => setEditingId(null)}
                            submitLabel="Enregistrer"
                          />
                        </td>
                      </tr>
                    ) : (
                      <tr key={lic.id} className="border-b border-gray-100 hover:bg-gray-50/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold flex-shrink-0">
                              {lic.prenom[0]}{lic.nom[0]}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{lic.prenom} {lic.nom}</p>
                              {lic.adresse && (
                                <p className="text-xs text-gray-400 flex items-center gap-0.5 mt-0.5">
                                  <MapPin size={10} />{lic.adresse}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            {lic.email && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Mail size={11} className="text-gray-400" />{lic.email}
                              </div>
                            )}
                            {lic.telephone && (
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Phone size={11} className="text-gray-400" />{lic.telephone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {lic.discipline
                            ? <Badge value={lic.discipline} type="discipline" />
                            : <span className="text-gray-400 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Calendar size={11} className="text-gray-400" />
                            {formatDate(lic.dateLicence)}
                          </div>
                          {lic.numeroLicence && (
                            <p className="text-xs text-gray-400 mt-0.5 font-mono">{lic.numeroLicence}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            lic.statut === "actif" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                          }`}>
                            {lic.statut === "actif" ? "Actif" : "Expiré"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button
                              onClick={() => startEdit(lic)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(lic.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                  {filteredLicencies.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">
                        Aucun licencié trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Supprimer ce licencié ?</h3>
            <p className="text-sm text-gray-500 mb-6">
              {(() => {
                const l = licencies.find((l) => l.id === deleteTarget);
                return l ? `${l.prenom} ${l.nom} sera définitivement supprimé.` : "";
              })()}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteTarget)}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700"
              >
                Supprimer
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Licencié form (shared between add + edit) ────────────────────────────────
function LicencieForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  form: Omit<Licencie, "id" | "createdAt">;
  onChange: (f: Omit<Licencie, "id" | "createdAt">) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20";
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Prénom *</label>
          <input className={inp} value={form.prenom} onChange={(e) => onChange({ ...form, prenom: e.target.value })} placeholder="Prénom" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Nom *</label>
          <input className={inp} value={form.nom} onChange={(e) => onChange({ ...form, nom: e.target.value })} placeholder="Nom" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
          <input type="email" className={inp} value={form.email} onChange={(e) => onChange({ ...form, email: e.target.value })} placeholder="email@example.fr" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Téléphone</label>
          <input className={inp} value={form.telephone} onChange={(e) => onChange({ ...form, telephone: e.target.value })} placeholder="06 00 00 00 00" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-500 mb-1">Adresse</label>
          <input className={inp} value={form.adresse ?? ""} onChange={(e) => onChange({ ...form, adresse: e.target.value })} placeholder="Adresse complète" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Date de prise de licence *</label>
          <input type="date" className={inp} value={form.dateLicence} onChange={(e) => onChange({ ...form, dateLicence: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">N° de licence</label>
          <input className={inp} value={form.numeroLicence ?? ""} onChange={(e) => onChange({ ...form, numeroLicence: e.target.value })} placeholder="TRI-2025-001 (optionnel)" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Discipline</label>
          <select className={inp} value={form.discipline ?? ""} onChange={(e) => onChange({ ...form, discipline: e.target.value as Discipline | undefined || undefined })}>
            <option value="">— Non renseigné —</option>
            <option value="triathlon">Triathlon</option>
            <option value="cyclisme">Cyclisme</option>
            <option value="course_a_pied">Course à pied</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
          <select className={inp} value={form.statut} onChange={(e) => onChange({ ...form, statut: e.target.value as StatutLicencie })}>
            <option value="actif">Actif</option>
            <option value="expire">Expiré</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onSubmit} className="flex items-center gap-1.5 px-4 py-2 bg-[#7c1d35] text-white rounded-lg text-sm font-medium hover:bg-[#9b2445]">
          <Save size={14} />{submitLabel}
        </button>
        <button onClick={onCancel} className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
          <X size={14} />Annuler
        </button>
      </div>
    </div>
  );
}
