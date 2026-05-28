"use client";

import { useState } from "react";
import { Flag, Users, Calendar, Wifi, Clock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import SyncNolioButton from "./SyncNolioButton";
import { DistanceObjectif } from "@/lib/types";
import { CourseEntry } from "./page";

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

export default function CoursesClient({ events }: { events: CourseEntry[] }) {
  const [showPast, setShowPast] = useState(false);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcomingEvents = events.filter((e) => new Date(e.date + "T00:00:00") >= now);
  const pastEvents     = events.filter((e) => new Date(e.date + "T00:00:00") < now);
  const displayed      = showPast ? events : upcomingEvents;

  const totalParticipants = upcomingEvents.reduce((s, e) => s + e.participants.length, 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1218]">Courses & Événements</h1>
          <p className="text-gray-500 text-sm mt-1">
            {upcomingEvents.length} à venir · {totalParticipants} inscriptions
            {pastEvents.length > 0 && (
              <span className="ml-2 text-gray-400">· {pastEvents.length} passées</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {pastEvents.length > 0 && (
            <button
              onClick={() => setShowPast((v) => !v)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                showPast
                  ? "bg-gray-100 border-gray-200 text-gray-700"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {showPast ? <EyeOff size={14} /> : <Eye size={14} />}
              {showPast ? "Masquer les passées" : `Voir les passées (${pastEvents.length})`}
            </button>
          )}
          <SyncNolioButton />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-[#7c1d35]/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Flag className="w-5 h-5 text-[#7c1d35]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#1a1218]">{upcomingEvents.length}</p>
            <p className="text-xs text-gray-500">Courses à venir</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#1a1218]">
              {upcomingEvents.length > 0
                ? Math.ceil((new Date(upcomingEvents[0].date + "T00:00:00").getTime() - Date.now()) / 86400000)
                : "—"}
            </p>
            <p className="text-xs text-gray-500">Jours avant la prochaine</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#1a1218]">{totalParticipants}</p>
            <p className="text-xs text-gray-500">Inscriptions à venir</p>
          </div>
        </div>
      </div>

      {/* Events list */}
      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Flag className="w-12 h-12 text-gray-200 mb-4" />
          <p className="text-gray-400 font-medium">Aucune course à venir</p>
          <p className="text-gray-300 text-sm mt-1">
            {pastEvents.length > 0
              ? "Utilisez le bouton ci-dessus pour voir les courses passées"
              : "Synchronisez Nolio ou ajoutez des objectifs sur les fiches athlètes"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {showPast && pastEvents.length > 0 && (
            <>
              {pastEvents.map((entry) => (
                <EventCard
                  key={`${entry.titre}__${entry.date}`}
                  entry={entry}
                  isPast
                />
              ))}

              {upcomingEvents.length > 0 && (
                <div className="flex items-center gap-3 py-2">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-gray-200">
                    <Clock size={11} />
                    Courses à venir
                  </span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>
              )}
            </>
          )}

          {upcomingEvents.map((entry) => (
            <EventCard
              key={`${entry.titre}__${entry.date}`}
              entry={entry}
              isPast={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Event Card ─────────────────────────────────────────────────────────────

function EventCard({
  entry,
  isPast,
}: {
  entry: CourseEntry;
  isPast: boolean;
}) {
  const { titre, date, distance, isNolio, participants } = entry;

  const daysLeft = Math.ceil(
    (new Date(date + "T00:00:00").getTime() - Date.now()) / 86400000
  );
  const distClass = distanceBadge[distance as DistanceObjectif] ?? "bg-gray-100 text-gray-600";

  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${
      isPast ? "border-gray-100 opacity-60" : "border-gray-100 hover:shadow-md"
    }`}>
      {/* Event header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isPast ? "bg-gray-100" : "bg-[#7c1d35]/10"
          }`}>
            <Flag className={`w-5 h-5 ${isPast ? "text-gray-400" : "text-[#7c1d35]"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-[#1a1218] text-lg">{titre}</h2>
              {isNolio && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-[#7c1d35] text-white px-2 py-0.5 rounded-full">
                  <Wifi size={9} />
                  Nolio
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${distClass}`}>
                {distance}
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar size={11} />
                {new Date(date + "T00:00:00").toLocaleDateString("fr-FR", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          {isPast ? (
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl">Passé</span>
          ) : (
            <div>
              <p className="text-2xl font-bold text-[#7c1d35]">J-{daysLeft}</p>
              <p className="text-xs text-gray-400">
                {participants.length} athlète{participants.length > 1 ? "s" : ""} 3NERGY
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Participants */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {participants.map(({ athlete, coach }) => {
            const isLinked = !!athlete.nolioId;
            return (
              <Link
                key={athlete.id}
                href={`/athletes/${athlete.id}`}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 hover:bg-[#7c1d35]/5 transition-colors group"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: coach?.couleur || "#999" }}
                >
                  {athlete.prenom.charAt(0)}{athlete.nom.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-semibold text-[#1a1218] truncate group-hover:text-[#7c1d35] transition-colors">
                      {athlete.prenom} {athlete.nom}
                    </p>
                    {isLinked && (
                      <span title={`Lié à Nolio · ID ${athlete.nolioId}`}>
                        <CheckCircle2 size={10} className="text-emerald-500 flex-shrink-0" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {coach ? `${coach.prenom} ${coach.nom}` : "—"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
