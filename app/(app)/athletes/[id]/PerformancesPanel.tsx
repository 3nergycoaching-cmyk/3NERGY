"use client";

import { useState } from "react";
import {
  Performances, Chrono, CustomEntry,
  NatationDistance, CyclismeDistance, CapDistance, TriathlonDistance,
} from "@/lib/types";
import { Waves, Bike, Footprints, Zap, Plus, X, Check, Pencil, Lock } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const defaultPerf = (): Performances => ({ natation: {}, cyclisme: {}, cap: {}, triathlon: {}, custom: [] });

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

/** CP = (P20 × 20 + P5 × 5) / 25  — returns undefined if either input is missing/NaN */
function calcCP(p5?: Chrono, p20?: Chrono): string | undefined {
  if (!p5?.valeur || !p20?.valeur) return undefined;
  const v5 = parseFloat(p5.valeur);
  const v20 = parseFloat(p20.valeur);
  if (isNaN(v5) || isNaN(v20)) return undefined;
  return ((v20 * 20 + v5 * 5) / 25).toFixed(0);
}

/** CV = (V20 × 20 + V5 × 5) / 25 */
function calcCV(v5?: Chrono, v20?: Chrono): string | undefined {
  if (!v5?.valeur || !v20?.valeur) return undefined;
  const n5 = parseFloat(v5.valeur);
  const n20 = parseFloat(v20.valeur);
  if (isNaN(n5) || isNaN(n20)) return undefined;
  return ((n20 * 20 + n5 * 5) / 25).toFixed(2);
}

// ─────────────────────────────────────────────────────────────────────────────
// EditableRow — click row to edit; X to delete
// ─────────────────────────────────────────────────────────────────────────────

interface EditableRowProps {
  label: string;
  hint?: string;
  unit?: string;
  chrono?: Chrono;
  onSave: (c: Chrono) => void;
  onClear: () => void;
}

