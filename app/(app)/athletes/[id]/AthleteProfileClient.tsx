"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Athlete, Coach, Tache, Service } from "@/lib/types";
import Badge, { serviceMap } from "@/components/Badge";
import { SERVICE_ORDER, SERVICE_LABELS, SERVICE_TARIFS } from "@/lib/config";
import { formatDateLong } from "@/lib/utils";
import { ArrowLeft, Edit2, Trash2, Save, X, ChevronDown, Link2, RefreshCw, Link2Off, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import ObjectifsPanel from "./ObjectifsPanel";
import PerformancesPanel from "./PerformancesPanel";

interface Props {
  athlete: Athlete;
  coach: Coach | undefined;
  coaches: Coach[];
  taches: Tache[];
  nolioStatus?: "connected" | "error";
  /** True if db.nolioCoachToken exists (global coach token) */
  nolioConnected?: boolean;
}

type Tab = "infos" | "objectifs" | "performances" | "notes" | "historique";

export default function AthleteProfileClient({ athlete, coach, coaches, taches, nolioStatus, nolioConnected: initialNolioConnected }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("infos");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...athlete });
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // ── Nolio ──────────────────────────────────────────────────────────────────
  const [nolioConnected, setNolioConnected] = useState(!!initialNolioConnected);
  const [nolioSyncing, setNolioSyncing] = useState(false);
  const [nolioFlash, setNolioFlash] = useState<"connected" | "error" | null>(nolioStatus ?? null);
  const [nolioDisconnecting, setNolioDisconnecting] = useState(false);
  const [nolioSyncResult, setNolioSyncResult] = useState<{ added: number; updated: number } | null>(null);

  // Clear flash message after 5 s
  useEffect(() => {
    if (!nolioFlash) return;
    const t = setTimeout(() => setNolioFlash(null), 5000);
    return () => clearTimeout(t);
  }, [nolioFlash]);

  async function handleNolioSync() {
    setNolioSyncing(true);
    setNolioSyncResult(null);
    try {
      const res = await fetch("/api/nolio/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setNolioFlash("connected");
        setNolioSyncResult({ added: data.eventsAdded ?? 0, updated: data.eventsUpdated ?? 0 });
      } else {
        console.error("[Nolio sync]", data.error);
        setNolioFlash("error");
      }
    } catch {
      setNolioFlash("error");
    } finally {
      setNolioSyncing(false);
    }
  }

  async function handleNolioDisconnect() {
    setNolioDisconnecting(true);
    try {
      await fetch("/api/nolio/disconnect", { method: "POST" });
      setNolioConnected(false);
      router.refresh();
    } finally {
      setNolioDisconnecting(false);
    }
  }

  // Inline service dropdown in header
  const [currentService, setCurrentService] = useState<Service>(athlete.service);
  const [serviceMenuOpen, setServiceMenuOpen] = useState(false);

  const handleChangeService = async (newService: Service) => {
    const newPrix = SERVICE_TARIFS[newService] ?? 0;
    setCurrentService(newService);
    setServiceMenuOpen(false);
    // Silently update both service and default prix in background
    setForm((prev) => ({ ...prev, service: newService, prixMensuel: newPrix }));
    try {
      await fetch(`/api/athletes/${athlete.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: newService, prixMensuel: newPrix }),
      });
    } catch {
      setCurrentService(athlete.service);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await fetch(`/api/athletes/${athlete.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setEditing(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    await fetch(`/api/athletes/${athlete.id}`, { method: "DELETE" });
    router.push("/athletes");
  };

  const handleArchive = async () => {
    await fetch(`/api/athletes/${athlete.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: "archive" }),
    });
    router.refresh();
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "infos",        label: "Informations" },
    { key: "objectifs",    label: "Objectifs" },
    { key: "performances", label: "Performances" },
    { key: "notes",        label: "Notes" },
    { key: "historique",   label: "Historique" },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/athletes" className="text-gray-400 hover:text-[#7c1d35] transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: coach?.couleur || "#999" }}
            >
              {athlete.prenom.charAt(0)}{athlete.nom.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1a1218]">{athlete.prenom} {athlete.nom}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge value={athlete.discipline} type="discipline" />
                <Badge value={athlete.statut} type="statut_athlete" />
                {/* Inline service dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setServiceMenuOpen((o) => !o)}
                    className="flex items-center gap-1 rounded-full hover:opacity-80 transition-opacity cursor-pointer"
                    title="Changer la formule"
                  >
                    <Badge value={currentService} type="service" />
                    <ChevronDown size={12} className="text-gray-400 -ml-0.5" />
                  </button>
                  {serviceMenuOpen && (
                    <div className="absolute left-0 top-8 z-30 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1">
                      {SERVICE_ORDER.map((svc) => {
                        const info = serviceMap[svc as Service];
                        const defaultPrix = SERVICE_TARIFS[svc] ?? 0;
                        return (
                          <button
                            key={svc}
                            onClick={() => handleChangeService(svc as Service)}
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
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <>
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Edit2 size={14} />
                Modifier
              </button>
              {athlete.statut !== "archive" && (
                <button
                  onClick={handleArchive}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600"
                >
                  Archiver
                </button>
              )}
              <button
                onClick={() => setDeleteConfirm(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
              >
                <Trash2 size={14} />
                Supprimer
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <X size={14} />
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-[#7c1d35] text-white rounded-xl hover:bg-[#9b2445] transition-colors disabled:opacity-50"
              >
                <Save size={14} />
                {loading ? "Sauvegarde..." : "Sauvegarder"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-lg mb-2">Supprimer cet athlète ?</h3>
            <p className="text-gray-600 text-sm mb-4">Cette action est irréversible. Toutes les données seront supprimées.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Annuler</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                tab === key
                  ? "border-[#7c1d35] text-[#7c1d35]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
              {key === "objectifs" && athlete.objectifs && athlete.objectifs.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#7c1d35]/10 text-[#7c1d35] text-xs font-bold">
                  {athlete.objectifs.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB: Informations ── */}
      {tab === "infos" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-[#1a1218] mb-4">Informations personnelles</h3>
            <div className="space-y-4">
              {editing ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Prénom</label>
                      <input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Nom</label>
                      <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Téléphone</label>
                    <input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Adresse</label>
                    <input value={form.adresse || ""} onChange={(e) => setForm({ ...form, adresse: e.target.value })} placeholder="Rue, numéro, code postal, ville..." className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]" />
                  </div>
                </>
              ) : (
                <>
                  <InfoRow label="Email" value={athlete.email || "—"} />
                  <InfoRow label="Téléphone" value={athlete.telephone || "—"} />
                  <InfoRow label="Adresse" value={athlete.adresse || "—"} />
                  <InfoRow label="Membre depuis" value={formatDateLong(athlete.createdAt)} />
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-[#1a1218] mb-4">Coaching & Service</h3>
            <div className="space-y-4">
              {editing ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Coach</label>
                    <select value={form.coachId} onChange={(e) => setForm({ ...form, coachId: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35] bg-white">
                      {coaches.map((c) => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Discipline</label>
                    <select value={form.discipline} onChange={(e) => setForm({ ...form, discipline: e.target.value as Athlete["discipline"] })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35] bg-white">
                      <option value="triathlon">Triathlon</option>
                      <option value="cyclisme">Cyclisme</option>
                      <option value="course_a_pied">Course à pied</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
                    <select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value as Athlete["statut"] })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35] bg-white">
                      <option value="actif">Actif</option>
                      <option value="pause">Pause</option>
                      <option value="archive">Archivé</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Formule</label>
                    <select
                      value={form.service}
                      onChange={(e) => {
                        const svc = e.target.value as Athlete["service"];
                        setForm({ ...form, service: svc, prixMensuel: SERVICE_TARIFS[svc] ?? 0 });
                        setCurrentService(svc);
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35] bg-white"
                    >
                      {SERVICE_ORDER.map((svc) => (
                        <option key={svc} value={svc}>{SERVICE_LABELS[svc]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Objectif de saison</label>
                    <input value={form.objectif} onChange={(e) => setForm({ ...form, objectif: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      ID Nolio
                      <span className="ml-1 text-gray-300 font-normal">(liaison manuelle)</span>
                    </label>
                    <input
                      type="number"
                      value={form.nolioId ?? ""}
                      onChange={(e) => setForm({ ...form, nolioId: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="ex: 86232"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]"
                    />
                    <p className="text-xs text-gray-400 mt-1">Visible sur la page <a href="/equipe/nolio" className="text-[#7c1d35] underline" target="_blank">Équipe → Nolio</a></p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: coach?.couleur || "#999" }}>
                      {coach?.prenom.charAt(0)}{coach?.nom.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Coach assigné</p>
                      <p className="text-sm font-medium">{coach ? `${coach.prenom} ${coach.nom}` : "—"}</p>
                    </div>
                  </div>
                  <InfoRow label="Objectif" value={athlete.objectif || "—"} />
                  {athlete.nolioId && (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Lié à Nolio · ID {athlete.nolioId}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Nolio — carte standalone ── */}
          <div className={`bg-white rounded-2xl p-6 shadow-sm border-2 transition-colors ${
            nolioConnected ? "border-emerald-200" : "border-dashed border-gray-200"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  nolioConnected ? "bg-emerald-100" : "bg-gray-100"
                }`}>
                  <Link2 className={`w-4 h-4 ${nolioConnected ? "text-emerald-600" : "text-gray-400"}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1a1218] text-sm">Synchronisation Nolio</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {nolioConnected
                      ? "Compétitions synchronisées automatiquement dans le calendrier"
                      : "Connecte le compte Nolio pour importer les courses dans le calendrier"}
                  </p>
                </div>
              </div>
              {nolioConnected && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium flex-shrink-0">
                  <CheckCircle2 size={12} />
                  Connecté
                </span>
              )}
            </div>

            {/* Flash messages */}
            {nolioFlash === "connected" && (
              <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl mb-4">
                <CheckCircle2 size={15} className="flex-shrink-0" />
                <span>
                  {nolioStatus === "connected"
                    ? "Nolio connecté avec succès !"
                    : `Synchronisation réussie${nolioSyncResult ? ` — ${nolioSyncResult.added} ajouté(s), ${nolioSyncResult.updated} mis à jour` : ""}`}
                </span>
              </div>
            )}
            {nolioFlash === "error" && (
              <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl mb-4">
                <AlertCircle size={15} className="flex-shrink-0" />
                Erreur lors de la synchronisation. Vérifie la connexion Nolio.
              </div>
            )}

            {nolioConnected ? (
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleNolioSync}
                  disabled={nolioSyncing}
                  className="flex items-center gap-2 px-4 py-2 bg-[#7c1d35] text-white rounded-xl text-sm font-medium hover:bg-[#9b2445] transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={14} className={nolioSyncing ? "animate-spin" : ""} />
                  {nolioSyncing ? "Synchronisation..." : "Synchroniser les courses"}
                </button>
                <button
                  onClick={handleNolioDisconnect}
                  disabled={nolioDisconnecting}
                  className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Link2Off size={14} />
                  Déconnecter
                </button>
              </div>
            ) : (
              <Link
                href={`/api/auth/nolio?athleteId=${athlete.id}`}
                className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-[#7c1d35] text-white rounded-xl text-sm font-medium hover:bg-[#9b2445] transition-colors shadow-sm"
              >
                <Link2 size={15} />
                Connecter Nolio
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Objectifs ── */}
      {tab === "objectifs" && (
        <ObjectifsPanel
          athleteId={athlete.id}
          initialObjectifs={athlete.objectifs ?? []}
        />
      )}

      {/* ── TAB: Performances ── */}
      {tab === "performances" && (
        <PerformancesPanel
          athleteId={athlete.id}
          initialPerformances={athlete.performances}
        />
      )}

      {/* ── TAB: Notes ── */}
      {tab === "notes" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-[#1a1218] mb-4">Notes</h3>
          {editing ? (
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={8}
              placeholder="Ajouter des notes sur cet athlète..."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35] resize-none"
            />
          ) : (
            <div className="p-4 rounded-xl bg-gray-50 min-h-[120px]">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {athlete.notes || "Aucune note pour cet athlète."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Historique ── */}
      {tab === "historique" && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-[#1a1218] mb-4">Historique</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#7c1d35] mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Athlète créé</p>
                <p className="text-xs text-gray-400">{formatDateLong(athlete.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#e8648a] mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Formule souscrite</p>
                <p className="text-xs text-gray-400">
                  {SERVICE_LABELS[athlete.service] ?? athlete.service}
                  {athlete.prixMensuel > 0 ? ` — ${athlete.prixMensuel} €/mois` : " — Gratuit"}
                </p>
              </div>
            </div>
            {taches.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-2">Tâches associées</p>
                <div className="space-y-2">
                  {taches.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50">
                      <p className="text-sm">{t.titre}</p>
                      <Badge value={t.statut} type="statut_tache" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Zone de danger */}
      <div className="mt-8 pt-6 border-t border-red-100">
        <div className="flex items-center justify-between bg-red-50 rounded-2xl px-5 py-4 border border-red-100">
          <div>
            <p className="text-sm font-semibold text-red-700">Supprimer cet athlète</p>
            <p className="text-xs text-red-400 mt-0.5">Cette action est définitive et irréversible</p>
          </div>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <Trash2 size={14} />
            Supprimer l&apos;athlète
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-[#1a1218]">{value}</p>
    </div>
  );
}
