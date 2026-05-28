"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Athlete, Coach, Discipline, StatutAthlete, Service } from "@/lib/types";
import Badge, { serviceMap } from "@/components/Badge";
import { SERVICE_ORDER, SERVICE_LABELS, SERVICE_TARIFS } from "@/lib/config";
import {
  Search, Plus, Filter,
  MoreHorizontal, Eye, PauseCircle, PlayCircle, Trash2,
  Mail, Loader2, Clock, X,
} from "lucide-react";
import NewAthleteModal from "./NewAthleteModal";

interface Props {
  athletes: Athlete[];
  coaches: Coach[];
}

export default function AthletesClient({ athletes, coaches }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterDiscipline, setFilterDiscipline] = useState<Discipline | "">("");
  const [filterCoach, setFilterCoach] = useState("");
  const [filterStatut, setFilterStatut] = useState<StatutAthlete | "">("");
  const [showModal, setShowModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ prenom: "", nom: "", email: "", coachId: coaches[0]?.id ?? "" });
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ formUrl: string; prenom: string } | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

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
    } catch {
      setInviteError("Erreur réseau");
    } finally {
      setInviting(false);
    }
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setInviteResult(null);
    setInviteError(null);
    setInviteForm({ prenom: "", nom: "", email: "", coachId: coaches[0]?.id ?? "" });
  };

  // menu contextuel
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Athlete | null>(null);
  const [deleting, setDeleting] = useState(false);

  // statuts locaux pour mise à jour optimiste
  const [localStatuts, setLocalStatuts] = useState<Record<string, StatutAthlete>>(
    () => Object.fromEntries(athletes.map((a) => [a.id, a.statut]))
  );
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // services locaux pour mise à jour optimiste
  const [localServices, setLocalServices] = useState<Record<string, Service>>(
    () => Object.fromEntries(athletes.map((a) => [a.id, a.service]))
  );
  const [openServiceMenuId, setOpenServiceMenuId] = useState<string | null>(null);

  // Fermer le menu si clic hors
  const closeMenu = useCallback(() => {
    setOpenMenuId(null);
    setOpenServiceMenuId(null);
  }, []);
  useEffect(() => {
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, [closeMenu]);

  // Filtres
  const filtered = athletes.filter((a) => {
    const q = search.toLowerCase();
    const currentStatut = localStatuts[a.id] ?? a.statut;
    return (
      (!q || `${a.prenom} ${a.nom} ${a.email}`.toLowerCase().includes(q)) &&
      (!filterDiscipline || a.discipline === filterDiscipline) &&
      (!filterCoach || a.coachId === filterCoach) &&
      (!filterStatut || currentStatut === filterStatut)
    );
  });

  const getCoach = (id: string) => coaches.find((c) => c.id === id);
  const getCoachName = (id: string) => {
    const c = getCoach(id);
    return c ? `${c.prenom} ${c.nom}` : "—";
  };

  // Toggle actif ↔ pause
  const handleToggleStatut = async (e: React.MouseEvent, athlete: Athlete) => {
    e.stopPropagation();
    const current = localStatuts[athlete.id] ?? athlete.statut;
    if (current === "archive" || current === "en_attente") return;
    const next: StatutAthlete = current === "actif" ? "pause" : "actif";
    setLocalStatuts((prev) => ({ ...prev, [athlete.id]: next }));
    setTogglingId(athlete.id);
    try {
      await fetch(`/api/athletes/${athlete.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: next }),
      });
    } catch {
      // revert
      setLocalStatuts((prev) => ({ ...prev, [athlete.id]: current }));
    } finally {
      setTogglingId(null);
    }
  };

  // Suppression
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/athletes/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  const handleChangeService = async (e: React.MouseEvent, athlete: Athlete, newService: Service) => {
    e.stopPropagation();
    const newPrix = SERVICE_TARIFS[newService] ?? 0;
    setLocalServices((prev) => ({ ...prev, [athlete.id]: newService }));
    setOpenServiceMenuId(null);
    try {
      await fetch(`/api/athletes/${athlete.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: newService, prixMensuel: newPrix }),
      });
    } catch {
      setLocalServices((prev) => ({ ...prev, [athlete.id]: athlete.service }));
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1218]">Athlètes</h1>
          <p className="text-gray-500 text-sm mt-1">{athletes.length} athlètes enregistrés</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 border border-[#7c1d35] text-[#7c1d35] hover:bg-[#7c1d35]/5 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
          >
            <Mail size={16} />
            Inviter un athlète
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#7c1d35] hover:bg-[#9b2445] text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
          >
            <Plus size={16} />
            Nouvel athlète
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Rechercher un athlète..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-gray-400" />
          <select value={filterDiscipline} onChange={(e) => setFilterDiscipline(e.target.value as Discipline | "")}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35] bg-white">
            <option value="">Toutes les disciplines</option>
            <option value="triathlon">Triathlon</option>
            <option value="cyclisme">Cyclisme</option>
            <option value="course_a_pied">Course à pied</option>
          </select>
          <select value={filterCoach} onChange={(e) => setFilterCoach(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35] bg-white">
            <option value="">Tous les coachs</option>
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
            ))}
          </select>
          <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value as StatutAthlete | "")}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35] bg-white">
            <option value="">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="pause">En pause</option>
            <option value="archive">Archivé</option>
            <option value="en_attente">En attente</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Athlète</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Coach</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Discipline</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Statut</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Formule</th>
                <th className="w-10 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">Aucun athlète trouvé</td>
                </tr>
              ) : (
                filtered.map((athlete) => {
                  const currentStatut = localStatuts[athlete.id] ?? athlete.statut;
                  const isToggling = togglingId === athlete.id;
                  const coachColor = getCoach(athlete.coachId)?.couleur || "#999";

                  const currentService = localServices[athlete.id] ?? athlete.service;

                  return (
                    <tr
                      key={athlete.id}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/athletes/${athlete.id}`)}
                    >
                      {/* Nom */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: coachColor }}
                          >
                            {athlete.prenom.charAt(0)}{athlete.nom.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-[#1a1218]">{athlete.prenom} {athlete.nom}</p>
                            <p className="text-xs text-gray-400">{athlete.telephone}</p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 text-gray-600 text-xs">{athlete.email || "—"}</td>

                      {/* Coach */}
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium">{getCoachName(athlete.coachId)}</span>
                      </td>

                      {/* Discipline */}
                      <td className="px-4 py-3">
                        <Badge value={athlete.discipline} type="discipline" />
                      </td>

                      {/* Statut — badge cliquable */}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        {currentStatut === "en_attente" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                            <Clock size={10} />
                            En attente
                          </span>
                        ) : (
                          <button
                            onClick={(e) => handleToggleStatut(e, athlete)}
                            disabled={isToggling || currentStatut === "archive"}
                            title={
                              currentStatut === "archive" ? "Archivé"
                                : currentStatut === "actif" ? "Cliquer pour mettre en pause"
                                : "Cliquer pour réactiver"
                            }
                            className={`rounded transition-opacity ${isToggling ? "opacity-40" : "hover:opacity-75"} ${currentStatut !== "archive" ? "cursor-pointer" : "cursor-default"}`}
                          >
                            <Badge value={currentStatut} type="statut_athlete" />
                          </button>
                        )}
                      </td>

                      {/* Formule — dropdown inline */}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenServiceMenuId((prev) => prev === athlete.id ? null : athlete.id);
                            }}
                            className="rounded hover:opacity-75 transition-opacity cursor-pointer"
                            title="Changer la formule"
                          >
                            <Badge value={currentService} type="service" />
                          </button>
                          {openServiceMenuId === athlete.id && (
                            <div
                              className="absolute left-0 top-8 z-30 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {SERVICE_ORDER.map((svc) => {
                                const info = serviceMap[svc as Service];
                                const defaultPrix = SERVICE_TARIFS[svc] ?? 0;
                                return (
                                  <button
                                    key={svc}
                                    onClick={(e) => handleChangeService(e, athlete, svc as Service)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${currentService === svc ? "font-semibold" : "font-normal text-gray-700"}`}
                                  >
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${info.class}`}>
                                      {SERVICE_LABELS[svc]}
                                    </span>
                                    {defaultPrix > 0 && (
                                      <span className="text-xs text-gray-400 ml-auto">{defaultPrix} €</span>
                                    )}
                                    {currentService === svc && <span className="text-[#7c1d35] text-xs">✓</span>}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </td>


                      {/* Menu "..." */}
                      <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                          <button
                            onClick={(e) => toggleMenu(e, athlete.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                          >
                            <MoreHorizontal size={15} />
                          </button>

                          {openMenuId === athlete.id && (
                            <div
                              className="absolute right-0 top-9 z-30 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Voir la fiche */}
                              <button
                                onClick={() => router.push(`/athletes/${athlete.id}`)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <Eye size={14} className="text-gray-400 flex-shrink-0" />
                                Voir la fiche
                              </button>

                              {/* Changer le statut */}
                              {currentStatut !== "archive" && currentStatut !== "en_attente" && (
                                <button
                                  onClick={(e) => { handleToggleStatut(e, athlete); setOpenMenuId(null); }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  {currentStatut === "actif" ? (
                                    <><PauseCircle size={14} className="text-amber-500 flex-shrink-0" /> Mettre en pause</>
                                  ) : (
                                    <><PlayCircle size={14} className="text-emerald-500 flex-shrink-0" /> Réactiver</>
                                  )}
                                </button>
                              )}

                              <div className="my-1 border-t border-gray-100" />

                              {/* Supprimer */}
                              <button
                                onClick={() => { setDeleteTarget(athlete); setOpenMenuId(null); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={14} className="flex-shrink-0" />
                                Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modale invitation ── */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#7c1d35]/10 rounded-xl flex items-center justify-center">
                  <Mail size={16} className="text-[#7c1d35]" />
                </div>
                <h2 className="font-bold text-[#1a1218]">Inviter un athlète</h2>
              </div>
              <button onClick={closeInviteModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            {inviteResult ? (
              /* Success state */
              <div className="p-6 text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail size={24} className="text-emerald-600" />
                </div>
                <h3 className="font-bold text-[#1a1218] mb-1">Invitation envoyée !</h3>
                <p className="text-gray-500 text-sm mb-4">
                  {inviteResult.prenom} a reçu un email avec son lien d'inscription.
                </p>
                <div className="bg-gray-50 rounded-xl p-3 mb-4 text-left">
                  <p className="text-xs text-gray-500 mb-1">Lien de secours :</p>
                  <p className="text-xs text-[#7c1d35] break-all font-mono">{inviteResult.formUrl}</p>
                </div>
                <button
                  onClick={closeInviteModal}
                  className="w-full py-2.5 bg-[#7c1d35] text-white rounded-xl text-sm font-semibold hover:bg-[#9b2445] transition-colors"
                >
                  Fermer
                </button>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleInvite} className="p-6 space-y-4">
                {inviteError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{inviteError}</div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Prénom *</label>
                    <input required type="text" value={inviteForm.prenom}
                      onChange={(e) => setInviteForm((f) => ({ ...f, prenom: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nom *</label>
                    <input required type="text" value={inviteForm.nom}
                      onChange={(e) => setInviteForm((f) => ({ ...f, nom: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                  <input required type="email" value={inviteForm.email}
                    onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Coach assigné *</label>
                  <select required value={inviteForm.coachId}
                    onChange={(e) => setInviteForm((f) => ({ ...f, coachId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35] bg-white"
                  >
                    <option value="">Sélectionner un coach</option>
                    {coaches.map((c) => (
                      <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-400">
                  Un email sera envoyé depuis contact@3nergy.be avec le lien vers le formulaire d'inscription (valable 7 jours).
                </p>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={closeInviteModal}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    Annuler
                  </button>
                  <button type="submit" disabled={inviting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#7c1d35] text-white rounded-xl text-sm font-semibold hover:bg-[#9b2445] transition-colors disabled:opacity-60">
                    {inviting ? <><Loader2 size={14} className="animate-spin" /> Envoi...</> : <><Mail size={14} /> Envoyer l'invitation</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modale nouvel athlète */}
      {showModal && (
        <NewAthleteModal
          coaches={coaches}
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); router.refresh(); }}
        />
      )}

      {/* Modale confirmation suppression */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-bold text-lg mb-1 text-[#1a1218]">
              Supprimer {deleteTarget.prenom} {deleteTarget.nom} ?
            </h3>
            <p className="text-gray-500 text-sm mb-5">
              Êtes-vous sûr de vouloir supprimer cet athlète ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
