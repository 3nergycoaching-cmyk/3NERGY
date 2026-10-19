"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coach, Athlete } from "@/lib/types";
import Badge from "@/components/Badge";
import { Plus, X, Edit2, Save, UserCheck, Users, Database } from "lucide-react";
import NolioTable from "./nolio/NolioTable";
import NolioConnectionActions from "./nolio/NolioConnectionActions";
import { NolioEntry } from "./page";

interface Props {
  coaches: Coach[];
  athletes: Athlete[];
  nolioAthletes: NolioEntry[];
  fetchError: string | null;
  isConnected: boolean;
  hasError: boolean;
  initialLinks: Record<number, string>;
  emailLinks: Record<string, string>;
}

type Tab = "coachs" | "nolio";

export default function EquipeClient({
  coaches: initialCoaches,
  athletes,
  nolioAthletes,
  fetchError,
  isConnected,
  hasError,
  initialLinks,
  emailLinks,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("coachs");
  const [coaches, setCoaches] = useState(initialCoaches);
  const [showNewCoach, setShowNewCoach] = useState(false);
  const [editingCoach, setEditingCoach] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Coach>>({});
  const [newForm, setNewForm] = useState({ nom: "", prenom: "", email: "", telephone: "", couleur: "#7c3aed", role: "" });
  const [loading, setLoading] = useState(false);
  const [reassignModal, setReassignModal] = useState<{ coachId: string; athleteId: string } | null>(null);

  const getCoachAthletes = (coachId: string) =>
    athletes.filter((a) => a.coachId === coachId && a.statut !== "archive");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/coaches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newForm),
      });
      const created = await res.json();
      setCoaches((prev) => [...prev, created]);
      setShowNewCoach(false);
      setNewForm({ nom: "", prenom: "", email: "", telephone: "", couleur: "#7c3aed", role: "" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCoach = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/coaches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const updated = await res.json();
      setCoaches((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setEditingCoach(null);
      setEditForm({});
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = async (athleteId: string, newCoachId: string) => {
    await fetch(`/api/athletes/${athleteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coachId: newCoachId }),
    });
    setReassignModal(null);
    router.refresh();
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "coachs", label: "Entraîneurs", icon: <Users size={15} /> },
    { id: "nolio", label: "Nolio", icon: <Database size={15} /> },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "#0F172A" }}>Équipe</h1>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>
            {coaches.length} entraîneurs · {nolioAthletes.length} athlètes Nolio
          </p>
        </div>
        {tab === "coachs" && (
          <button
            onClick={() => setShowNewCoach(true)}
            className="flex items-center gap-2 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
            style={{ backgroundColor: "#E6007E" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#C00069")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#E6007E")}
          >
            <Plus size={16} />
            Ajouter un entraîneur
          </button>
        )}
        {tab === "nolio" && (
          <NolioConnectionActions isConnected={isConnected} hasError={hasError} />
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={
              tab === t.id
                ? { backgroundColor: "#fff", color: "#E6007E", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                : { color: "#64748B" }
            }
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Coachs ────────────────────────────────────────────────────── */}
      {tab === "coachs" && (
        <>
          {showNewCoach && (
            <div className="bg-white rounded-2xl p-6 border mb-6" style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold" style={{ color: "#0F172A" }}>Nouvel entraîneur</h2>
                <button onClick={() => setShowNewCoach(false)} style={{ color: "#64748B" }}><X size={18} /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Prénom *</label>
                    <input required value={newForm.prenom} onChange={(e) => setNewForm({ ...newForm, prenom: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E6007E]/20 focus:border-[#E6007E]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Nom *</label>
                    <input required value={newForm.nom} onChange={(e) => setNewForm({ ...newForm, nom: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E6007E]/20 focus:border-[#E6007E]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Rôle</label>
                    <input value={newForm.role} onChange={(e) => setNewForm({ ...newForm, role: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E6007E]/20 focus:border-[#E6007E]" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Email *</label>
                    <input required type="email" value={newForm.email} onChange={(e) => setNewForm({ ...newForm, email: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E6007E]/20 focus:border-[#E6007E]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Téléphone</label>
                    <input value={newForm.telephone} onChange={(e) => setNewForm({ ...newForm, telephone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E6007E]/20 focus:border-[#E6007E]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Couleur</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={newForm.couleur} onChange={(e) => setNewForm({ ...newForm, couleur: e.target.value })} className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer" />
                      <span className="text-xs" style={{ color: "#64748B" }}>{newForm.couleur}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowNewCoach(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium transition-colors" style={{ color: "#64748B" }}>Annuler</button>
                  <button type="submit" disabled={loading} className="px-4 py-2 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: "#E6007E" }}>
                    {loading ? "Création..." : "Créer l'entraîneur"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {coaches.map((coach) => {
              const coachAthletes = getCoachAthletes(coach.id);
              const isEditing = editingCoach === coach.id;

              return (
                <div key={coach.id} className="bg-white rounded-2xl p-6 border" style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: coach.couleur }}>
                        {coach.prenom.charAt(0)}{coach.nom.charAt(0)}
                      </div>
                      <div>
                        {isEditing ? (
                          <div className="space-y-1">
                            <div className="flex gap-2">
                              <input value={editForm.prenom || ""} onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })} placeholder="Prénom" className="px-2 py-1 border border-gray-200 rounded-lg text-sm w-24 focus:outline-none focus:border-[#E6007E]" />
                              <input value={editForm.nom || ""} onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })} placeholder="Nom" className="px-2 py-1 border border-gray-200 rounded-lg text-sm w-24 focus:outline-none focus:border-[#E6007E]" />
                            </div>
                            <input value={editForm.role || ""} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} placeholder="Rôle" className="px-2 py-1 border border-gray-200 rounded-lg text-xs w-full focus:outline-none focus:border-[#E6007E]" />
                          </div>
                        ) : (
                          <>
                            <p className="font-bold" style={{ color: "#0F172A" }}>{coach.prenom} {coach.nom}</p>
                            <p className="text-xs" style={{ color: "#64748B" }}>{coach.role}</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <button onClick={() => handleSaveCoach(coach.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors" disabled={loading}><Save size={14} /></button>
                          <button onClick={() => setEditingCoach(null)} className="p-2 rounded-xl transition-colors" style={{ color: "#64748B" }}><X size={14} /></button>
                        </>
                      ) : (
                        <button
                          onClick={() => { setEditingCoach(coach.id); setEditForm({ ...coach }); }}
                          className="p-2 rounded-xl transition-colors hover:bg-gray-100"
                          style={{ color: "#64748B" }}
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="block text-xs mb-1" style={{ color: "#64748B" }}>Email</label>
                        <input value={editForm.email || ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#E6007E]" />
                      </div>
                      <div>
                        <label className="block text-xs mb-1" style={{ color: "#64748B" }}>Téléphone</label>
                        <input value={editForm.telephone || ""} onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#E6007E]" />
                      </div>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="flex gap-4 text-xs mb-4" style={{ color: "#64748B" }}>
                      <span>{coach.email}</span>
                    </div>
                  )}

                  <div className="border-t pt-4" style={{ borderColor: "#F1F5F9" }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium" style={{ color: "#64748B" }}>Athlètes assignés</p>
                      <span className="text-xs font-bold" style={{ color: coach.couleur }}>{coachAthletes.length}</span>
                    </div>
                    <div className="space-y-2">
                      {coachAthletes.length === 0 ? (
                        <p className="text-xs" style={{ color: "#94A3B8" }}>Aucun athlète assigné</p>
                      ) : (
                        coachAthletes.map((athlete) => (
                          <div key={athlete.id} className="flex items-center justify-between p-2 rounded-xl" style={{ backgroundColor: "#F8FAFC" }}>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: coach.couleur }}>
                                {athlete.prenom.charAt(0)}
                              </div>
                              <p className="text-sm font-medium" style={{ color: "#0F172A" }}>{athlete.prenom} {athlete.nom}</p>
                              <Badge value={athlete.discipline} type="discipline" />
                            </div>
                            <button
                              onClick={() => setReassignModal({ coachId: coach.id, athleteId: athlete.id })}
                              className="p-1 transition-colors hover:text-[#E6007E]"
                              style={{ color: "#64748B" }}
                              title="Réassigner"
                            >
                              <UserCheck size={13} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {reassignModal && (
            <ReassignModal
              athleteId={reassignModal.athleteId}
              currentCoachId={reassignModal.coachId}
              coaches={coaches}
              athletes={athletes}
              onClose={() => setReassignModal(null)}
              onReassign={handleReassign}
            />
          )}
        </>
      )}

      {/* ── Tab: Nolio ─────────────────────────────────────────────────────── */}
      {tab === "nolio" && (
        <>
          {fetchError && !isConnected && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {fetchError}
            </div>
          )}
          {!isConnected && !hasError && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#F1F5F9" }}>
                <Database size={28} style={{ color: "#94A3B8" }} />
              </div>
              <p className="font-semibold mb-1" style={{ color: "#0F172A" }}>Nolio non connecté</p>
              <p className="text-sm mb-6" style={{ color: "#64748B" }}>Connecte ton compte Nolio pour synchroniser les athlètes.</p>
            </div>
          )}
          {(isConnected || nolioAthletes.length > 0) && (
            <NolioTable
              nolioAthletes={nolioAthletes}
              crmAthletes={athletes}
              coaches={coaches}
              initialLinks={initialLinks}
              emailLinks={emailLinks}
            />
          )}
        </>
      )}
    </div>
  );
}

function ReassignModal({
  athleteId,
  currentCoachId,
  coaches,
  athletes,
  onClose,
  onReassign,
}: {
  athleteId: string;
  currentCoachId: string;
  coaches: Coach[];
  athletes: Athlete[];
  onClose: () => void;
  onReassign: (athleteId: string, coachId: string) => void;
}) {
  const athlete = athletes.find((a) => a.id === athleteId);
  const [selectedCoach, setSelectedCoach] = useState(currentCoachId);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold" style={{ color: "#0F172A" }}>Réassigner l&apos;athlète</h2>
          <button onClick={onClose} style={{ color: "#64748B" }}><X size={18} /></button>
        </div>
        {athlete && <p className="text-sm mb-4" style={{ color: "#64748B" }}>{athlete.prenom} {athlete.nom}</p>}
        <div className="space-y-2 mb-4">
          {coaches.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCoach(c.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${selectedCoach === c.id ? "border-[#E6007E] bg-[#E6007E]/5" : "border-gray-100 hover:border-gray-200"}`}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: c.couleur }}>
                {c.prenom.charAt(0)}{c.nom.charAt(0)}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">{c.prenom} {c.nom}</p>
                <p className="text-xs" style={{ color: "#64748B" }}>{c.role}</p>
              </div>
              {c.id === currentCoachId && <span className="ml-auto text-xs" style={{ color: "#64748B" }}>Actuel</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium transition-colors" style={{ color: "#64748B" }}>Annuler</button>
          <button
            onClick={() => onReassign(athleteId, selectedCoach)}
            disabled={selectedCoach === currentCoachId}
            className="flex-1 px-4 py-2 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#E6007E" }}
          >
            Réassigner
          </button>
        </div>
      </div>
    </div>
  );
}
