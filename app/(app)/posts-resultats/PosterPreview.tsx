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

interface Props {
  rows: ResultRow[];
  /** null → titre "COURSES", valeur → titre en discipline (si tous identiques) */
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
  triathlon: "TRIATHLON",
  cyclisme: "CYCLISME",
  course_a_pied: "COURSE À PIED",
  autre: "MULTI-SPORT",
};

function disciplineLabel(d: string | null): string {
  return d ? (disciplineLabels[d] ?? d.toUpperCase()) : "MULTI-SPORT";
}

export default function PosterPreview({ rows, sharedDiscipline, posterRef }: Props) {
  const mainTitle = sharedDiscipline ? disciplineLabel(sharedDiscipline) : "COURSES";

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
        padding: "28px 30px 0",
        position: "relative", zIndex: 1,
      }}>
        {/* Title */}
        <div>
          <div style={{
            fontSize: 38, fontWeight: 900, color: "#ffffff",
            letterSpacing: "0.06em", lineHeight: 1,
            textTransform: "uppercase",
          }}>
            {mainTitle}
          </div>
        </div>

        {/* Logo image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-3nergy-blanc.png"
          alt="3NERGY"
          style={{ height: 44, objectFit: "contain", flexShrink: 0 }}
        />
      </div>

      {/* Divider */}
      <div style={{
        margin: "14px 30px 12px",
        height: 2,
        background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT}88, transparent)`,
        position: "relative", zIndex: 1,
      }} />

      {/* Results */}
      <div style={{
        flex: 1, overflowY: "hidden",
        padding: "0 22px",
        display: "flex", flexDirection: "column", gap: 10,
        position: "relative", zIndex: 1,
      }}>
        {rows.map((row, i) => (
          <ResultCard key={i} row={row} />
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: "10px 30px 16px",
        textAlign: "center",
        position: "relative", zIndex: 1,
      }}>
        <div style={{ height: 1, background: "rgba(255,255,255,0.08)", marginBottom: 10 }} />
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

function ResultCard({ row }: { row: ResultRow }) {
  const hasResult = row.temps || row.classement;
  const result = [row.temps, row.classement].filter(Boolean).join("  •  ");
  const discLabel = row.discipline ? disciplineLabels[row.discipline] ?? row.discipline.toUpperCase() : null;

  return (
    <div style={{ borderRadius: 8, overflow: "hidden" }}>
      {/* Bandeau accent — discipline + nom course + date */}
      <div style={{
        background: ACCENT,
        padding: "5px 14px 6px",
        display: "flex", flexDirection: "column", gap: 1,
      }}>
        {/* Discipline en petit au-dessus */}
        {discLabel && (
          <span style={{
            fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.75)",
            letterSpacing: "0.16em", textTransform: "uppercase",
          }}>
            {discLabel}
          </span>
        )}
        {/* Course nom + date */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{
            fontSize: 11, fontWeight: 800, color: "#fff",
            letterSpacing: "0.06em", textTransform: "uppercase",
            flex: 1, marginRight: 8,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {row.courseNom}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.80)",
            letterSpacing: "0.08em", flexShrink: 0,
          }}>
            {formatDate(row.dateDebut)}
          </span>
        </div>
      </div>

      {/* Bloc résultat sombre */}
      <div style={{
        background: "rgba(255,255,255,0.06)",
        borderLeft: `2px solid ${ACCENT}`,
        padding: "8px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 8,
      }}>
        <span style={{
          fontSize: 13, fontWeight: 700, color: "#ffffff",
          flex: 1, minWidth: 0,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {row.athleteNom ?? "—"}
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
          {row.recordPerso && (
            <span style={{ fontSize: 16, lineHeight: 1 }}>🏅</span>
          )}
        </div>
      </div>
    </div>
  );
}
