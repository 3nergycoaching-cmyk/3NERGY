"use client";

import { useState } from "react";
import { CalendarEvent, TypeEvenement, Coach } from "@/lib/types";
import {
  Calendar, Plus, X, Save, Trash2, ChevronLeft, ChevronRight,
  MapPin, Users, Tag, AlignLeft, RefreshCw, Wifi,
} from "lucide-react";

interface Props {
  initialEvents: CalendarEvent[];
  manualEvents: CalendarEvent[];
  coaches: Coach[];
  nolioConnectedCount?: number;
}

// ── Config ─────────────────────────────────────────────────────────────────
const TYPE_CFG: Record<TypeEvenement, { label: string; color: string; dot: string; bg: string }> = {
  stage:       { label: "Stage",       color: "text-blue-700",   dot: "bg-blue-500",    bg: "bg-blue-100" },
  competition: { label: "Compétition", color: "text-rose-700",   dot: "bg-rose-500",    bg: "bg-rose-100" },
  academy:     { label: "Academy",     color: "text-violet-700", dot: "bg-violet-500",  bg: "bg-violet-100" },
  structure:   { label: "Structure",   color: "text-amber-700",  dot: "bg-amber-500",   bg: "bg-amber-100" },
  autre:       { label: "Autre",       color: "text-gray-700",   dot: "bg-gray-400",    bg: "bg-gray-100" },
};

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const DAYS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function formatDateFR(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

function isSameDay(d1: string, d2: Date) {
  const d = new Date(d1 + "T00:00:00");
  return d.getFullYear() === d2.getFullYear() &&
    d.getMonth() === d2.getMonth() &&
    d.getDate() === d2.getDate();
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  // 0 = Monday, 6 = Sunday
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

type View = "year" | "month";

const blankForm = (coaches: Coach[]): Omit<CalendarEvent, "id" | "source"> => ({
  titre: "",
  type: "autre",
  dateDebut: new Date().toISOString().split("T")[0],
  dateFin: "",
  responsable: coaches[0]?.id ?? "",
  description: "",
});

export default function CalendrierClient({ initialEvents, manualEvents, coaches, nolioConnectedCount = 0 }: Props) {
  const today = new Date();
  const [view, setView] = useState<View>("month");
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [events, setEvents] = useState(initialEvents);
  const [manuals, setManuals] = useState(manualEvents);
  const [filterType, setFilterType] = useState<TypeEvenement | "tous">("tous");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(blankForm(coaches));
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // ── Nolio sync ─────────────────────────────────────────────────────────────
  const [nolioSyncing, setNolioSyncing] = useState(false);
  const [nolioResult, setNolioResult] = useState<string | null>(null);

  async function handleNolioSync() {
    setNolioSyncing(true);
    setNolioResult(null);
    try {
      const res = await fetch("/api/nolio/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        const totalAdded = (data.synced ?? []).reduce((s: number, r: { added: number }) => s + r.added, 0);
        const totalUpdated = (data.synced ?? []).reduce((s: number, r: { updated: number }) => s + r.updated, 0);
        setNolioResult(`+${totalAdded} ajoutés, ${totalUpdated} mis à jour`);
        // Reload page to reflect new events
        window.location.reload();
      } else {
        setNolioResult("Erreur de synchronisation");
      }
    } catch {
      setNolioResult("Erreur réseau");
    } finally {
      setNolioSyncing(false);
    }
  }

  // ── Filtered events ────────────────────────────────────────────────────
  const filteredEvents = events.filter(
    (e) => filterType === "tous" || e.type === filterType
  );

  // ── Add event ──────────────────────────────────────────────────────────
  async function handleAddEvent() {
    if (!addForm.titre || !addForm.dateDebut) return;
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...addForm, source: "manual" }),
    });
    if (res.ok) {
      const created: CalendarEvent = await res.json();
      setEvents((prev) => [...prev, created]);
      setManuals((prev) => [...prev, created]);
      setAddForm(blankForm(coaches));
      setShowAddModal(false);
    }
  }

  // ── Delete event ───────────────────────────────────────────────────────
  async function handleDeleteEvent(id: string) {
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setManuals((prev) => prev.filter((e) => e.id !== id));
      setDeleteTarget(null);
      setSelectedEvent(null);
    }
  }

  // ── Events for a specific date ─────────────────────────────────────────
  function eventsForDay(date: Date) {
    return filteredEvents.filter((e) => isSameDay(e.dateDebut, date));
  }

  // ── Year view ──────────────────────────────────────────────────────────
  function eventsForMonth(month: number) {
    return filteredEvents.filter((e) => {
      const d = new Date(e.dateDebut + "T00:00:00");
      return d.getFullYear() === currentYear && d.getMonth() === month;
    });
  }

  // ── Navigation ─────────────────────────────────────────────────────────
  function prevPeriod() {
    if (view === "year") setCurrentYear((y) => y - 1);
    else {
      if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
      else setCurrentMonth((m) => m - 1);
    }
  }
  function nextPeriod() {
    if (view === "year") setCurrentYear((y) => y + 1);
    else {
      if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
      else setCurrentMonth((m) => m + 1);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 pt-8 pb-4 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#7c1d35]/10 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#7c1d35]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Calendrier</h1>
              <p className="text-sm text-gray-500 mt-0.5">{events.length} événements</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Sync Nolio — toujours visible */}
            {nolioResult && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                {nolioResult}
              </span>
            )}
            <button
              onClick={nolioConnectedCount > 0 ? handleNolioSync : undefined}
              disabled={nolioSyncing || nolioConnectedCount === 0}
              title={
                nolioConnectedCount === 0
                  ? "Aucun athlète connecté à Nolio — connecte Nolio depuis la fiche athlète"
                  : `Synchroniser les compétitions Nolio (${nolioConnectedCount} athlète${nolioConnectedCount > 1 ? "s" : ""} connecté${nolioConnectedCount > 1 ? "s" : ""})`
              }
              className={`flex items-center gap-2 px-3.5 py-2 border rounded-lg text-sm font-medium transition-colors ${
                nolioConnectedCount > 0
                  ? "border-[#7c1d35]/30 text-[#7c1d35] hover:bg-[#7c1d35]/5 disabled:opacity-50"
                  : "border-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <RefreshCw size={14} className={nolioSyncing ? "animate-spin" : ""} />
              {nolioSyncing ? "Sync Nolio..." : "Sync Nolio"}
              <span className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                nolioConnectedCount > 0
                  ? "bg-[#7c1d35]/10 text-[#7c1d35]"
                  : "bg-gray-100 text-gray-400"
              }`}>
                <Wifi size={10} />
                {nolioConnectedCount}
              </span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#7c1d35] text-white rounded-lg text-sm font-medium hover:bg-[#9b2445] transition-colors"
            >
              <Plus size={16} />
              Nouvel événement
            </button>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Navigation */}
            <button onClick={prevPeriod} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft size={16} className="text-gray-600" />
            </button>
            <span className="text-base font-semibold text-gray-900 min-w-[160px] text-center">
              {view === "year" ? currentYear : `${MONTHS[currentMonth]} ${currentYear}`}
            </span>
            <button onClick={nextPeriod} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight size={16} className="text-gray-600" />
            </button>
            <button
              onClick={() => { setCurrentYear(today.getFullYear()); setCurrentMonth(today.getMonth()); }}
              className="ml-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Aujourd&apos;hui
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter by type */}
            <div className="flex gap-1">
              <button
                onClick={() => setFilterType("tous")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterType === "tous" ? "bg-gray-800 text-white" : "text-gray-600 hover:bg-gray-100"}`}
              >
                Tous
              </button>
              {(Object.keys(TYPE_CFG) as TypeEvenement[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterType === t ? `${TYPE_CFG[t].bg} ${TYPE_CFG[t].color}` : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${TYPE_CFG[t].dot}`} />
                  {TYPE_CFG[t].label}
                </button>
              ))}
            </div>

            {/* View toggle */}
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setView("year")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === "year" ? "bg-[#7c1d35] text-white" : "text-gray-600 hover:bg-gray-50"}`}
              >
                Annuel
              </button>
              <button
                onClick={() => setView("month")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === "month" ? "bg-[#7c1d35] text-white" : "text-gray-600 hover:bg-gray-50"}`}
              >
                Mensuel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar content */}
      <div className="flex-1 overflow-y-auto p-8">

        {/* ── YEAR VIEW ── */}
        {view === "year" && (
          <div className="grid grid-cols-4 gap-4">
            {MONTHS.map((month, mIdx) => {
              const monthEvents = eventsForMonth(mIdx);
              const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === mIdx;

              return (
                <div
                  key={mIdx}
                  className={`bg-white rounded-xl border shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
                    isCurrentMonth ? "border-[#7c1d35]/30 ring-1 ring-[#7c1d35]/20" : "border-gray-200"
                  }`}
                  onClick={() => { setCurrentMonth(mIdx); setView("month"); }}
                >
                  <div className={`px-4 py-2.5 border-b ${isCurrentMonth ? "bg-[#7c1d35] text-white" : "bg-gray-50 text-gray-700"}`}>
                    <span className="text-sm font-semibold">{month}</span>
                    {monthEvents.length > 0 && (
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        isCurrentMonth ? "bg-white/20 text-white" : "bg-[#7c1d35]/10 text-[#7c1d35]"
                      }`}>
                        {monthEvents.length}
                      </span>
                    )}
                  </div>
                  <div className="px-3 py-2 min-h-[60px]">
                    {monthEvents.length === 0 ? (
                      <p className="text-xs text-gray-300 italic py-1">Aucun événement</p>
                    ) : (
                      <div className="space-y-1">
                        {monthEvents.slice(0, 3).map((e) => (
                          <div key={e.id} className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${TYPE_CFG[e.type].dot}`} />
                            <span className="text-xs text-gray-600 truncate">{e.titre}</span>
                          </div>
                        ))}
                        {monthEvents.length > 3 && (
                          <p className="text-xs text-gray-400 pl-3">+{monthEvents.length - 3} autres</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── MONTH VIEW ── */}
        {view === "month" && (
          <div>
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS_SHORT.map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wide py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            {(() => {
              const daysInMonth = getDaysInMonth(currentYear, currentMonth);
              const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
              const cells: (Date | null)[] = [
                ...Array(firstDay).fill(null),
                ...Array.from({ length: daysInMonth }, (_, i) => new Date(currentYear, currentMonth, i + 1)),
              ];
              // Pad to complete last row
              while (cells.length % 7 !== 0) cells.push(null);

              const weeks: (Date | null)[][] = [];
              for (let i = 0; i < cells.length; i += 7) {
                weeks.push(cells.slice(i, i + 7));
              }

              return weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
                  {week.map((date, di) => {
                    if (!date) {
                      return <div key={di} className="h-24 rounded-lg bg-gray-50/50" />;
                    }
                    const dayEvents = eventsForDay(date);
                    const isToday = isSameDay(today.toISOString().split("T")[0], date);
                    const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());

                    return (
                      <div
                        key={di}
                        className={`h-24 rounded-lg border p-1.5 overflow-hidden ${
                          isToday
                            ? "border-[#7c1d35] bg-[#7c1d35]/5"
                            : "border-gray-100 bg-white hover:bg-gray-50/50"
                        } ${isPast ? "opacity-60" : ""}`}
                      >
                        <span className={`text-xs font-semibold block mb-1 ${
                          isToday ? "text-[#7c1d35]" : "text-gray-500"
                        }`}>
                          {date.getDate()}
                        </span>
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 2).map((e) => (
                            <button
                              key={e.id}
                              onClick={() => setSelectedEvent(e)}
                              className={`w-full text-left flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${TYPE_CFG[e.type].bg} ${TYPE_CFG[e.type].color} hover:opacity-80 transition-opacity truncate`}
                            >
                              <span className={`w-1 h-1 rounded-full flex-shrink-0 ${TYPE_CFG[e.type].dot}`} />
                              <span className="truncate flex-1">{e.titre}</span>
                              {e.source === "nolio" && (
                                <span className="flex-shrink-0 text-[8px] font-bold bg-[#7c1d35]/20 text-[#7c1d35] px-1 rounded leading-tight">N</span>
                              )}
                            </button>
                          ))}
                          {dayEvents.length > 2 && (
                            <p className="text-xs text-gray-400 pl-1">+{dayEvents.length - 2}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ));
            })()}

            {/* Events list for the month */}
            {filteredEvents.filter((e) => {
              const d = new Date(e.dateDebut + "T00:00:00");
              return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
            }).length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Événements de {MONTHS[currentMonth]}
                </h3>
                <div className="space-y-2">
                  {filteredEvents
                    .filter((e) => {
                      const d = new Date(e.dateDebut + "T00:00:00");
                      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
                    })
                    .sort((a, b) => a.dateDebut.localeCompare(b.dateDebut))
                    .map((e) => {
                      const cfg = TYPE_CFG[e.type];
                      const coach = coaches.find((c) => c.id === e.responsable);
                      return (
                        <button
                          key={e.id}
                          onClick={() => setSelectedEvent(e)}
                          className="w-full text-left flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:shadow-sm transition-shadow"
                        >
                          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-gray-900 truncate">{e.titre}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
                                {cfg.label}
                              </span>
                              {e.source === "nolio" && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold bg-[#7c1d35]/10 text-[#7c1d35] flex items-center gap-0.5">
                                  <Wifi size={9} />
                                  Nolio
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                              <span>{formatDateFR(e.dateDebut)}</span>
                              {e.dateFin && <span>→ {formatDateFR(e.dateFin)}</span>}
                              {coach && <span>· {coach.prenom} {coach.nom}</span>}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Add event modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Nouvel événement</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Titre *</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20"
                  value={addForm.titre}
                  onChange={(e) => setAddForm({ ...addForm, titre: e.target.value })}
                  placeholder="Nom de l'événement"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20"
                    value={addForm.type}
                    onChange={(e) => setAddForm({ ...addForm, type: e.target.value as TypeEvenement })}
                  >
                    {(Object.keys(TYPE_CFG) as TypeEvenement[]).map((t) => (
                      <option key={t} value={t}>{TYPE_CFG[t].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Responsable</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20"
                    value={addForm.responsable ?? ""}
                    onChange={(e) => setAddForm({ ...addForm, responsable: e.target.value })}
                  >
                    <option value="">— Aucun —</option>
                    {coaches.map((c) => (
                      <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date début *</label>
                  <input
                    type="date"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20"
                    value={addForm.dateDebut}
                    onChange={(e) => setAddForm({ ...addForm, dateDebut: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date fin</label>
                  <input
                    type="date"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20"
                    value={addForm.dateFin ?? ""}
                    onChange={(e) => setAddForm({ ...addForm, dateFin: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 resize-none"
                  value={addForm.description ?? ""}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  placeholder="Détails de l'événement..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleAddEvent}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#7c1d35] text-white rounded-xl text-sm font-medium hover:bg-[#9b2445]"
              >
                <Save size={15} /> Enregistrer
              </button>
              <button
                onClick={() => { setShowAddModal(false); setAddForm(blankForm(coaches)); }}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Event detail modal ── */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${TYPE_CFG[selectedEvent.type].dot}`} />
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_CFG[selectedEvent.type].bg} ${TYPE_CFG[selectedEvent.type].color}`}>
                  {TYPE_CFG[selectedEvent.type].label}
                </span>
                {selectedEvent.source === "nolio" && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#7c1d35]/10 text-[#7c1d35] font-semibold flex items-center gap-1">
                    <Wifi size={10} />
                    Nolio
                  </span>
                )}
                {selectedEvent.source && selectedEvent.source !== "manual" && selectedEvent.source !== "nolio" && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                    Auto-importé
                  </span>
                )}
              </div>
              <button onClick={() => setSelectedEvent(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">{selectedEvent.titre}</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={15} className="text-gray-400 flex-shrink-0" />
                <span>
                  {formatDateFR(selectedEvent.dateDebut)}
                  {selectedEvent.dateFin && ` → ${formatDateFR(selectedEvent.dateFin)}`}
                </span>
              </div>
              {selectedEvent.responsable && (() => {
                const coach = coaches.find((c) => c.id === selectedEvent.responsable);
                return coach ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users size={15} className="text-gray-400 flex-shrink-0" />
                    <span>{coach.prenom} {coach.nom}</span>
                  </div>
                ) : null;
              })()}
              {selectedEvent.description && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <AlignLeft size={15} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>{selectedEvent.description}</span>
                </div>
              )}
              {selectedEvent.source && selectedEvent.source !== "manual" && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Tag size={15} className="text-gray-400 flex-shrink-0" />
                  <span className="italic">
                    {selectedEvent.source === "objectif" && "Importé depuis les objectifs athlètes"}
                    {selectedEvent.source === "academy" && "Importé depuis les séances Academy"}
                    {selectedEvent.source === "nolio" && "Synchronisé depuis Nolio"}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              {selectedEvent.source === "manual" && (
                <button
                  onClick={() => setDeleteTarget(selectedEvent.id)}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl text-sm font-medium"
                >
                  <Trash2 size={14} /> Supprimer
                </button>
              )}
              <button
                onClick={() => setSelectedEvent(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Supprimer cet événement ?</h3>
            <p className="text-sm text-gray-500 mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteEvent(deleteTarget)}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700"
              >
                Supprimer
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
