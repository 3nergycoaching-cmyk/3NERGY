"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Lead, Coach, StatutLead } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import {
  Plus, X, Globe, MessageCircle, MoreVertical,
  UserCheck, Trash2, CheckCircle2,
} from "lucide-react";
import Badge from "@/components/Badge";

interface Props {
  leads: Lead[];
  coaches: Coach[];
}

// ── Columns (4 steps + perdu aside) ──────────────────────────────────────────

const MAIN_COLUMNS: { key: StatutLead; label: string; color: string; dot: string }[] = [
  { key: "a_contacter",      label: "À contacter",           color: "bg-gray-50 border-gray-200",    dot: "bg-gray-400" },
  { key: "appel_effectue",   label: "Appel effectué",        color: "bg-blue-50 border-blue-200",    dot: "bg-blue-500" },
  { key: "en_reflexion",     label: "En réflexion",          color: "bg-amber-50 border-amber-200",  dot: "bg-amber-500" },
  { key: "demarches_admin",  label: "Démarches admin",       color: "bg-violet-50 border-violet-200",dot: "bg-violet-500" },
  { key: "acompte_recu",     label: "Acompte reçu",          color: "bg-orange-50 border-orange-200",dot: "bg-orange-500" },
  { key: "coaching_demarre", label: "Coaching démarré",      color: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const sourceIcon = (source: string) => {
  switch (source) {
    case "instagram":       return <span className="text-[10px] font-bold text-pink-500">IG</span>;
    case "site_web":        return <Globe size={12} />;
    case "bouche_a_oreille": return <MessageCircle size={12} />;
    default:                return null;
  }
};

const sourceLabel = (source: string) => {
  const map: Record<string, string> = {
    instagram: "Instagram",
    bouche_a_oreille: "Bouche-à-oreille",
    site_web: "Site web",
    autre: "Autre",
  };
  return map[source] || source;
};

// ── Main component ────────────────────────────────────────────────────────────

export default function AcquisitionClient({ leads: initialLeads, coaches }: Props) {
  const router = useRouter();
  const [leads, setLeads]       = useState(initialLeads);
  const [showNewForm, setShowNewForm]   = useState(false);
  const [menuOpen, setMenuOpen]         = useState<string | null>(null);
  const [editingLead, setEditingLead]   = useState<Lead | null>(null);
  const [convertLead, setConvertLead]   = useState<Lead | null>(null);
  const dragId  = useRef<string | null>(null);
  const [dragOver, setDragOver] = useState<StatutLead | null>(null);

  const getCoachName = (id?: string) => {
    if (!id) return null;
    const c = coaches.find((c) => c.id === id);
    return c ? `${c.prenom} ${c.nom}` : null;
  };

  const getColumnLeads = (statut: StatutLead) =>
    leads.filter((l) => l.statut === statut);

  // Drag & drop
  const handleDragStart = (id: string) => { dragId.current = id; };
  const handleDrop = async (targetStatut: StatutLead) => {
    if (!dragId.current) return;
    const id = dragId.current;
    dragId.current = null;
    setDragOver(null);
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, statut: targetStatut } : l)));
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: targetStatut }),
    });
    router.refresh();
  };

  // Arrow navigation (main columns only)
  const handleMoveStep = async (lead: Lead, direction: 1 | -1) => {
    const idx = MAIN_COLUMNS.findIndex((c) => c.key === lead.statut);
    if (idx === -1) return; // "perdu" column — no movement
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= MAIN_COLUMNS.length) return;
    const newStatut = MAIN_COLUMNS[newIdx].key;
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, statut: newStatut } : l)));
    await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: newStatut }),
    });
  };

  const handleMarkPerdu = async (lead: Lead) => {
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, statut: "perdu" } : l)));
    setMenuOpen(null);
    await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: "perdu" }),
    });
  };

  const handleDelete = async (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setMenuOpen(null);
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
  };

  const handleConvertClick = (lead: Lead) => {
    setConvertLead(lead);
    setMenuOpen(null);
  };

  const activeLeads = leads.filter((l) => l.statut !== "perdu");

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1218]">Acquisition</h1>
          <p className="text-gray-500 text-sm mt-1">{activeLeads.length} leads actifs dans le pipeline</p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 bg-[#7c1d35] hover:bg-[#9b2445] text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
        >
          <Plus size={16} />
          Nouveau lead
        </button>
      </div>

      {/* ── Main kanban (4 steps) ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {MAIN_COLUMNS.map((col) => {
          const colLeads = getColumnLeads(col.key);
          return (
            <div
              key={col.key}
              className={`rounded-2xl border-2 p-3 min-h-[400px] transition-all ${col.color} ${
                dragOver === col.key ? "ring-2 ring-[#7c1d35] ring-offset-1" : ""
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(col.key); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(col.key)}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${col.dot}`} />
                  <h3 className="font-semibold text-sm text-gray-700">{col.label}</h3>
                </div>
                <span className="text-xs font-bold text-gray-500 bg-white/60 px-2 py-0.5 rounded-full">
                  {colLeads.length}
                </span>
              </div>
              <div className="space-y-2">
                {colLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    columns={MAIN_COLUMNS}
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                    onDragStart={() => handleDragStart(lead.id)}
                    onMove={handleMoveStep}
                    onDelete={handleDelete}
                    onEdit={() => { setEditingLead(lead); setMenuOpen(null); }}
                    onConvert={handleConvertClick}
                    onMarkPerdu={handleMarkPerdu}
                    getCoachName={getCoachName}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Perdu column (separate, smaller) ─────────────────────────────── */}
      {(() => {
        const perduLeads = getColumnLeads("perdu");
        return perduLeads.length > 0 ? (
          <div
            className={`rounded-2xl border-2 p-3 border-gray-200 bg-gray-50 ${
              dragOver === "perdu" ? "ring-2 ring-red-400 ring-offset-1" : ""
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver("perdu"); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={() => handleDrop("perdu")}
          >
            <div className="flex items-center gap-2 mb-3 px-1">
              <h3 className="font-semibold text-sm text-gray-400">Perdu</h3>
              <span className="text-xs font-bold text-gray-400 bg-white/80 px-2 py-0.5 rounded-full">
                {perduLeads.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {perduLeads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={() => handleDragStart(lead.id)}
                  className="bg-white rounded-xl px-3 py-2 border border-gray-200 text-xs text-gray-500 flex items-center gap-2 cursor-grab"
                >
                  <span className="font-medium">{lead.prenom} {lead.nom}</span>
                  <Badge value={lead.discipline} type="discipline" />
                  <button
                    onClick={() => handleDelete(lead.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors ml-1"
                    title="Supprimer"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Drop target even when empty
          <div
            className={`rounded-2xl border-2 border-dashed p-3 border-gray-200 ${
              dragOver === "perdu" ? "ring-2 ring-red-400 ring-offset-1 bg-red-50" : ""
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver("perdu"); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={() => handleDrop("perdu")}
          >
            <p className="text-xs text-gray-300 text-center py-2">Glisser ici pour marquer comme perdu</p>
          </div>
        );
      })()}

      {/* Modals */}
      {showNewForm && (
        <NewLeadModal
          coaches={coaches}
          onClose={() => setShowNewForm(false)}
          onCreated={(lead) => { setLeads((prev) => [...prev, lead]); setShowNewForm(false); }}
        />
      )}
      {editingLead && (
        <EditLeadModal
          lead={editingLead}
          coaches={coaches}
          onClose={() => setEditingLead(null)}
          onUpdated={(updated) => {
            setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
            setEditingLead(null);
          }}
        />
      )}
      {convertLead && (
        <ConvertLeadModal
          lead={convertLead}
          coaches={coaches}
          onClose={() => setConvertLead(null)}
          onConverted={(updatedLead) => {
            setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)));
            setConvertLead(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// ── LeadCard ─────────────────────────────────────────────────────────────────

function LeadCard({
  lead, columns, menuOpen, setMenuOpen,
  onDragStart, onMove, onDelete, onEdit, onConvert, onMarkPerdu, getCoachName,
}: {
  lead: Lead;
  columns: typeof MAIN_COLUMNS;
  menuOpen: string | null;
  setMenuOpen: (id: string | null) => void;
  onDragStart: () => void;
  onMove: (lead: Lead, dir: 1 | -1) => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
  onConvert: (lead: Lead) => void;
  onMarkPerdu: (lead: Lead) => void;
  getCoachName: (id?: string) => string | null;
}) {
  const colIdx = columns.findIndex((c) => c.key === lead.statut);
  const canMoveLeft  = colIdx > 0;
  const canMoveRight = colIdx < columns.length - 1;
  const isCoachingDemarre = lead.statut === "coaching_demarre";
  const coachName = getCoachName(lead.coachId);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 cursor-grab active:opacity-60 active:cursor-grabbing select-none relative group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0 pr-2">
          <p className="font-semibold text-sm text-[#1a1218] truncate">{lead.prenom} {lead.nom}</p>
          <p className="text-xs text-gray-500 truncate">{lead.email}</p>
        </div>
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setMenuOpen(menuOpen === lead.id ? null : lead.id)}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <MoreVertical size={14} />
          </button>
          {menuOpen === lead.id && (
            <div className="absolute right-0 top-6 z-20 bg-white rounded-xl shadow-lg border border-gray-100 min-w-[160px] py-1">
              <button onClick={onEdit} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors">
                Modifier
              </button>
              {!lead.converti && (
                <button
                  onClick={() => onMarkPerdu(lead)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 text-red-600 transition-colors"
                >
                  Marquer comme perdu
                </button>
              )}
              <button
                onClick={() => onDelete(lead.id)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 text-red-600 transition-colors flex items-center gap-2"
              >
                <Trash2 size={12} /> Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <Badge value={lead.discipline} type="discipline" />
        <span className="text-xs text-gray-400 flex items-center gap-1">
          {sourceIcon(lead.source)} {sourceLabel(lead.source)}
        </span>
        {lead.converti && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
            <CheckCircle2 size={10} /> Converti
          </span>
        )}
      </div>

      {/* Coach assigné */}
      {coachName && (
        <p className="text-xs text-gray-400 mb-1">
          <span className="font-medium text-gray-600">{coachName}</span>
        </p>
      )}

      {/* Date début coaching */}
      {lead.dateDebutCoaching && (
        <p className="text-xs text-gray-400 mb-1">
          Début : <span className="font-medium">{new Date(lead.dateDebutCoaching).toLocaleDateString("fr-FR")}</span>
        </p>
      )}

      {lead.notes && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-2 bg-gray-50 rounded-lg p-2">{lead.notes}</p>
      )}

      {/* Convertir button (coaching démarré + non encore converti) */}
      {isCoachingDemarre && !lead.converti && (
        <button
          onClick={() => onConvert(lead)}
          className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <UserCheck size={12} />
          Convertir en athlète
        </button>
      )}

      {/* Navigation arrows + date */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-400">{formatDate(lead.createdAt)}</p>
        <div className="flex gap-1">
          {canMoveLeft && !lead.converti && (
            <button
              onClick={() => onMove(lead, -1)}
              className="px-2 py-0.5 text-xs rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
            >←</button>
          )}
          {canMoveRight && !lead.converti && (
            <button
              onClick={() => onMove(lead, 1)}
              className="px-2 py-0.5 text-xs rounded-lg bg-[#7c1d35]/10 hover:bg-[#7c1d35]/20 transition-colors text-[#7c1d35]"
            >→</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── NewLeadModal ──────────────────────────────────────────────────────────────

function NewLeadModal({
  coaches,
  onClose,
  onCreated,
}: {
  coaches: Coach[];
  onClose: () => void;
  onCreated: (lead: Lead) => void;
}) {
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    source: "instagram",
    discipline: "triathlon",
    statut: "a_contacter",
    notes: "",
    coachId: "",
    dateDebutCoaching: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, coachId: form.coachId || undefined, dateDebutCoaching: form.dateDebutCoaching || undefined };
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const lead = await res.json();
      onCreated(lead);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]";
  const selectCls = inputCls + " bg-white";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold">Nouveau lead</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Prénom *</label>
              <input required value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nom *</label>
              <input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email *</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Téléphone</label>
              <input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Source</label>
              <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className={selectCls}>
                <option value="instagram">Instagram</option>
                <option value="bouche_a_oreille">Bouche-à-oreille</option>
                <option value="site_web">Site web</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Discipline</label>
              <select value={form.discipline} onChange={(e) => setForm({ ...form, discipline: e.target.value })} className={selectCls}>
                <option value="triathlon">Triathlon</option>
                <option value="cyclisme">Cyclisme</option>
                <option value="course_a_pied">Course à pied</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Coach assigné</label>
              <select value={form.coachId} onChange={(e) => setForm({ ...form, coachId: e.target.value })} className={selectCls}>
                <option value="">— Aucun —</option>
                {coaches.map((c) => (
                  <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date début coaching</label>
              <input type="date" value={form.dateDebutCoaching} onChange={(e) => setForm({ ...form, dateDebutCoaching: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className={inputCls + " resize-none"} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-[#7c1d35] hover:bg-[#9b2445] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
              {loading ? "Création..." : "Créer le lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── EditLeadModal ─────────────────────────────────────────────────────────────

function EditLeadModal({
  lead,
  coaches,
  onClose,
  onUpdated,
}: {
  lead: Lead;
  coaches: Coach[];
  onClose: () => void;
  onUpdated: (l: Lead) => void;
}) {
  const [form, setForm] = useState({
    ...lead,
    coachId: lead.coachId || "",
    dateDebutCoaching: lead.dateDebutCoaching || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, coachId: form.coachId || undefined, dateDebutCoaching: form.dateDebutCoaching || undefined };
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const updated = await res.json();
      onUpdated(updated);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]";
  const selectCls = inputCls + " bg-white";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold">Modifier le lead</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Prénom</label>
              <input value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nom</label>
              <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Téléphone</label>
              <input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Source</label>
              <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value as Lead["source"] })} className={selectCls}>
                <option value="instagram">Instagram</option>
                <option value="bouche_a_oreille">Bouche-à-oreille</option>
                <option value="site_web">Site web</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
              <select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value as Lead["statut"] })} className={selectCls}>
                <option value="a_contacter">À contacter</option>
                <option value="appel_effectue">Appel effectué</option>
                <option value="en_reflexion">En réflexion</option>
                <option value="demarches_admin">Démarches admin</option>
                <option value="acompte_recu">Acompte reçu</option>
                <option value="coaching_demarre">Coaching démarré</option>
                <option value="perdu">Perdu</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Discipline</label>
              <select value={form.discipline} onChange={(e) => setForm({ ...form, discipline: e.target.value as Lead["discipline"] })} className={selectCls}>
                <option value="triathlon">Triathlon</option>
                <option value="cyclisme">Cyclisme</option>
                <option value="course_a_pied">Course à pied</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Coach assigné</label>
              <select value={form.coachId} onChange={(e) => setForm({ ...form, coachId: e.target.value })} className={selectCls}>
                <option value="">— Aucun —</option>
                {coaches.map((c) => (
                  <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date début coaching</label>
              <input type="date" value={form.dateDebutCoaching} onChange={(e) => setForm({ ...form, dateDebutCoaching: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className={inputCls + " resize-none"} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-[#7c1d35] hover:bg-[#9b2445] text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
              {loading ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── ConvertLeadModal ──────────────────────────────────────────────────────────

function ConvertLeadModal({
  lead,
  coaches,
  onClose,
  onConverted,
}: {
  lead: Lead;
  coaches: Coach[];
  onClose: () => void;
  onConverted: (updatedLead: Lead) => void;
}) {
  // Pre-fill with coach already assigned to the lead, if any
  const [form, setForm] = useState({
    coachId: lead.coachId || coaches[0]?.id || "",
    service: "performance",
    objectif: "",
  });
  const [loading, setLoading] = useState(false);

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Create athlete
      await fetch("/api/athletes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: lead.nom,
          prenom: lead.prenom,
          email: lead.email,
          telephone: lead.telephone,
          discipline: lead.discipline,
          statut: "actif",
          notes: lead.notes,
          coachId: form.coachId,
          service: form.service,
          objectif: form.objectif,
        }),
      });
      // 2. Mark lead as converti (stays in coaching_demarre column)
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ converti: true, statut: "coaching_demarre" }),
      });
      const updatedLead: Lead = await res.json();
      onConverted(updatedLead);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]";
  const selectCls = inputCls + " bg-white";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold">Convertir en athlète</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleConvert} className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <p className="text-sm font-medium text-emerald-800">{lead.prenom} {lead.nom} → Athlète</p>
            <p className="text-xs text-emerald-600 mt-0.5">{lead.email}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Coach assigné *</label>
            <select required value={form.coachId} onChange={(e) => setForm({ ...form, coachId: e.target.value })} className={selectCls}>
              {coaches.map((c) => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Service</label>
            <select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} className={selectCls}>
              <option value="basic">Basic</option>
              <option value="performance">Performance</option>
              <option value="pro">Pro</option>
              <option value="gratuit">Gratuit</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Objectif de saison</label>
            <input value={form.objectif} onChange={(e) => setForm({ ...form, objectif: e.target.value })} className={inputCls} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <UserCheck size={14} />
              {loading ? "Conversion..." : "Convertir"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
