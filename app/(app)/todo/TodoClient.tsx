"use client";

import { useState, useCallback, useEffect } from "react";
import { Todo, PrioriteTodo, StatutTodo, Coach, Projet } from "@/lib/types";
import {
  Plus, CheckSquare, Square, Trash2, Edit2, Save, X,
  Flag, ChevronDown, ChevronUp, FolderKanban, StickyNote,
  ArrowUpDown,
} from "lucide-react";

interface Props {
  initialTodos: Todo[];
  coaches: Coach[];
  projets: Projet[];
}

// ── Config ────────────────────────────────────────────────────────────────────

const PRIORITE_CFG: Record<PrioriteTodo, { label: string; dot: string; badge: string }> = {
  haute:   { label: "Haute",   dot: "bg-red-500",   badge: "bg-red-100 text-red-700" },
  moyenne: { label: "Moyenne", dot: "bg-amber-400", badge: "bg-amber-100 text-amber-700" },
  basse:   { label: "Basse",   dot: "bg-gray-300",  badge: "bg-gray-100 text-gray-500" },
};

const STATUT_CFG: Record<StatutTodo, { label: string; badge: string }> = {
  a_faire:  { label: "À faire",  badge: "bg-gray-100 text-gray-600" },
  en_cours: { label: "En cours", badge: "bg-blue-100 text-blue-700" },
  fait:     { label: "Terminé",  badge: "bg-emerald-100 text-emerald-700" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

type SortKey = "priorite" | "deadline";
const PRIORITE_ORDER: PrioriteTodo[] = ["haute", "moyenne", "basse"];

function sortTodos(todos: Todo[], key: SortKey): Todo[] {
  return [...todos].sort((a, b) => {
    if (key === "priorite") {
      return PRIORITE_ORDER.indexOf(a.priorite) - PRIORITE_ORDER.indexOf(b.priorite);
    }
    if (key === "deadline") {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.localeCompare(b.deadline);
    }
    return 0;
  });
}

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : null;

const isOverdue = (deadline?: string) =>
  !!deadline && new Date(deadline) < new Date() && new Date(deadline).toDateString() !== new Date().toDateString();

// ── Blank form ────────────────────────────────────────────────────────────────

const blankForm = (defaultCoach: string) => ({
  titre: "",
  responsable: defaultCoach,
  priorite: "moyenne" as PrioriteTodo,
  deadline: "",
  statut: "a_faire" as StatutTodo,
  projetId: "",
  notes: "",
});

// ── Main ──────────────────────────────────────────────────────────────────────

export default function TodoClient({ initialTodos, coaches, projets }: Props) {
  const [todos, setTodos]         = useState<Todo[]>(initialTodos);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [filterStatut, setFilterStatut] = useState<StatutTodo | "">("");
  const [sortKey, setSortKey]     = useState<SortKey>("priorite");
  const [sortAsc, setSortAsc]     = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm]         = useState(blankForm(coaches[0]?.id || ""));
  const [adding, setAdding]           = useState(false);

  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editForm, setEditForm]     = useState<Partial<Todo>>({});

  const [deleteTarget, setDeleteTarget] = useState<Todo | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  // Close edit on outside click
  const handleGlobalClick = useCallback(() => {
    if (editingId) { setEditingId(null); setEditForm({}); }
  }, [editingId]);
  useEffect(() => {
    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, [handleGlobalClick]);

  const getCoach = (id: string) => coaches.find((c) => c.id === id);
  const getProjet = (id?: string) => projets.find((p) => p.id === id);

  // ── Derived data ───────────────────────────────────────────────────────────

  const pendingCount = (coachId: string) =>
    todos.filter((t) => t.responsable === coachId && t.statut !== "fait").length;

  const filtered = (() => {
    let list = todos;
    if (activeTab !== "all") list = list.filter((t) => t.responsable === activeTab);
    if (filterStatut)        list = list.filter((t) => t.statut === filterStatut);
    const sorted = sortTodos(list, sortKey);
    return sortAsc ? sorted : sorted.reverse();
  })();

  const doneCount = filtered.filter((t) => t.statut === "fait").length;

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.titre.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...addForm,
          projetId:  addForm.projetId  || undefined,
          deadline:  addForm.deadline  || undefined,
          notes:     addForm.notes     || undefined,
        }),
      });
      const created: Todo = await res.json();
      setTodos((prev) => [created, ...prev]);
      setAddForm(blankForm(coaches[0]?.id || ""));
      setShowAddForm(false);
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (todo: Todo) => {
    const next: StatutTodo = todo.statut === "fait" ? "a_faire" : "fait";
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, statut: next } : t)));
    await fetch(`/api/todos/${todo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: next }),
    });
  };

  const handleSaveEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingId) return;
    const payload = {
      ...editForm,
      projetId:  editForm.projetId  || undefined,
      deadline:  editForm.deadline  || undefined,
      notes:     editForm.notes     || undefined,
    };
    const res = await fetch(`/api/todos/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const updated: Todo = await res.json();
    setTodos((prev) => prev.map((t) => (t.id === editingId ? updated : t)));
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setTodos((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    await fetch(`/api/todos/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
  };

  const toggleNotes = (id: string) => {
    setExpandedNotes((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const startEdit = (e: React.MouseEvent, todo: Todo) => {
    e.stopPropagation();
    setEditingId(todo.id);
    setEditForm({ ...todo, projetId: todo.projetId || "", deadline: todo.deadline || "" });
  };

  // ── Classes ────────────────────────────────────────────────────────────────

  const inputCls = "px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35] bg-white";
  const tabBtn = (active: boolean, extra = "") =>
    `relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${active
      ? "border-[#7c1d35] text-[#7c1d35]"
      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} ${extra}`;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="px-8 pt-6 pb-0 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1a1218]">To-do</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {doneCount}/{filtered.length} tâches terminées
              {filtered.length > 0 && (
                <span className="ml-2 text-xs text-gray-400">
                  ({Math.round((doneCount / filtered.length) * 100)}%)
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="flex items-center gap-2 bg-[#7c1d35] hover:bg-[#9b2445] text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
          >
            <Plus size={16} />
            Nouvelle tâche
          </button>
        </div>

        {/* Progress bar */}
        {filtered.length > 0 && (
          <div className="w-full bg-gray-100 rounded-full h-1 mb-4">
            <div
              className="h-1 rounded-full bg-gradient-to-r from-[#7c1d35] to-[#e8648a] transition-all duration-500"
              style={{ width: `${(doneCount / filtered.length) * 100}%` }}
            />
          </div>
        )}

        {/* ── Add form ─────────────────────────────────────────────────── */}
        {showAddForm && (
          <form
            onSubmit={handleAdd}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-[#7c1d35]/20 shadow-md p-5 mb-4 space-y-3"
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-[#1a1218] text-sm">Nouvelle tâche</h3>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            <input
              required
              autoFocus
              type="text"
              value={addForm.titre}
              onChange={(e) => setAddForm({ ...addForm, titre: e.target.value })}
              placeholder="Titre de la tâche..."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Responsable</label>
                <select value={addForm.responsable} onChange={(e) => setAddForm({ ...addForm, responsable: e.target.value })} className={inputCls + " w-full"}>
                  {coaches.map((c) => <option key={c.id} value={c.id}>{c.prenom}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Priorité</label>
                <select value={addForm.priorite} onChange={(e) => setAddForm({ ...addForm, priorite: e.target.value as PrioriteTodo })} className={inputCls + " w-full"}>
                  <option value="haute">🔴 Haute</option>
                  <option value="moyenne">🟡 Moyenne</option>
                  <option value="basse">⚪ Basse</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
                <select value={addForm.statut} onChange={(e) => setAddForm({ ...addForm, statut: e.target.value as StatutTodo })} className={inputCls + " w-full"}>
                  <option value="a_faire">À faire</option>
                  <option value="en_cours">En cours</option>
                  <option value="fait">Terminé</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Deadline</label>
                <input type="date" value={addForm.deadline} onChange={(e) => setAddForm({ ...addForm, deadline: e.target.value })} className={inputCls + " w-full"} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Projet associé</label>
                <select value={addForm.projetId} onChange={(e) => setAddForm({ ...addForm, projetId: e.target.value })} className={inputCls + " w-full"}>
                  <option value="">— Aucun —</option>
                  {projets.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                <input type="text" value={addForm.notes} onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })} placeholder="Note libre..." className={inputCls + " w-full"} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Annuler</button>
              <button type="submit" disabled={adding || !addForm.titre.trim()} className="flex items-center gap-2 px-4 py-2 text-sm bg-[#7c1d35] text-white rounded-xl hover:bg-[#9b2445] transition-colors disabled:opacity-50">
                <Plus size={14} />
                {adding ? "Ajout..." : "Ajouter"}
              </button>
            </div>
          </form>
        )}

        {/* ── Responsable tabs ─────────────────────────────────────────── */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex gap-0 min-w-max">
            {/* Tous */}
            <button onClick={() => setActiveTab("all")} className={tabBtn(activeTab === "all")}>
              Tous
              {todos.filter((t) => t.statut !== "fait").length > 0 && (
                <span className="ml-1 min-w-[18px] h-[18px] rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold inline-flex items-center justify-center px-1">
                  {todos.filter((t) => t.statut !== "fait").length}
                </span>
              )}
            </button>
            {coaches.map((coach) => {
              const pending = pendingCount(coach.id);
              const isActive = activeTab === coach.id;
              return (
                <button key={coach.id} onClick={() => setActiveTab(coach.id)} className={tabBtn(isActive)}>
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                    style={{ backgroundColor: coach.couleur }}
                  >
                    {coach.prenom.charAt(0)}
                  </span>
                  {coach.prenom}
                  {pending > 0 && (
                    <span
                      className="ml-1 min-w-[18px] h-[18px] rounded-full text-white text-[10px] font-bold inline-flex items-center justify-center px-1"
                      style={{ backgroundColor: coach.couleur }}
                    >
                      {pending}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Filter + sort bar ────────────────────────────────────────── */}
        <div className="flex items-center gap-2 pt-3 pb-2 flex-wrap">
          {/* Statut filters */}
          <div className="flex gap-1">
            {([
              { key: "",         label: "Toutes" },
              { key: "a_faire",  label: "À faire" },
              { key: "en_cours", label: "En cours" },
              { key: "fait",     label: "Terminées" },
            ] as { key: StatutTodo | ""; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterStatut(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterStatut === key
                    ? "bg-[#7c1d35] text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {label}
                {key !== "" && (
                  <span className="ml-1 text-[10px] opacity-70">
                    ({todos.filter((t) => t.statut === key && (activeTab === "all" || t.responsable === activeTab)).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block" />

          {/* Sort */}
          <div className="flex gap-1">
            <button
              onClick={() => { if (sortKey === "priorite") setSortAsc((v) => !v); else { setSortKey("priorite"); setSortAsc(true); } }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                sortKey === "priorite" ? "bg-[#7c1d35]/10 text-[#7c1d35] border border-[#7c1d35]/20" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <ArrowUpDown size={11} />
              Priorité
              {sortKey === "priorite" && (sortAsc ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
            </button>
            <button
              onClick={() => { if (sortKey === "deadline") setSortAsc((v) => !v); else { setSortKey("deadline"); setSortAsc(true); } }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                sortKey === "deadline" ? "bg-[#7c1d35]/10 text-[#7c1d35] border border-[#7c1d35]/20" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <ArrowUpDown size={11} />
              Deadline
              {sortKey === "deadline" && (sortAsc ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
            </button>
          </div>
        </div>
      </div>

      {/* ── Task list ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm mt-2">
            <CheckSquare className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-gray-400 font-medium">Aucune tâche à afficher</p>
            <p className="text-gray-300 text-sm mt-1">Ajoutez une tâche avec le bouton en haut à droite</p>
          </div>
        ) : (
          <div className="space-y-1.5 mt-2">
            {filtered.map((todo) => {
              const isEditing  = editingId === todo.id;
              const isDone     = todo.statut === "fait";
              const pCfg       = PRIORITE_CFG[todo.priorite];
              const coach      = getCoach(todo.responsable);
              const projet     = getProjet(todo.projetId);
              const overdue    = !isDone && isOverdue(todo.deadline);
              const noteOpen   = expandedNotes.has(todo.id);

              if (isEditing) {
                // ── Edit mode ────────────────────────────────────────────
                return (
                  <div
                    key={todo.id}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl border-2 border-[#7c1d35]/30 shadow-md p-4 space-y-3"
                  >
                    <input
                      autoFocus
                      type="text"
                      value={editForm.titre || ""}
                      onChange={(e) => setEditForm({ ...editForm, titre: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]"
                    />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Responsable</label>
                        <select value={editForm.responsable || ""} onChange={(e) => setEditForm({ ...editForm, responsable: e.target.value })} className={inputCls + " w-full"}>
                          {coaches.map((c) => <option key={c.id} value={c.id}>{c.prenom}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Priorité</label>
                        <select value={editForm.priorite || ""} onChange={(e) => setEditForm({ ...editForm, priorite: e.target.value as PrioriteTodo })} className={inputCls + " w-full"}>
                          <option value="haute">🔴 Haute</option>
                          <option value="moyenne">🟡 Moyenne</option>
                          <option value="basse">⚪ Basse</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
                        <select value={editForm.statut || ""} onChange={(e) => setEditForm({ ...editForm, statut: e.target.value as StatutTodo })} className={inputCls + " w-full"}>
                          <option value="a_faire">À faire</option>
                          <option value="en_cours">En cours</option>
                          <option value="fait">Terminé</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Deadline</label>
                        <input type="date" value={editForm.deadline || ""} onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })} className={inputCls + " w-full"} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Projet associé</label>
                        <select value={editForm.projetId || ""} onChange={(e) => setEditForm({ ...editForm, projetId: e.target.value })} className={inputCls + " w-full"}>
                          <option value="">— Aucun —</option>
                          {projets.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                        <input type="text" value={editForm.notes || ""} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Note libre..." className={inputCls + " w-full"} />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={(e) => { e.stopPropagation(); setEditingId(null); setEditForm({}); }} className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                        <X size={12} /> Annuler
                      </button>
                      <button onClick={handleSaveEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#7c1d35] text-white rounded-xl hover:bg-[#9b2445] transition-colors">
                        <Save size={12} /> Sauvegarder
                      </button>
                    </div>
                  </div>
                );
              }

              // ── View mode ─────────────────────────────────────────────
              return (
                <div key={todo.id} className="group">
                  <div
                    className={`flex items-center gap-3 bg-white rounded-xl px-4 py-3 border transition-all ${
                      isDone
                        ? "border-gray-100 opacity-60"
                        : "border-gray-100 hover:border-[#7c1d35]/20 hover:shadow-sm"
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggle(todo)}
                      className="flex-shrink-0 transition-colors"
                      title={isDone ? "Marquer comme à faire" : "Marquer comme terminé"}
                    >
                      {isDone
                        ? <CheckSquare className="w-5 h-5 text-emerald-500" />
                        : <Square className="w-5 h-5 text-gray-300 hover:text-[#7c1d35]" />
                      }
                    </button>

                    {/* Priority dot */}
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${pCfg.dot}`} />

                    {/* Title */}
                    <span
                      className={`flex-1 min-w-0 text-sm font-medium truncate ${
                        isDone ? "line-through text-gray-400" : "text-[#1a1218]"
                      }`}
                    >
                      {todo.titre}
                    </span>

                    {/* Responsable badge */}
                    {coach && (
                      <span
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ backgroundColor: coach.couleur }}
                        title={coach.prenom}
                      >
                        {coach.prenom.charAt(0)}
                      </span>
                    )}

                    {/* Statut badge (only if not À faire or Terminé — show En cours) */}
                    {todo.statut === "en_cours" && (
                      <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">
                        En cours
                      </span>
                    )}

                    {/* Priorité badge */}
                    <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${pCfg.badge}`}>
                      {pCfg.label}
                    </span>

                    {/* Projet badge */}
                    {projet && (
                      <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-100 text-violet-700 max-w-[120px] truncate">
                        <FolderKanban size={9} className="flex-shrink-0" />
                        <span className="truncate">{projet.nom}</span>
                      </span>
                    )}

                    {/* Deadline */}
                    {todo.deadline && (
                      <span className={`flex-shrink-0 text-xs flex items-center gap-1 ${
                        overdue ? "text-red-500 font-medium" : isDone ? "text-gray-300" : "text-gray-400"
                      }`}>
                        <Flag size={10} />
                        {fmtDate(todo.deadline)}
                      </span>
                    )}

                    {/* Notes indicator */}
                    {todo.notes && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleNotes(todo.id); }}
                        className="flex-shrink-0 text-gray-300 hover:text-amber-500 transition-colors"
                        title="Afficher les notes"
                      >
                        <StickyNote size={13} className={noteOpen ? "text-amber-500" : ""} />
                      </button>
                    )}

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => startEdit(e, todo)}
                        className="p-1 text-gray-400 hover:text-[#7c1d35] hover:bg-[#7c1d35]/5 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(todo); }}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Notes expansion */}
                  {noteOpen && todo.notes && (
                    <div className="ml-12 mt-0.5 mb-1 px-4 py-2.5 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800">
                      {todo.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Delete confirm modal ─────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-11 h-11 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="font-bold text-[#1a1218] mb-1">Supprimer cette tâche ?</h3>
            <p className="text-gray-500 text-sm mb-5 truncate">{deleteTarget.titre}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
