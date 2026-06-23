"use client";

import { useState, useRef, useCallback } from "react";
import { toPng } from "html-to-image";
import { Image as ImageIcon, Download, Eye, CheckSquare, Square, Sparkles } from "lucide-react";
import PosterPreview, { ResultRow } from "./PosterPreview";

interface Competition {
  id: string;
  titre: string;
  dateDebut: string;
  athleteId: string | null;
  athleteNom: string | null;
  sport: string | null;       // raw Nolio sport name
  discipline: string | null;  // CRM key derived from sport
}

interface SelectedResult {
  temps: string;
  classement: string;
  recordPerso: boolean;
}

interface Props {
  competitions: Competition[];
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function groupByWeek(competitions: Competition[]): { weekLabel: string; items: Competition[] }[] {
  const groups: Map<string, Competition[]> = new Map();
  for (const c of competitions) {
    const d = new Date(c.dateDebut);
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => {
      const d = new Date(key);
      const weekLabel = `Semaine du ${d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`;
      return { weekLabel, items };
    });
}

export default function PostsResultatsClient({ competitions }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Record<string, SelectedResult>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null!);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        if (!results[id]) {
          setResults((r) => ({ ...r, [id]: { temps: "", classement: "", recordPerso: false } }));
        }
      }
      return next;
    });
  };

  const updateResult = (id: string, field: keyof SelectedResult, value: string | boolean) => {
    setResults((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const selectedCompetitions = competitions.filter((c) => selected.has(c.id));

  // Titre unique si toutes les disciplines sélectionnées sont identiques
  const sharedDiscipline = (() => {
    const disciplines = Array.from(new Set(selectedCompetitions.map((c) => c.discipline).filter((d): d is string => !!d)));
    return disciplines.length === 1 ? disciplines[0] : null;
  })();

  const posterRows: ResultRow[] = selectedCompetitions.map((c) => ({
    courseNom: c.titre,
    dateDebut: c.dateDebut,
    athleteNom: c.athleteNom,
    discipline: c.discipline,
    temps: results[c.id]?.temps ?? "",
    classement: results[c.id]?.classement ?? "",
    recordPerso: results[c.id]?.recordPerso ?? false,
  }));

  const handleDownload = useCallback(async () => {
    if (!posterRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(posterRef.current, {
        pixelRatio: 2,
        width: 540,
        height: 540,
      });
      const link = document.createElement("a");
      link.download = `3nergy-resultats-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  }, []);

  const grouped = groupByWeek(competitions);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-[#7c1d35] rounded-xl flex items-center justify-center">
              <ImageIcon size={18} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#1a1218]">Posts Résultats</h1>
          </div>
          <p className="text-gray-500 text-sm ml-12">
            Sélectionne des compétitions et génère un visuel Instagram/Facebook 1080×1080
          </p>
        </div>
        {selected.size > 0 && (
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 bg-[#7c1d35] hover:bg-[#9b2445] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
          >
            <Sparkles size={16} />
            Générer le visuel ({selected.size})
          </button>
        )}
      </div>

      {competitions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
          <ImageIcon size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucune compétition trouvée. Les événements de type «&nbsp;Compétition&nbsp;» apparaîtront ici.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ weekLabel, items }) => (
            <div key={weekLabel}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 pl-1">{weekLabel}</p>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {items.map((comp, idx) => {
                  const isSel = selected.has(comp.id);
                  const res = results[comp.id] ?? { temps: "", classement: "", recordPerso: false };
                  return (
                    <div key={comp.id} className={`${idx > 0 ? "border-t border-gray-50" : ""}`}>
                      {/* Row */}
                      <div
                        className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors ${isSel ? "bg-[#7c1d35]/5" : "hover:bg-gray-50"}`}
                        onClick={() => toggleSelect(comp.id)}
                      >
                        <div className="flex-shrink-0 text-[#7c1d35]">
                          {isSel ? <CheckSquare size={18} /> : <Square size={18} className="text-gray-300" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#1a1218] text-sm truncate">{comp.titre}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatDate(comp.dateDebut)}
                            {comp.athleteNom && <> · <span className="text-gray-500">{comp.athleteNom}</span></>}
                          </p>
                        </div>
                        {comp.discipline && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#7c1d35]/10 text-[#7c1d35] font-medium flex-shrink-0">
                            {comp.discipline.replace("_", " ")}
                          </span>
                        )}
                      </div>

                      {/* Editable fields when selected */}
                      {isSel && (
                        <div
                          className="px-4 pb-3 flex flex-wrap gap-3 bg-[#7c1d35]/5 border-t border-[#7c1d35]/10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-gray-500 whitespace-nowrap">Temps</label>
                            <input
                              type="text"
                              placeholder="ex: 3h01"
                              value={res.temps}
                              onChange={(e) => updateResult(comp.id, "temps", e.target.value)}
                              className="w-28 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-gray-500 whitespace-nowrap">Classement</label>
                            <input
                              type="text"
                              placeholder="ex: 20e/794"
                              value={res.classement}
                              onChange={(e) => updateResult(comp.id, "classement", e.target.value)}
                              className="w-32 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]"
                            />
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={res.recordPerso}
                              onChange={(e) => updateResult(comp.id, "recordPerso", e.target.checked)}
                              className="w-4 h-4 accent-[#7c1d35] rounded"
                            />
                            <span className="text-xs font-medium text-gray-500">Record personnel 🏅</span>
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {showPreview && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-[#111] rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Eye size={18} className="text-[#e8648a]" />
                Aperçu — 1080×1080
              </h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-white transition-colors text-sm px-3 py-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Poster at 540×540 (exported at ×2 = 1080×1080) */}
            <div className="rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <PosterPreview
                rows={posterRows}
                sharedDiscipline={sharedDiscipline}
                posterRef={posterRef}
              />
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 bg-[#e8648a] hover:bg-[#d4547a] disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors w-full justify-center"
            >
              <Download size={16} />
              {downloading ? "Génération en cours…" : "Télécharger le PNG (1080×1080)"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