function EditableRow({ label, hint, unit, chrono, onSave, onClear }: EditableRowProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Chrono>(
    chrono ?? { valeur: "", date: "", contexte: "competition" }
  );

  const open = () => {
    setForm(chrono ?? { valeur: "", date: "", contexte: "competition" });
    setEditing(true);
  };
  const cancel = () => { setForm(chrono ?? { valeur: "", date: "", contexte: "competition" }); setEditing(false); };
  const save = () => {
    if (!form.valeur.trim()) { onClear(); setEditing(false); return; }
    onSave({ ...form, valeur: form.valeur.trim() });
    setEditing(false);
  };
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); save(); }
    if (e.key === "Escape") cancel();
  };

  if (editing) {
    return (
      <tr className="border-b border-gray-100 bg-[#7c1d35]/5">
        <td className="px-4 py-2.5 text-sm font-semibold text-[#7c1d35] whitespace-nowrap w-44">{label}</td>
        <td className="px-4 py-2">
          <input
            autoFocus
            type="text"
            value={form.valeur}
            onChange={(e) => setForm({ ...form, valeur: e.target.value })}
            onKeyDown={handleKey}
            placeholder={hint ?? "—"}
            className="w-full px-2.5 py-1.5 border border-[#7c1d35]/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]"
          />
        </td>
        <td className="px-4 py-2">
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            onKeyDown={handleKey}
            className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs w-36 focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20"
          />
        </td>
        <td className="px-4 py-2">
          <select
            value={form.contexte}
            onChange={(e) => setForm({ ...form, contexte: e.target.value as Chrono["contexte"] })}
            className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
          >
            <option value="competition">Compétition</option>
            <option value="entrainement">Entraînement</option>
          </select>
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-1">
            <button onClick={save} className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors" title="Enregistrer">
              <Check size={13} />
            </button>
            <button onClick={cancel} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors" title="Annuler">
              <X size={13} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr
      onClick={open}
      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer group transition-colors"
    >
      <td className="px-4 py-2.5 text-sm font-medium text-gray-700 whitespace-nowrap w-44">{label}</td>
      <td className="px-4 py-2.5">
        {chrono ? (
          <span className="text-sm font-bold text-[#1a1218]">
            {chrono.valeur}{unit ? <span className="text-xs font-normal text-gray-400 ml-1">{unit}</span> : null}
          </span>
        ) : (
          <span className="text-gray-300 text-sm italic">Cliquer pour saisir</span>
        )}
      </td>
      <td className="px-4 py-2.5 text-xs text-gray-400">{chrono ? fmtDate(chrono.date) : "—"}</td>
      <td className="px-4 py-2.5">
        {chrono && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            chrono.contexte === "competition" ? "bg-[#7c1d35]/10 text-[#7c1d35]" : "bg-gray-100 text-gray-500"
          }`}>
            {chrono.contexte === "competition" ? "Compétition" : "Entraînement"}
          </span>
        )}
      </td>
      <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={open} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors" title="Modifier">
            <Pencil size={12} />
          </button>
          {chrono && (
            <button onClick={onClear} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors" title="Supprimer">
              <X size={12} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ComputedRow — read-only calculated value
// ─────────────────────────────────────────────────────────────────────────────

function ComputedRow({ label, value, unit, formula }: { label: string; value?: string; unit?: string; formula: string }) {
  return (
    <tr className="border-b border-gray-50 bg-amber-50/60">
      <td className="px-4 py-2.5 w-44">
        <div className="flex items-center gap-1.5">
          <Lock size={11} className="text-amber-500 flex-shrink-0" />
          <span className="text-sm font-medium text-amber-800">{label}</span>
        </div>
      </td>
      <td className="px-4 py-2.5">
        {value ? (
          <span className="text-sm font-bold text-amber-700">
            {value}{unit ? <span className="text-xs font-normal ml-1">{unit}</span> : null}
          </span>
        ) : (
          <span className="text-xs text-amber-400 italic">Saisir les 2 valeurs sources</span>
        )}
      </td>
      <td className="px-4 py-2.5 text-xs text-amber-400" colSpan={3}>
        <span className="font-mono">{formula}</span>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SectionHeader
// ─────────────────────────────────────────────────────────────────────────────

function PerfSection({ title, icon: Icon, color, children }: {
  title: string; icon: React.ElementType; color: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className={`px-5 py-3.5 border-b border-gray-100 flex items-center gap-2 ${color}`}>
        <Icon size={16} />
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50/50">
              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400 w-44">Distance / Effort</th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400">Valeur</th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400">Date</th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400">Contexte</th>
              <th className="w-16 px-4 py-2" />
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CustomSection
// ─────────────────────────────────────────────────────────────────────────────

interface CustomSectionProps {
  entries: CustomEntry[];
  onChange: (next: CustomEntry[]) => void;
}

type CustomForm = { discipline: string; distance: string; valeur: string; date: string; contexte: "competition" | "entrainement" };
const emptyCustom = (): CustomForm => ({ discipline: "", distance: "", valeur: "", date: "", contexte: "competition" });

function CustomSection({ entries, onChange }: CustomSectionProps) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<CustomForm>(emptyCustom());
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CustomForm>(emptyCustom());

  const handleAdd = () => {
    if (!form.discipline.trim() || !form.distance.trim() || !form.valeur.trim()) return;
    onChange([...entries, { id: `custom-${Date.now()}`, ...form, discipline: form.discipline.trim(), distance: form.distance.trim(), valeur: form.valeur.trim() }]);
    setForm(emptyCustom());
    setAdding(false);
  };

  const handleEdit = (id: string) => {
    const next = entries.map((e) => e.id === id ? { ...e, ...editForm, discipline: editForm.discipline.trim(), distance: editForm.distance.trim(), valeur: editForm.valeur.trim() } : e);
    onChange(next);
    setEditId(null);
  };

  const handleDelete = (id: string) => onChange(entries.filter((e) => e.id !== id));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2 text-gray-600">
          <Plus size={15} />
          <h3 className="font-semibold text-sm">Entrées personnalisées</h3>
        </div>
        <button
          onClick={() => { setForm(emptyCustom()); setAdding(true); }}
          className="flex items-center gap-1.5 text-xs font-medium bg-[#7c1d35]/10 text-[#7c1d35] px-3 py-1.5 rounded-lg hover:bg-[#7c1d35]/20 transition-colors"
        >
          <Plus size={12} /> Ajouter
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="px-5 py-4 border-b border-gray-100 bg-[#7c1d35]/5">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Discipline</label>
              <input type="text" value={form.discipline} onChange={(e) => setForm({ ...form, discipline: e.target.value })} placeholder="ex: Natation, Running..." className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Distance / Effort</label>
              <input type="text" value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })} placeholder="ex: 1000m TT, Hill climb..." className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Valeur</label>
              <input type="text" value={form.valeur} onChange={(e) => setForm({ ...form, valeur: e.target.value })} placeholder="ex: 3:45, 280W..." className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Contexte</label>
              <select value={form.contexte} onChange={(e) => setForm({ ...form, contexte: e.target.value as CustomEntry["contexte"] })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white">
                <option value="competition">Compétition</option>
                <option value="entrainement">Entraînement</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-3 justify-end">
            <button onClick={() => setAdding(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
            <button onClick={handleAdd} disabled={!form.discipline.trim() || !form.distance.trim() || !form.valeur.trim()} className="flex items-center gap-2 px-4 py-2 bg-[#7c1d35] text-white text-sm rounded-xl hover:bg-[#9b2445] transition-colors disabled:opacity-40">
              <Check size={14} /> Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {entries.length === 0 && !adding ? (
        <p className="text-center text-gray-300 text-sm py-6">Aucune entrée personnalisée</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400">Discipline</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400">Distance / Effort</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400">Valeur</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400">Date</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400">Contexte</th>
                <th className="w-16 px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) =>
                editId === entry.id ? (
                  <tr key={entry.id} className="border-b border-gray-50 bg-[#7c1d35]/5">
                    <td className="px-4 py-2"><input autoFocus value={editForm.discipline} onChange={(e) => setEditForm({ ...editForm, discipline: e.target.value })} className="w-full px-2 py-1.5 border border-[#7c1d35]/30 rounded-lg text-sm focus:outline-none" /></td>
                    <td className="px-4 py-2"><input value={editForm.distance} onChange={(e) => setEditForm({ ...editForm, distance: e.target.value })} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none" /></td>
                    <td className="px-4 py-2"><input value={editForm.valeur} onChange={(e) => setEditForm({ ...editForm, valeur: e.target.value })} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none" /></td>
                    <td className="px-4 py-2"><input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs w-32 focus:outline-none" /></td>
                    <td className="px-4 py-2"><select value={editForm.contexte} onChange={(e) => setEditForm({ ...editForm, contexte: e.target.value as CustomEntry["contexte"] })} className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"><option value="competition">Compétition</option><option value="entrainement">Entraînement</option></select></td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(entry.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200"><Check size={12} /></button>
                        <button onClick={() => setEditId(null)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200"><X size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={entry.id} onClick={() => { setEditForm({ discipline: entry.discipline, distance: entry.distance, valeur: entry.valeur, date: entry.date, contexte: entry.contexte }); setEditId(entry.id); }} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer group transition-colors">
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-700">{entry.discipline}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{entry.distance}</td>
                    <td className="px-4 py-2.5 text-sm font-bold text-[#1a1218]">{entry.valeur}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-400">{fmtDate(entry.date)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${entry.contexte === "competition" ? "bg-[#7c1d35]/10 text-[#7c1d35]" : "bg-gray-100 text-gray-500"}`}>
                        {entry.contexte === "competition" ? "Compétition" : "Entraînement"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleDelete(entry.id)} className="w-6 h-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-all">
                        <X size={12} />
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  athleteId: string;
  initialPerformances?: Performances;
}

