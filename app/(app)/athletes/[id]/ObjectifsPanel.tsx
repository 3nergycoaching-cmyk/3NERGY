"use client";

import { useState } from "react";
import { Objectif, DistanceObjectif } from "@/lib/types";
import { Plus, Pencil, Trash2, X, Save, Trophy, Wifi } from "lucide-react";

const DISTANCES: DistanceObjectif[] = [
  "Sprint", "Olympic", "70.3", "Ironman",
  "5km", "10km", "Semi", "Marathon", "Autre",
];

const distanceBadge: Record<DistanceObjectif, string> = {
  Sprint:   "bg-sky-100 text-sky-700",
  Olympic:  "bg-blue-100 text-blue-700",
  "70.3":   "bg-indigo-100 text-indigo-700",
  Ironman:  "bg-[#7c1d35]/10 text-[#7c1d35]",
  "5km":    "bg-green-100 text-green-700",
  "10km":   "bg-emerald-100 text-emerald-700",
  Semi:     "bg-teal-100 text-teal-700",
  Marathon: "bg-orange-100 text-orange-700",
  Autre:    "bg-gray-100 text-gray-600",
};

function calcDaysLeft(dateStr: string): number {
  const race = new Date(dateStr + "T00:00:00");
  const now  = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((race.getTime() - now.getTime()) / 86400000);
}

const emptyForm = (): { titre: string; date: string; distance: DistanceObjectif } => ({
  titre:    "",
  date:     "",
  distance: "Olympic",
});

interface Props {
  athleteId: string;
  initialObjectifs: Objectif[];
}

export default function ObjectifsPanel({ athleteId, initialObjectifs }: Props) {
  const [objectifs, setObjectifs] = useState<Objectif[]>(
    [...initialObjectifs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  );
  const [modal, setModal]     = useState<"add" | "edit" | null>(null);
  const [editId, setEditId]   = useState<string | null>(null);
  const [form, setForm]       = useState(emptyForm());
  const [saving, setSaving]   = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const patch = async (next: Objectif[]) => {
    const sorted = [...next].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setObjectifs(sorted);
    await fetch(`/api/athletes/${athleteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ objectifs: sorted }),
    });
  };

  const openAdd = () => {
    setForm(emptyForm());
    setEditId(null);
    setModal("add");
  };

  const openEdit = (obj: Objectif) => {
    setForm({ titre: obj.titre, date: obj.date, distance: obj.distance });
    setEditId(obj.id);
    setModal("edit");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre.trim() || !form.date) return;
    setSaving(true);
    try {
      let next: Objectif[];
      if (modal === "add") {
        const newObj: Objectif = {
          id:       `obj-${Date.now()}`,
          titre:    form.titre.trim(),
          date:     form.date,
          distance: form.distance,
        };
        next = [...objectifs, newObj];
      } else {
        next = objectifs.map((o) =>
          o.id === editId
            ? { ...o, titre: form.titre.trim(), date: form.date, distance: form.distance }
            : o
        );
      }
      await patch(next);
      setModal(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await patch(objectifs.filter((o) => o.id !== id));
    setDeleteId(null);
  };

  const manualCount = objectifs.filter((o) => o.source !== "nolio").length;
  const canAdd = manualCount < 10; // pratiquement illimité pour usage réel

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {objectifs.length} course{objectifs.length > 1 ? "s" : ""}
          {objectifs.some((o) => o.source === "nolio") && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs text-[#7c1d35] bg-[#7c1d35]/10 px-2 py-0.5 rounded-full font-medium">
              <Wifi size={10} />
              {objectifs.filter((o) => o.source === "nolio").length} Nolio
            </span>
          )}
        </p>
        <button
          onClick={openAdd}
          disabled={!canAdd}
          className="flex items-center gap-2 bg-[#7c1d35] hover:bg-[#9b2445] text-white px-3 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={14} />
          Ajouter
        </button>
      </div>

      {/* Empty state */}
      {objectifs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-14 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Trophy className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm font-medium">Aucune course définie</p>
          <p className="text-gray-300 text-xs mt-1">Ajoute des courses ou synchronise Nolio</p>
        </div>
      )}

      {/* Race cards */}
      <div className="space-y-3">
        {objectifs.map((obj) => {
          const days    = calcDaysLeft(obj.date);
          const isPast  = days < 0;
          const isNolio = obj.source === "nolio";

          return (
            <div
              key={obj.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4"
            >
              {/* Countdown orb */}
              <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${
                isPast ? "bg-gray-100" : "bg-[#7c1d35]/8 bg-[#7c1d35]/10"
              }`}>
                {isPast ? (
                  <p className="text-xs text-gray-400 font-medium">Passé</p>
                ) : (
                  <>
                    <p className="text-lg font-bold text-[#7c1d35] leading-none">J-{days}</p>
                    <p className="text-[10px] text-[#7c1d35]/60 mt-0.5">jours</p>
                  </>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {/* Titre — complet, sans truncate */}
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-[#1a1218] text-base leading-snug">{obj.titre}</p>
                  {isNolio && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-[#7c1d35] text-white px-2 py-0.5 rounded-full flex-shrink-0">
                      <Wifi size={9} />
                      Nolio
                    </span>
                  )}
                </div>

                {/* Date + distance */}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs text-gray-500">
                    {new Date(obj.date + "T00:00:00").toLocaleDateString("fr-FR", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${distanceBadge[obj.distance]}`}>
                    {obj.distance}
                  </span>
                </div>
              </div>

              {/* Actions — Nolio objectifs sont en lecture seule */}
              {!isNolio && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(obj)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteId(obj.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-[#1a1218]">
                {modal === "add" ? "Ajouter une course" : "Modifier la course"}
              </h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nom de la course *</label>
                <input
                  required
                  type="text"
                  value={form.titre}
                  onChange={(e) => setForm({ ...form, titre: e.target.value })}
                  placeholder="ex: Ironman Nice, Marathon de Paris..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date *</label>
                  <input
                    required
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Distance / Format</label>
                  <select
                    value={form.distance}
                    onChange={(e) => setForm({ ...form, distance: e.target.value as DistanceObjectif })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35] bg-white"
                  >
                    {DISTANCES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#7c1d35] text-white rounded-xl text-sm font-medium hover:bg-[#9b2445] transition-colors disabled:opacity-50"
                >
                  <Save size={14} />
                  {saving ? "Sauvegarde..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-lg mb-2">Supprimer cette course ?</h3>
            <p className="text-gray-500 text-sm mb-5">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700"
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
