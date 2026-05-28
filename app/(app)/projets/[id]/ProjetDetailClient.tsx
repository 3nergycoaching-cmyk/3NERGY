"use client";

import { useState } from "react";
import Link from "next/link";
import { Projet, Tache, Coach, Todo } from "@/lib/types";
import Badge from "@/components/Badge";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Plus, X, Check, Trash2, Edit2, Save, ListTodo } from "lucide-react";

interface Props {
  projet: Projet;
  taches: Tache[];
  todos: Todo[];
  coaches: Coach[];
  responsable: Coach | undefined;
}

export default function ProjetDetailClient({ projet: initialProjet, taches: initialTaches, todos: initialTodos, coaches, responsable }: Props) {
  const [projet, setProjet] = useState(initialProjet);
  const [taches, setTaches] = useState(initialTaches);
  const [todos, setTodos]   = useState(initialTodos);
  const [editingProjet, setEditingProjet] = useState(false);
  const [projetForm, setProjetForm] = useState({ ...initialProjet });
  const [showNewTache, setShowNewTache] = useState(false);
  const [editingTache, setEditingTache] = useState<string | null>(null);
  const [filterStatut, setFilterStatut] = useState("");
  const [filterPriorite, setFilterPriorite] = useState("");
  const [filterResp, setFilterResp] = useState("");
  const [newTache, setNewTache] = useState({
    titre: "",
    responsable: coaches[0]?.id || "",
    deadline: "",
    statut: "a_faire",
    priorite: "moyenne",
  });
  const [editTacheForm, setEditTacheForm] = useState<Partial<Tache>>({});
  const [loading, setLoading] = useState(false);

  const filteredTaches = taches.filter((t) => {
    const matchStatut = !filterStatut || t.statut === filterStatut;
    const matchPriorite = !filterPriorite || t.priorite === filterPriorite;
    const matchResp = !filterResp || t.responsable === filterResp;
    return matchStatut && matchPriorite && matchResp;
  });

  const handleSaveProjet = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projets/${projet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projetForm),
      });
      const updated = await res.json();
      setProjet(updated);
      setEditingProjet(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTache = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/taches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newTache, projetId: projet.id }),
      });
      const created = await res.json();
      setTaches((prev) => [...prev, created]);
      setShowNewTache(false);
      setNewTache({ titre: "", responsable: coaches[0]?.id || "", deadline: "", statut: "a_faire", priorite: "moyenne" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTache = async (tache: Tache) => {
    const newStatut = tache.statut === "termine" ? "a_faire" : "termine";
    setTaches((prev) => prev.map((t) => (t.id === tache.id ? { ...t, statut: newStatut as Tache["statut"] } : t)));
    await fetch(`/api/taches/${tache.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: newStatut }),
    });
  };

  const handleDeleteTache = async (id: string) => {
    setTaches((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/taches/${id}`, { method: "DELETE" });
  };

  const handleSaveTache = async (id: string) => {
    const res = await fetch(`/api/taches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editTacheForm),
    });
    const updated = await res.json();
    setTaches((prev) => prev.map((t) => (t.id === id ? updated : t)));
    setEditingTache(null);
    setEditTacheForm({});
  };

  const doneCount = taches.filter((t) => t.statut === "termine").length
    + todos.filter((t) => t.statut === "fait").length;
  const totalTaskCount = taches.length + todos.length;

  const handleToggleTodo = async (todo: Todo) => {
    const next = todo.statut === "fait" ? "a_faire" : "fait";
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, statut: next as Todo["statut"] } : t)));
    await fetch(`/api/todos/${todo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: next }),
    });
  };

  const handleDeleteTodo = async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/todos/${id}`, { method: "DELETE" });
  };

  const getCoachName = (id: string) => {
    const c = coaches.find((c) => c.id === id);
    return c ? `${c.prenom} ${c.nom}` : id;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/projets" className="text-gray-400 hover:text-[#7c1d35] transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          {editingProjet ? (
            <input
              value={projetForm.nom}
              onChange={(e) => setProjetForm({ ...projetForm, nom: e.target.value })}
              className="text-2xl font-bold text-[#1a1218] border-b-2 border-[#7c1d35] bg-transparent focus:outline-none w-full"
            />
          ) : (
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#1a1218]">{projet.nom}</h1>
              <Badge value={projet.statut} type="statut_projet" />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {!editingProjet ? (
            <button onClick={() => setEditingProjet(true)} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <Edit2 size={14} /> Modifier
            </button>
          ) : (
            <>
              <button onClick={() => setEditingProjet(false)} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <X size={14} /> Annuler
              </button>
              <button onClick={handleSaveProjet} disabled={loading} className="flex items-center gap-2 px-3 py-2 text-sm bg-[#7c1d35] text-white rounded-xl hover:bg-[#9b2445] transition-colors disabled:opacity-50">
                <Save size={14} /> Sauvegarder
              </button>
            </>
          )}
        </div>
      </div>

      {/* Project Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          {editingProjet ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <textarea value={projetForm.description} onChange={(e) => setProjetForm({ ...projetForm, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35] resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Deadline</label>
                  <input type="date" value={projetForm.deadline} onChange={(e) => setProjetForm({ ...projetForm, deadline: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Responsable</label>
                  <select value={projetForm.responsable} onChange={(e) => setProjetForm({ ...projetForm, responsable: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35] bg-white">
                    {coaches.map((c) => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
                  <select value={projetForm.statut} onChange={(e) => setProjetForm({ ...projetForm, statut: e.target.value as Projet["statut"] })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35] bg-white">
                    <option value="en_cours">En cours</option>
                    <option value="en_pause">En pause</option>
                    <option value="termine">Terminé</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Progression : {projetForm.progression}%</label>
                <input type="range" min={0} max={100} value={projetForm.progression} onChange={(e) => setProjetForm({ ...projetForm, progression: Number(e.target.value) })} className="w-full accent-[#7c1d35]" />
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">{projet.description}</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Progression globale</span>
                <span className="text-sm font-bold text-[#7c1d35]">{projet.progression}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="h-3 rounded-full bg-gradient-to-r from-[#7c1d35] to-[#e8648a]" style={{ width: `${projet.progression}%` }} />
              </div>
            </>
          )}
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <div>
            <p className="text-xs text-gray-500">Responsable</p>
            {responsable && (
              <div className="flex items-center gap-2 mt-1">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: responsable.couleur }}>
                  {responsable.prenom.charAt(0)}{responsable.nom.charAt(0)}
                </div>
                <p className="text-sm font-medium">{responsable.prenom} {responsable.nom}</p>
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500">Deadline</p>
            <p className="text-sm font-medium">{formatDate(projet.deadline)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Tâches</p>
            <p className="text-sm font-medium">{doneCount}/{totalTaskCount} terminées</p>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[#1a1218]">Tâches</h2>
          <button
            onClick={() => setShowNewTache(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-[#7c1d35]/10 text-[#7c1d35] rounded-xl hover:bg-[#7c1d35]/20 transition-colors font-medium"
          >
            <Plus size={14} /> Ajouter une tâche
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none bg-white">
            <option value="">Tous les statuts</option>
            <option value="a_faire">À faire</option>
            <option value="en_cours">En cours</option>
            <option value="termine">Terminé</option>
          </select>
          <select value={filterPriorite} onChange={(e) => setFilterPriorite(e.target.value)} className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none bg-white">
            <option value="">Toutes les priorités</option>
            <option value="haute">Haute</option>
            <option value="moyenne">Moyenne</option>
            <option value="basse">Basse</option>
          </select>
          <select value={filterResp} onChange={(e) => setFilterResp(e.target.value)} className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none bg-white">
            <option value="">Tous les responsables</option>
            {coaches.map((c) => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
          </select>
        </div>

        {showNewTache && (
          <form onSubmit={handleCreateTache} className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Titre *</label>
                <input required value={newTache.titre} onChange={(e) => setNewTache({ ...newTache, titre: e.target.value })} placeholder="Titre de la tâche" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Responsable</label>
                <select value={newTache.responsable} onChange={(e) => setNewTache({ ...newTache, responsable: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35] bg-white">
                  {coaches.map((c) => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Deadline</label>
                <input type="date" value={newTache.deadline} onChange={(e) => setNewTache({ ...newTache, deadline: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Priorité</label>
                <select value={newTache.priorite} onChange={(e) => setNewTache({ ...newTache, priorite: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35] bg-white">
                  <option value="haute">Haute</option>
                  <option value="moyenne">Moyenne</option>
                  <option value="basse">Basse</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
                <select value={newTache.statut} onChange={(e) => setNewTache({ ...newTache, statut: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35] bg-white">
                  <option value="a_faire">À faire</option>
                  <option value="en_cours">En cours</option>
                  <option value="termine">Terminé</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowNewTache(false)} className="px-3 py-1.5 text-xs border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">Annuler</button>
              <button type="submit" disabled={loading} className="px-3 py-1.5 text-xs bg-[#7c1d35] text-white rounded-xl hover:bg-[#9b2445] transition-colors disabled:opacity-50">Créer</button>
            </div>
          </form>
        )}

        {/* Todos liés (depuis la To-Do globale) */}
        {todos.length > 0 && (
          <div className="mb-4 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
              <ListTodo size={12} /> To-Do globale associée
            </p>
            {todos.map((todo) => {
              const isDone = todo.statut === "fait";
              const coach = coaches.find((c) => c.id === todo.responsable);
              return (
                <div key={todo.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isDone ? "bg-gray-50 border-gray-100 opacity-60" : "bg-violet-50/50 border-violet-100 hover:border-violet-200"}`}>
                  <button
                    onClick={() => handleToggleTodo(todo)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${isDone ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-300 hover:border-[#7c1d35]"}`}
                  >
                    {isDone && <Check size={11} />}
                  </button>
                  <p className={`text-sm flex-1 ${isDone ? "line-through text-gray-400" : "text-[#1a1218]"}`}>{todo.titre}</p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-100 text-violet-700 flex-shrink-0">
                    <ListTodo size={9} /> To-Do
                  </span>
                  {coach && (
                    <span className="text-xs text-gray-400 flex-shrink-0">{coach.prenom}</span>
                  )}
                  <Link href="/todo" className="text-xs text-violet-500 hover:underline flex-shrink-0">
                    Modifier
                  </Link>
                  <button onClick={() => handleDeleteTodo(todo.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="space-y-2">
          {filteredTaches.length === 0 && todos.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">Aucune tâche</p>
          ) : filteredTaches.length === 0 ? null : (
            filteredTaches.map((tache) => (
              <div key={tache.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${tache.statut === "termine" ? "bg-gray-50 border-gray-100 opacity-70" : "bg-white border-gray-100 hover:border-gray-200"}`}>
                <button
                  onClick={() => handleToggleTache(tache)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${tache.statut === "termine" ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-300 hover:border-[#7c1d35]"}`}
                >
                  {tache.statut === "termine" && <Check size={11} />}
                </button>

                {editingTache === tache.id ? (
                  <div className="flex-1 grid grid-cols-4 gap-2">
                    <input value={editTacheForm.titre || ""} onChange={(e) => setEditTacheForm({ ...editTacheForm, titre: e.target.value })} className="col-span-2 px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7c1d35]" />
                    <select value={editTacheForm.statut || ""} onChange={(e) => setEditTacheForm({ ...editTacheForm, statut: e.target.value as Tache["statut"] })} className="px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7c1d35] bg-white">
                      <option value="a_faire">À faire</option>
                      <option value="en_cours">En cours</option>
                      <option value="termine">Terminé</option>
                    </select>
                    <select value={editTacheForm.priorite || ""} onChange={(e) => setEditTacheForm({ ...editTacheForm, priorite: e.target.value as Tache["priorite"] })} className="px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7c1d35] bg-white">
                      <option value="haute">Haute</option>
                      <option value="moyenne">Moyenne</option>
                      <option value="basse">Basse</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center gap-3">
                    <p className={`text-sm flex-1 ${tache.statut === "termine" ? "line-through text-gray-400" : "text-[#1a1218]"}`}>{tache.titre}</p>
                    <Badge value={tache.priorite} type="priorite" />
                    <Badge value={tache.statut} type="statut_tache" />
                    <span className="text-xs text-gray-400">{getCoachName(tache.responsable).split(" ")[0]}</span>
                    <span className="text-xs text-gray-400">{formatDate(tache.deadline)}</span>
                  </div>
                )}

                <div className="flex items-center gap-1 ml-2">
                  {editingTache === tache.id ? (
                    <>
                      <button onClick={() => handleSaveTache(tache.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Save size={14} /></button>
                      <button onClick={() => setEditingTache(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"><X size={14} /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingTache(tache.id); setEditTacheForm({ ...tache }); }} className="p-1 text-gray-400 hover:text-[#7c1d35] hover:bg-gray-100 rounded-lg transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => handleDeleteTache(tache.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