export default function PerformancesPanel({ athleteId, initialPerformances }: Props) {
  const [perfs, setPerfs] = useState<Performances>(initialPerformances ?? defaultPerf());
  const [saving, setSaving] = useState(false);

  const patch = async (next: Performances) => {
    setPerfs(next);
    setSaving(true);
    try {
      await fetch(`/api/athletes/${athleteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ performances: next }),
      });
    } finally {
      setSaving(false);
    }
  };

  // Section-specific helpers
  const saveNat = (k: NatationDistance, c: Chrono) => patch({ ...perfs, natation: { ...perfs.natation, [k]: c } });
  const clearNat = (k: NatationDistance) => { const n = { ...perfs.natation }; delete n[k]; patch({ ...perfs, natation: n }); };

  const saveCyc = (k: CyclismeDistance, c: Chrono) => patch({ ...perfs, cyclisme: { ...perfs.cyclisme, [k]: c } });
  const clearCyc = (k: CyclismeDistance) => { const n = { ...perfs.cyclisme }; delete n[k]; patch({ ...perfs, cyclisme: n }); };

  const saveCap = (k: CapDistance, c: Chrono) => patch({ ...perfs, cap: { ...perfs.cap, [k]: c } });
  const clearCap = (k: CapDistance) => { const n = { ...perfs.cap }; delete n[k]; patch({ ...perfs, cap: n }); };

  const saveTri = (k: TriathlonDistance, c: Chrono) => patch({ ...perfs, triathlon: { ...perfs.triathlon, [k]: c } });
  const clearTri = (k: TriathlonDistance) => { const n = { ...perfs.triathlon }; delete n[k]; patch({ ...perfs, triathlon: n }); };

  const saveCustom = (next: CustomEntry[]) => patch({ ...perfs, custom: next });

  // Calculated values (derived from state, not stored)
  const cp = calcCP(perfs.cyclisme?.p5min, perfs.cyclisme?.p20min);
  const cv = calcCV(perfs.cap?.v5min, perfs.cap?.v20min);

  return (
    <div className="space-y-4">
      {saving && (
        <div className="fixed bottom-6 right-6 bg-[#7c1d35] text-white text-xs px-4 py-2 rounded-xl shadow-lg z-50 flex items-center gap-2 pointer-events-none">
          <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          Sauvegarde en cours…
        </div>
      )}

      {/* ── Natation ── */}
      <PerfSection title="Natation" icon={Waves} color="text-blue-600 bg-blue-50">
        {([ ["400m","mm:ss — ex: 05:30"], ["750m","mm:ss — ex: 11:20"], ["1500m","mm:ss — ex: 22:00"], ["1900m","mm:ss — ex: 28:45"], ["3800m","mm:ss — ex: 58:00"] ] as [NatationDistance, string][]).map(([k, hint]) => (
          <EditableRow key={k} label={k} hint={hint} chrono={perfs.natation?.[k]} onSave={(c) => saveNat(k, c)} onClear={() => clearNat(k)} />
        ))}
      </PerfSection>

      {/* ── Cyclisme ── */}
      <PerfSection title="Cyclisme — Puissance" icon={Bike} color="text-emerald-600 bg-emerald-50">
        <EditableRow label="5 min max" hint="ex: 320" unit="W" chrono={perfs.cyclisme?.p5min} onSave={(c) => saveCyc("p5min", c)} onClear={() => clearCyc("p5min")} />
        <EditableRow label="20 min max" hint="ex: 285" unit="W" chrono={perfs.cyclisme?.p20min} onSave={(c) => saveCyc("p20min", c)} onClear={() => clearCyc("p20min")} />
        <ComputedRow label="CP calculée ≈" value={cp} unit="W" formula="(P20×20 + P5×5) / 25" />
        <EditableRow label="CP Coach" hint="ex: 275" unit="W" chrono={perfs.cyclisme?.cp_coach} onSave={(c) => saveCyc("cp_coach", c)} onClear={() => clearCyc("cp_coach")} />
      </PerfSection>

      {/* ── Course à pied ── */}
      <PerfSection title="Course à pied" icon={Footprints} color="text-orange-600 bg-orange-50">
        <EditableRow label="5 min max" hint="km/h — ex: 16.5 ou pace 3:38" unit="km/h" chrono={perfs.cap?.v5min} onSave={(c) => saveCap("v5min", c)} onClear={() => clearCap("v5min")} />
        <EditableRow label="20 min max" hint="km/h — ex: 14.2 ou pace 4:13" unit="km/h" chrono={perfs.cap?.v20min} onSave={(c) => saveCap("v20min", c)} onClear={() => clearCap("v20min")} />
        <ComputedRow label="CV calculée ≈" value={cv} unit="km/h" formula="(V20×20 + V5×5) / 25" />
        <EditableRow label="CV Coach" hint="ex: 14.8" unit="km/h" chrono={perfs.cap?.cv_coach} onSave={(c) => saveCap("cv_coach", c)} onClear={() => clearCap("cv_coach")} />
        {([ ["5km","mm:ss — ex: 21:30"], ["10km","mm:ss — ex: 44:15"], ["semi","h:mm:ss — ex: 1:36:00"], ["marathon","h:mm:ss — ex: 3:22:00"] ] as [CapDistance, string][]).map(([k, hint]) => (
          <EditableRow key={k} label={k === "semi" ? "Semi-marathon" : k === "marathon" ? "Marathon" : k} hint={hint} chrono={perfs.cap?.[k]} onSave={(c) => saveCap(k, c)} onClear={() => clearCap(k)} />
        ))}
      </PerfSection>

      {/* ── Triathlon ── */}
      <PerfSection title="Triathlon" icon={Zap} color="text-[#7c1d35] bg-[#7c1d35]/5">
        {([ ["sprint","h:mm:ss — ex: 1:02:00"], ["olympic","h:mm:ss — ex: 2:15:00"], ["703","h:mm:ss — ex: 4:58:00"], ["ironman","h:mm:ss — ex: 10:45:00"] ] as [TriathlonDistance, string][]).map(([k, hint]) => (
          <EditableRow key={k} label={k === "703" ? "70.3" : k.charAt(0).toUpperCase() + k.slice(1)} hint={hint} chrono={perfs.triathlon?.[k]} onSave={(c) => saveTri(k, c)} onClear={() => clearTri(k)} />
        ))}
      </PerfSection>

      {/* ── Custom ── */}
      <CustomSection entries={perfs.custom ?? []} onChange={saveCustom} />
    </div>
  );
}
