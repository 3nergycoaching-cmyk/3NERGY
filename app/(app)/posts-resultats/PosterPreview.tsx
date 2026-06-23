"use client";

import React from "react";

export interface ResultRow {
  courseNom: string;
  dateDebut: string;
  athleteNom: string | null;
  temps: string;
  classement: string;
  recordPerso: boolean;
}

interface Props {
  rows: ResultRow[];
  discipline: string | null;
  posterRef: React.RefObject<HTMLDivElement>;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }).toUpperCase();
  } catch {
    return iso;
  }
}

function disciplineLabel(d: string | null): string {
  const map: Record<string, string> = {
    triathlon: "Triathlon",
    cyclisme: "Cyclisme",
    course_a_pied: "Course à pied",
    autre: "Multi-sport",
  };
  return d ? (map[d] ?? d) : "Multi-sport";
}

export default function PosterPreview({ rows, discipline, posterRef }: Props) {
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
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
      }}>
        {/* Top-left bordeaux radial */}
        <div style={{
          position: "absolute", top: -80, left: -80,
          width: 280, height: 280,
          background: "radial-gradient(circle, rgba(124,29,53,0.55) 0%, transparent 70%)",
        }} />
        {/* Bottom-right rose radial */}
        <div style={{
          position: "absolute", bottom: -60, right: -60,
          width: 260, height: 260,
          background: "radial-gradient(circle, rgba(232,100,138,0.40) 0%, transparent 70%)",
        }} />
        {/* Top-right subtle */}
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 160, height: 160,
          background: "radial-gradient(circle, rgba(155,36,69,0.30) 0%, transparent 70%)",
        }} />
        {/* Bottom-left subtle */}
        <div style={{
          position: "absolute", bottom: -30, left: -30,
          width: 140, height: 140,
          background: "radial-gradient(circle, rgba(232,100,138,0.20) 0%, transparent 70%)",
        }} />
      </div>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        padding: "28px 30px 0",
        position: "relative", zIndex: 1,
      }}>
        <div>
          <div style={{
            fontSize: 38, fontWeight: 900, color: "#ffffff",
            letterSpacing: "0.06em", lineHeight: 1,
            textTransform: "uppercase",
          }}>
            COURSES
          </div>
          <div style={{
            marginTop: 4,
            fontSize: 13, fontWeight: 700, color: "#e8648a",
            letterSpacing: "0.12em", textTransform: "uppercase",
          }}>
            {disciplineLabel(discipline)}
          </div>
        </div>
        {/* 3NERGY logo */}
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontSize: 20, fontWeight: 900, color: "#ffffff", letterSpacing: "0.08em",
          }}>
            3NERGY
          </div>
          <div style={{
            fontSize: 9, fontWeight: 600, color: "#e8648a", letterSpacing: "0.15em",
            marginTop: 1,
          }}>
            CRM
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{
        margin: "14px 30px 12px",
        height: 1.5,
        background: "linear-gradient(90deg, #7c1d35, #e8648a, transparent)",
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
        <div style={{
          height: 1, background: "rgba(255,255,255,0.08)", marginBottom: 10,
        }} />
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

  return (
    <div style={{ borderRadius: 8, overflow: "hidden" }}>
      {/* Rose band — course name + date */}
      <div style={{
        background: "linear-gradient(90deg, #e8648a, #c84d73)",
        padding: "6px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
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

      {/* Dark result block */}
      <div style={{
        background: "rgba(255,255,255,0.06)",
        borderLeft: "2px solid #7c1d35",
        padding: "8px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 8,
      }}>
        {/* Athlete name */}
        <span style={{
          fontSize: 13, fontWeight: 700, color: "#ffffff",
          flex: 1, minWidth: 0,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {row.athleteNom ?? "—"}
        </span>

        {/* Result badge + PR medal */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {hasResult && (
            <span style={{
              background: "#ffffff",
              color: "#1a1218",
              fontSize: 11, fontWeight: 800,
              padding: "3px 10px",
              borderRadius: 20,
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
