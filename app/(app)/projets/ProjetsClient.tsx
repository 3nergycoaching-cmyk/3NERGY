"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Projet, Coach, Tache } from "@/lib/types";
import Badge from "@/components/Badge";
import { formatDate } from "@/lib/utils";
import { Plus, X, ChevronRight, CheckSquare, Trash2 } from "lucide-react";

interface Props {
  projets: Projet[];
  coaches: Coach[];
  taches: Tache[];
}

export default function ProjetsClient({ projets: initialProjets, coaches, taches }: Props) {
  const router = useRouter();
  const [projets, setProjets] = useState(initialProjets);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    responsable: coaches[0]?.id || "",
    deadline: "",
    progression: 0,
    statut: "en_cours",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Projet | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getCoach = (id: string) => coaches.find((c) => c.id === id);
  const getProjetTaches = (projetId: string) => taches.filter((t) => t.projetId === projetId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/projets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const created = await res.json();
      setProjets((prev) => [...prev, created]);
      setShowForm(false);
      setForm({ nom: "", responsable: coaches[0]?.id || "", deadline: "", progression: 0, statut: "en_cours", description: "" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/projets/${deleteTarget.id}`, { method: "DELETE" });
      setProjets((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleArchive = async (id: string) => {
    await fetch(`/api/projets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: "termine" }),
    });
    setProjets((prev) => prev.map((p) => (p.id === id ? { ...p, statut: "termine" as const } : p)));
    router.refresh();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1218]">Projets</h1>
          <p className="text-gray-500 text-sm mt-1">{projets.filter(p => p.statut === "en_cours").length} projets en cours</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#7c1d35] hover:bg-[#9b2445] text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
        >
          <Plus size={16} />
          Nouveau projet
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#1a1218]">Nouveau projet</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nom du projet *</label>
                <input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Responsable</label>
                <select value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35] bg-white">
                  {coaches.map((c) => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Deadline</label>
                <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Progression ({form.progression}%)</label>
                <input type="range" min={0} max={100} value={form.progression} onChange={(e) => setForm({ ...form, progression: Number(e.target.value) })} className="w-full mt-2 accent-[#7c1d35]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
                <select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35] bg-white">
                  <option value="en_cours">En cours</option>
                  <option value="en_pause">En pause</option>
                  <option value="termine">Terminé</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35] resize-none" />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-[#7c1d35] hover:bg-[#9b2445] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                {loading ? "Création..." : "Créer le projet"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modale confirmation suppression */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-bold text-lg mb-1 text-[#1a1218]">
              Supprimer &quot;{deleteTarget.nom}&quot; ?
            </h3>
            <p className="text-gray-500 text-sm mb-5">
              Cette action est irréversible. Le projet sera définitivement supprimé.
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

      <div className="space-y-4">
        {projets.map((projet) => {
          const coach = getCoach(projet.responsable);
          const projetTaches = getProjetTaches(projet.id);
          const doneCount = projetTaches.filter((t) => t.statut === "termine").length;

          return (
            <div key={projet.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-[#1a1218]">{projet.nom}</h3>
                    <Badge value={projet.statut} type="statut_projet" />
                  </div>
                  <p className="text-sm text-gray-500">{projet.description}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {projet.statut !== "termine" && (
                    <button
                      onClick={() => handleArchive(projet.id)}
                      className="px-3 py-1.5 text-xs border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600"
                    >
                      Archiver
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteTarget(projet)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={12} />
                    Supprimer
                  </button>
                  <Link
                    href={`/projets/${projet.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#7c1d35]/10 text-[#7c1d35] rounded-xl hover:bg-[#7c1d35]/20 transition-colors font-medium"
                  >
                    Détail <ChevronRight size={12} />
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-6 mt-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Progression</span>
                    <span className="text-xs font-bold text-[#7c1d35]">{projet.progression}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-[#7c1d35] to-[#e8648a] transition-all"
                      style={{ width: `${projet.progression}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {coach && (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: coach.couleur }}
                      >
                        {coach.prenom.charAt(0)}{coach.nom.charAt(0)}
                      </div>
                      <span className="text-xs font-medium">{coach.prenom}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs">
                    <CheckSquare size={12} className="text-gray-400" />
                    {doneCount}/{projetTaches.length} tâches
                  </div>
                  <div className="text-xs">
                    📅 {formatDate(projet.deadline)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
