"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coach, Athlete } from "@/lib/types";
import Badge from "@/components/Badge";
import { Plus, X, Edit2, Save, UserCheck } from "lucide-react";

interface Props {
  coaches: Coach[];
  athletes: Athlete[];
}

export default function EquipeClient({ coaches: initialCoaches, athletes }: Props) {
  const router = useRouter();
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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1218]">Équipe</h1>
          <p className="text-gray-500 text-sm mt-1">{coaches.length} coachs dans l&apos;équipe</p>
        </div>
        <button
          onClick={() => setShowNewCoach(true)}
          className="flex items-center gap-2 bg-[#7c1d35] hover:bg-[#9b2445] text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
        >
          <Plus size={16} />
          Ajouter un coach
        </button>
      </div>

      {showNewCoach && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Nouveau coach</h2>
            <button onClick={() => setShowNewCoach(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Prénom *</label>
                <input required value={newForm.prenom} onChange={(e) => setNewForm({ ...newForm, prenom: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nom *</label>
                <input required value={newForm.nom} onChange={(e) => setNewForm({ ...newForm, nom: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Rôle</label>
                <input value={newForm.role} onChange={(e) => setNewForm({ ...newForm, role: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email *</label>
                <input required type="email" value={newForm.email} onChange={(e) => setNewForm({ ...newForm, email: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Téléphone</label>
                <input value={newForm.telephone} onChange={(e) => setNewForm({ ...newForm, telephone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Couleur</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={newForm.couleur} onChange={(e) => setNewForm({ ...newForm, couleur: e.target.value })} className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer" />
                  <span className="text-xs text-gray-500">{newForm.couleur}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowNewCoach(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-[#7c1d35] hover:bg-[#9b2445] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                {loading ? "Création..." : "Créer le coach"}
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
            <div key={coach.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: coach.couleur }}
                  >
                    {coach.prenom.charAt(0)}{coach.nom.charAt(0)}
                  </div>
                  <div>
                    {isEditing ? (
                      <div className="space-y-1">
                        <div className="flex gap-2">
                          <input value={editForm.prenom || ""} onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })} placeholder="Prénom" className="px-2 py-1 border border-gray-200 rounded-lg text-sm w-24 focus:outline-none focus:border-[#7c1d35]" />
                          <input value={editForm.nom || ""} onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })} placeholder="Nom" className="px-2 py-1 border border-gray-200 rounded-lg text-sm w-24 focus:outline-none focus:border-[#7c1d35]" />
                        </div>
                        <input value={editForm.role || ""} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} placeholder="Rôle" className="px-2 py-1 border border-gray-200 rounded-lg text-xs w-full focus:outline-none focus:border-[#7c1d35]" />
                      </div>
                    ) : (
                      <>
                        <p className="font-bold text-[#1a1218]">{coach.prenom} {coach.nom}</p>
                        <p className="text-xs text-gray-500">{coach.role}</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button onClick={() => handleSaveCoach(coach.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors" disabled={loading}><Save size={14} /></button>
                      <button onClick={() => setEditingCoach(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors"><X size={14} /></button>
                    </>
                  ) : (
                    <button
                      onClick={() => { setEditingCoach(coach.id); setEditForm({ ...coach }); }}
                      className="p-2 text-gray-400 hover:text-[#7c1d35] hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Email</label>
                    <input value={editForm.email || ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7c1d35]" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Téléphone</label>
                    <input value={editForm.telephone || ""} onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7c1d35]" />
                  </div>
                </div>
              )}

              {!isEditing && (
                <div className="flex gap-4 text-xs text-gray-500 mb-4">
                  <span>{coach.email}</span>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Athlètes assignés</p>
                  <span className="text-xs font-bold" style={{ color: coach.couleur }}>{coachAthletes.length}</span>
                </div>
                <div className="space-y-2">
                  {coachAthletes.length === 0 ? (
                    <p className="text-xs text-gray-400">Aucun athlète assigné</p>
                  ) : (
                    coachAthletes.map((athlete) => (
                      <div key={athlete.id} className="flex items-center justify-between p-2 rounded-xl bg-gray-50">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: coach.couleur }}>
                            {athlete.prenom.charAt(0)}
                          </div>
                          <p className="text-sm font-medium">{athlete.prenom} {athlete.nom}</p>
                          <Badge value={athlete.discipline} type="discipline" />
                        </div>
                        <button
                          onClick={() => setReassignModal({ coachId: coach.id, athleteId: athlete.id })}
                          className="p-1 text-gray-400 hover:text-[#7c1d35] transition-colors"
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
          <h2 className="font-bold text-[#1a1218]">Réassigner l&apos;athlète</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        {athlete && <p className="text-sm text-gray-600 mb-4">{athlete.prenom} {athlete.nom}</p>}
        <div className="space-y-2 mb-4">
          {coaches.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCoach(c.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${selectedCoach === c.id ? "border-[#7c1d35] bg-[#7c1d35]/5" : "border-gray-100 hover:border-gray-200"}`}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: c.couleur }}>
                {c.prenom.charAt(0)}{c.nom.charAt(0)}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">{c.prenom} {c.nom}</p>
                <p className="text-xs text-gray-400">{c.role}</p>
              </div>
              {c.id === currentCoachId && <span className="ml-auto text-xs text-gray-400">Actuel</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Annuler</button>
          <button
            onClick={() => onReassign(athleteId, selectedCoach)}
            disabled={selectedCoach === currentCoachId}
            className="flex-1 px-4 py-2 bg-[#7c1d35] text-white rounded-xl text-sm font-medium hover:bg-[#9b2445] transition-colors disabled:opacity-50"
          >
            Réassigner
          </button>
        </div>
      </div>
    </div>
  );
}
