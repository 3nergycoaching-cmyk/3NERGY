"use client";

import React from "react";

export interface ResultRow {
  courseNom: string;
  dateDebut: string;
  athleteNom: string | null;
  discipline: string | null;
  temps: string;
  classement: string;
  recordPerso: boolean;
}

interface AthleteResult {
  athleteNom: string | null;
  temps: string;
  classement: string;
  recordPerso: boolean;
}

interface GroupedCourse {
  courseNom: string;
  dateDebut: string;
  discipline: string | null;
  athletes: AthleteResult[];
}

interface Props {
  rows: ResultRow[];
  /** null → titre "COURSES", valeur → titre discipline si tous identiques */
  sharedDiscipline: string | null;
  posterRef: React.RefObject<HTMLDivElement>;
}

const ACCENT = "#b02351";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }).toUpperCase();
  } catch {
    return iso;
  }
}

const disciplineLabels: Record<string, string> = {
  triathlon:     "TRIATHLON",
  cyclisme:      "CYCLISME",
  course_a_pied: "COURSE À PIED",
  autre:         "MULTI-SPORT",
};

function disciplineLabel(d: string | null): string {
  return d ? (disciplineLabels[d] ?? d.toUpperCase()) : "MULTI-SPORT";
}

/** Group rows sharing the same courseNom + dateDebut under one banner */
function groupRows(rows: ResultRow[]): GroupedCourse[] {
  const map = new Map<string, GroupedCourse>();
  for (const row of rows) {
    const key = `${row.courseNom}||${row.dateDebut}`;
    if (!map.has(key)) {
      map.set(key, {
        courseNom: row.courseNom,
        dateDebut: row.dateDebut,
        discipline: row.discipline,
        athletes: [],
      });
    }
    map.get(key)!.athletes.push({
      athleteNom: row.athleteNom,
      temps: row.temps,
      classement: row.classement,
      recordPerso: row.recordPerso,
    });
  }
  return Array.from(map.values());
}

export default function PosterPreview({ rows, sharedDiscipline, posterRef }: Props) {
  const mainTitle = sharedDiscipline ? disciplineLabel(sharedDiscipline) : "COURSES";
  const groups = groupRows(rows);

  return (
    <div
      ref={posterRef}
      style={{
        width: 540,
        height: 540,
        position: "relative",
        background: "#0a0a0a",
        overflow: "hidden",
        fontFamily: "'Bricolage Grotesque', 'Inter', Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Background splashes */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{
          position: "absolute", top: -80, left: -80, width: 280, height: 280,
          background: `radial-gradient(circle, ${ACCENT}55 0%, transparent 70%)`,
        }} />
        <div style={{
          position: "absolute", bottom: -60, right: -60, width: 260, height: 260,
          background: `radial-gradient(circle, ${ACCENT}44 0%, transparent 70%)`,
        }} />
        <div style={{
          position: "absolute", top: -40, right: -40, width: 160, height: 160,
          background: `radial-gradient(circle, ${ACCENT}30 0%, transparent 70%)`,
        }} />
        <div style={{
          position: "absolute", bottom: -30, left: -30, width: 140, height: 140,
          background: `radial-gradient(circle, ${ACCENT}22 0%, transparent 70%)`,
        }} />
      </div>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "24px 28px 0",
        position: "relative", zIndex: 1,
      }}>
        <div style={{
          fontSize: 38, fontWeight: 900, color: "#ffffff",
          letterSpacing: "0.06em", lineHeight: 1,
          textTransform: "uppercase",
        }}>
          {mainTitle}
        </div>

        {/* Logo — ~2.3× bigger than before (was h:44, now h:100) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-3nergy-blanc.png"
          alt="3NERGY"
          style={{ height: 100, objectFit: "contain", flexShrink: 0 }}
        />
      </div>

      {/* Divider */}
      <div style={{
        margin: "12px 28px 10px",
        height: 2,
        background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT}88, transparent)`,
        position: "relative", zIndex: 1,
      }} />

      {/* Results */}
      <div style={{
        flex: 1, overflowY: "hidden",
        padding: "0 20px",
        display: "flex", flexDirection: "column", gap: 9,
        position: "relative", zIndex: 1,
      }}>
        {groups.map((group, i) => (
          <CourseGroup key={i} group={group} />
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: "8px 28px 14px",
        textAlign: "center",
        position: "relative", zIndex: 1,
      }}>
        <div style={{ height: 1, background: "rgba(255,255,255,0.08)", marginBottom: 8 }} />
        <span style={{
          fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.35)",
          letterSpacing: "0.18em", textTransform: "uppercase",
        }}>
          WWW.3NERGY.BE
        </span>
      </div>
    </div>
  );
}

function CourseGroup({ group }: { group: GroupedCourse }) {
  const discLabel = group.discipline ? disciplineLabels[group.discipline] ?? group.discipline.toUpperCase() : null;

  return (
    <div style={{ borderRadius: 8, overflow: "hidden" }}>
      {/* Bandeau rose — discipline (petit) + nom course + date */}
      <div style={{
        background: ACCENT,
        padding: "5px 14px 6px",
        display: "flex", flexDirection: "column", gap: 1,
      }}>
        {discLabel && (
          <span style={{
            fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.75)",
            letterSpacing: "0.16em", textTransform: "uppercase",
          }}>
            {discLabel}
          </span>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{
            fontSize: 11, fontWeight: 800, color: "#fff",
            letterSpacing: "0.06em", textTransform: "uppercase",
            flex: 1, marginRight: 8,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {group.courseNom}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.80)",
            letterSpacing: "0.08em", flexShrink: 0,
          }}>
            {formatDate(group.dateDebut)}
          </span>
        </div>
      </div>

      {/* Un bloc par athlète */}
      {group.athletes.map((a, idx) => (
        <AthleteRow
          key={idx}
          athlete={a}
          isLast={idx === group.athletes.length - 1}
        />
      ))}
    </div>
  );
}

function AthleteRow({ athlete, isLast }: { athlete: AthleteResult; isLast: boolean }) {
  const hasResult = athlete.temps || athlete.classement;
  const result = [athlete.temps, athlete.classement].filter(Boolean).join("  •  ");

  return (
    <div style={{
      background: "rgba(255,255,255,0.06)",
      borderLeft: `2px solid ${ACCENT}`,
      borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.04)",
      padding: "7px 14px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 8,
    }}>
      <span style={{
        fontSize: 12, fontWeight: 700, color: "#ffffff",
        flex: 1, minWidth: 0,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {athlete.athleteNom ?? "—"}
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {hasResult && (
          <span style={{
            background: "#ffffff", color: "#1a1218",
            fontSize: 11, fontWeight: 800,
            padding: "3px 10px", borderRadius: 20,
            letterSpacing: "0.04em",
          }}>
            {result}
          </span>
        )}
        {athlete.recordPerso && (
          <span style={{ fontSize: 16, lineHeight: 1 }}>🏅</span>
        )}
      </div>
    </div>
  );
}
