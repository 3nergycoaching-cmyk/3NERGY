"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  CheckCircle2, Link2, Search, X, Loader2, Link as LinkIcon, Unlink,
} from "lucide-react";
import Link from "next/link";
import { Athlete, Coach } from "@/lib/types";
import { NolioEntry } from "./page";

interface Props {
  nolioAthletes: NolioEntry[];
  crmAthletes: Athlete[];
  coaches: Coach[];
  /** nolio_id → crmAthleteId, from initial db state */
  initialLinks: Record<number, string>;
  /** email → crmAthleteId, for email-based matches */
  emailLinks: Record<string, string>;
}

export default function NolioTable({
  nolioAthletes,
  crmAthletes,
  coaches,
  initialLinks,
  emailLinks,
}: Props) {
  // Local state: nolioId → crmAthleteId (undefined = no manual link)
  const [links, setLinks] = useState<Record<number, string>>(initialLinks);
  const [saving, setSaving] = useState<number | null>(null); // which nolioId is saving

  // Modal state
  const [modal, setModal] = useState<NolioEntry | null>(null);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Focus search input when modal opens
  useEffect(() => {
    if (modal) {
      setTimeout(() => searchRef.current?.focus(), 50);
      setSearch("");
    }
  }, [modal]);

  const coachById = useMemo(
    () => Object.fromEntries(coaches.map((c) => [c.id, c])),
    [coaches]
  );

  // Filtered CRM athletes for modal search
  const filteredCrm = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return crmAthletes;
    return crmAthletes.filter(
      (a) =>
        `${a.prenom} ${a.nom}`.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q)
    );
  }, [crmAthletes, search]);

  // ── Link action ────────────────────────────────────────────────────────────
  const handleLink = async (nolioId: number, crmId: string) => {
    setSaving(nolioId);
    try {
      const res = await fetch(`/api/athletes/${crmId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nolioId }),
      });
      if (res.ok) {
        setLinks((prev) => ({ ...prev, [nolioId]: crmId }));
        setModal(null);
      }
    } finally {
      setSaving(null);
    }
  };

  // ── Unlink action ──────────────────────────────────────────────────────────
  const handleUnlink = async (nolioId: number) => {
    const crmId = links[nolioId];
    if (!crmId) return;
    setSaving(nolioId);
    try {
      const res = await fetch(`/api/athletes/${crmId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nolioId: null }),
      });
      if (res.ok) {
        setLinks((prev) => {
          const next = { ...prev };
          delete next[nolioId];
          return next;
        });
      }
    } finally {
      setSaving(null);
    }
  };

  // ── Stats (reactive) ──────────────────────────────────────────────────────
  const linkedCount = nolioAthletes.filter(
    (n) => links[n.nolio_id] || emailLinks[n.name.toLowerCase().trim()]
  ).length;

  const crmById = useMemo(
    () => Object.fromEntries(crmAthletes.map((a) => [a.id, a])),
    [crmAthletes]
  );

  return (
    <>
      {/* Stats bar */}
      <div className="flex items-center gap-3 mb-4 text-sm">
        <span className="text-emerald-600 font-semibold">{linkedCount} liés</span>
        <span className="text-gray-300">·</span>
        <span className="text-amber-600 font-semibold">{nolioAthletes.length - linkedCount} non liés</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600 w-32">Nolio ID</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Email Nolio</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Athlète CRM lié</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 w-36">Statut</th>
                <th className="w-28 px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {nolioAthletes.map((n) => {
                const linkedCrmId  = links[n.nolio_id];
                const emailCrmId   = emailLinks[n.name.toLowerCase().trim()];
                const isLinkedById = !!linkedCrmId;
                const isLinkedByEmail = !linkedCrmId && !!emailCrmId;
                const crmId = linkedCrmId ?? emailCrmId;
                const crm   = crmId ? crmById[crmId] : undefined;
                const isSaving = saving === n.nolio_id;

                return (
                  <tr
                    key={n.nolio_id}
                    className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                  >
                    {/* Nolio ID */}
                    <td className="px-5 py-3">
                      <code className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono text-xs font-bold">
                        {n.nolio_id}
                      </code>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">{n.name}</td>

                    {/* CRM athlete */}
                    <td className="px-5 py-3">
                      {crm ? (
                        <Link
                          href={`/athletes/${crm.id}`}
                          className="flex items-center gap-2 group w-fit"
                        >
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: coachById[crm.coachId]?.couleur || "#7c1d35" }}
                          >
                            {crm.prenom.charAt(0)}{crm.nom.charAt(0)}
                          </div>
                          <span className="text-sm font-semibold text-[#1a1218] group-hover:text-[#7c1d35] transition-colors">
                            {crm.prenom} {crm.nom}
                          </span>
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-300 italic">Non lié</span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="px-5 py-3">
                      {isLinkedById ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                          <CheckCircle2 size={11} />
                          Lié (ID)
                        </span>
                      ) : isLinkedByEmail ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                          <Link2 size={11} />
                          Email
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                          Non lié
                        </span>
                      )}
                    </td>

                    {/* Action button */}
                    <td className="px-5 py-3 text-right">
                      {isSaving ? (
                        <Loader2 size={16} className="animate-spin text-gray-400 ml-auto" />
                      ) : isLinkedById ? (
                        <button
                          onClick={() => handleUnlink(n.nolio_id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                        >
                          <Unlink size={12} />
                          Délier
                        </button>
                      ) : (
                        <button
                          onClick={() => setModal(n)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#7c1d35] rounded-lg hover:bg-[#9b2445] transition-colors"
                        >
                          <LinkIcon size={12} />
                          Lier
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Link Modal ─────────────────────────────────────────────────────── */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between p-5 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="font-bold text-[#1a1218] text-base">Lier à un athlète CRM</h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <code className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono text-xs font-bold">
                    {modal.nolio_id}
                  </code>
                  <span className="text-xs text-gray-400 font-mono">{modal.name}</span>
                </div>
              </div>
              <button
                onClick={() => setModal(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-100 flex-shrink-0">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par prénom, nom..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c1d35]/20 focus:border-[#7c1d35]"
                />
              </div>
            </div>

            {/* Results list */}
            <div className="overflow-y-auto flex-1 py-2">
              {filteredCrm.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">Aucun résultat</p>
              ) : (
                filteredCrm.map((a) => {
                  const coach = coachById[a.coachId];
                  const isAlreadyLinked = Object.values(links).includes(a.id);
                  return (
                    <button
                      key={a.id}
                      disabled={saving !== null}
                      onClick={() => handleLink(modal.nolio_id, a.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#7c1d35]/5 transition-colors text-left disabled:opacity-50"
                    >
                      {/* Avatar */}
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: coach?.couleur || "#7c1d35" }}
                      >
                        {a.prenom.charAt(0)}{a.nom.charAt(0)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[#1a1218] truncate">
                            {a.prenom} {a.nom}
                          </p>
                          {isAlreadyLinked && (
                            <span className="text-xs text-emerald-600 font-medium flex-shrink-0">
                              déjà lié
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {coach && (
                            <span className="text-xs text-gray-400">
                              {coach.prenom} {coach.nom}
                            </span>
                          )}
                          <span className="text-gray-200">·</span>
                          <span className="text-xs text-gray-400 capitalize">
                            {a.discipline.replace("_", " ")}
                          </span>
                        </div>
                      </div>

                      {/* Saving indicator */}
                      {saving === modal.nolio_id ? (
                        <Loader2 size={15} className="animate-spin text-gray-400 flex-shrink-0" />
                      ) : (
                        <LinkIcon size={14} className="text-gray-300 group-hover:text-[#7c1d35] flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer hint */}
            <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0">
              <p className="text-xs text-gray-400">
                Cliquez sur un athlète pour assigner l'ID Nolio <strong>{modal.nolio_id}</strong>.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
