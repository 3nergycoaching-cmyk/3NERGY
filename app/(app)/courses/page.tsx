import { readDB } from "@/lib/db";
import { Athlete, Coach, DistanceObjectif } from "@/lib/types";
import { normalizeRaceName, raceNamesAreSimilar, bestRaceName } from "@/lib/race-normalize";
import CoursesClient from "./CoursesClient";

export const dynamic = "force-dynamic";

// ─── Distance inference ──────────────────────────────────────────────────────

function inferDistance(titre: string): DistanceObjectif {
  const n = titre.toLowerCase();
  if (n.includes("ironman") || n.includes("iron man")) return "Ironman";
  if (n.includes("70.3") || n.includes("half ironman")) return "70.3";
  if (n.includes("olympic") || n.includes("olympi") || / do\b/.test(n) || /\bdo /.test(n)) return "Olympic";
  if (n.includes("sprint")) return "Sprint";
  if (n.includes("marathon") && !n.includes("semi") && !n.includes("half")) return "Marathon";
  if (n.includes("semi") || n.includes("half marathon")) return "Semi";
  if (n.includes("10km") || n.includes("10 km") || n.includes("10k")) return "10km";
  if (n.includes("5km") || n.includes("5 km") || n.includes("5k")) return "5km";
  return "Autre";
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CourseEntry {
  titre: string;
  date: string;                 // ISO "YYYY-MM-DD"
  distance: DistanceObjectif;
  isNolio: boolean;
  participants: {
    athlete: Athlete;
    coach: Coach | undefined;
  }[];
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function CoursesPage() {
  const db = await readDB();

  const coachById   = Object.fromEntries(db.coaches.map((c) => [c.id, c]));
  const athleteById = Object.fromEntries(db.athletes.map((a) => [a.id, a]));

  // ── Pass 1: exact grouping (titre + date key) ─────────────────────────────
  const exactMap = new Map<string, CourseEntry>();

  // Source 1: db.events (type = "competition")
  for (const ev of db.events) {
    if (ev.type !== "competition") continue;

    const key = `${ev.titre.trim().toLowerCase()}__${ev.dateDebut}`;

    if (!exactMap.has(key)) {
      exactMap.set(key, {
        titre: ev.titre,
        date: ev.dateDebut,
        distance: inferDistance(ev.titre),
        isNolio: ev.source === "nolio",
        participants: [],
      });
    }

    if (ev.athleteId) {
      const athlete = athleteById[ev.athleteId];
      if (athlete) {
        const entry = exactMap.get(key)!;
        if (!entry.participants.some((p) => p.athlete.id === athlete.id)) {
          entry.participants.push({ athlete, coach: coachById[athlete.coachId] });
        }
      }
    }
  }

  // Source 2: athlete.objectifs (manual, non-nolio only)
  for (const athlete of db.athletes) {
    for (const obj of athlete.objectifs ?? []) {
      if (obj.source === "nolio") continue;

      const key = `${obj.titre.trim().toLowerCase()}__${obj.date}`;
      if (!exactMap.has(key)) {
        exactMap.set(key, {
          titre: obj.titre,
          date: obj.date,
          distance: obj.distance,
          isNolio: false,
          participants: [],
        });
      }
      const entry = exactMap.get(key)!;
      if (!entry.participants.some((p) => p.athlete.id === athlete.id)) {
        entry.participants.push({ athlete, coach: coachById[athlete.coachId] });
      }
    }
  }

  // ── Pass 2: fuzzy merge on same date ─────────────────────────────────────
  // Group by date first to limit comparisons
  const byDate = new Map<string, CourseEntry[]>();
  Array.from(exactMap.values()).forEach((entry) => {
    const bucket = byDate.get(entry.date) ?? [];
    bucket.push(entry);
    byDate.set(entry.date, bucket);
  });

  // Union-Find helpers (index-based)
  function makeSets(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }
  function find(parent: number[], i: number): number {
    if (parent[i] !== i) parent[i] = find(parent, parent[i]);
    return parent[i];
  }
  function union(parent: number[], a: number, b: number) {
    parent[find(parent, a)] = find(parent, b);
  }

  const mergedEntries: CourseEntry[] = [];

  Array.from(byDate.values()).forEach((bucket) => {
    if (bucket.length === 1) {
      mergedEntries.push(bucket[0]);
      return;
    }

    const parent = makeSets(bucket.length);

    // Compare every pair in the bucket
    for (let i = 0; i < bucket.length; i++) {
      for (let j = i + 1; j < bucket.length; j++) {
        if (raceNamesAreSimilar(bucket[i].titre, bucket[j].titre)) {
          union(parent, i, j);
        }
      }
    }

    // Collect groups
    const groups = new Map<number, CourseEntry[]>();
    for (let i = 0; i < bucket.length; i++) {
      const root = find(parent, i);
      const g = groups.get(root) ?? [];
      g.push(bucket[i]);
      groups.set(root, g);
    }

    Array.from(groups.values()).forEach((group) => {
      if (group.length === 1) {
        mergedEntries.push(group[0]);
        return;
      }

      // Merge the group into one CourseEntry
      const allParticipants: CourseEntry["participants"] = [];
      const seenAthleteIds = new Set<string>();
      let hasNolio = false;
      const distances: DistanceObjectif[] = group.map((e: CourseEntry) => e.distance);

      group.forEach((entry: CourseEntry) => {
        if (entry.isNolio) hasNolio = true;
        entry.participants.forEach((p) => {
          if (!seenAthleteIds.has(p.athlete.id)) {
            seenAthleteIds.add(p.athlete.id);
            allParticipants.push(p);
          }
        });
      });

      // Best distance: prefer non-"Autre"
      const bestDist: DistanceObjectif =
        distances.find((d: DistanceObjectif) => d !== "Autre") ?? distances[0] ?? "Autre";

      mergedEntries.push({
        titre: bestRaceName(group.map((e: CourseEntry) => e.titre)),
        date: group[0].date,
        distance: bestDist,
        isNolio: hasNolio,
        participants: allParticipants,
      });
    });
  });

  // ── Sort ascending (closest first) ────────────────────────────────────────
  const events: CourseEntry[] = mergedEntries.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return <CoursesClient events={events} />;
}
