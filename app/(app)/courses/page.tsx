import { readDB } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { Athlete, Coach, DistanceObjectif } from "@/lib/types";
import {
  normalizeRaceName,
  raceNamesAreSimilarWithOverrides,
  bestRaceName,
  CourseGroupOverrides,
  DEFAULT_COURSE_OVERRIDES,
} from "@/lib/race-normalize";
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
  /** normalizeRaceName(bestTitle)||date — used for override lookup */
  groupKey: string;
  /** original (raw) names that were merged into this group */
  originalTitres: string[];
  date: string;
  distance: DistanceObjectif;
  isNolio: boolean;
  participants: {
    athlete: Athlete;
    coach: Coach | undefined;
  }[];
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function CoursesPage() {
  const [db, overridesRow] = await Promise.all([
    readDB(),
    prisma.appConfig.findUnique({ where: { key: "courseGroupOverrides" } }),
  ]);

  const overrides: CourseGroupOverrides = overridesRow
    ? { ...DEFAULT_COURSE_OVERRIDES, ...(overridesRow.value as unknown as Partial<CourseGroupOverrides>) }
    : { ...DEFAULT_COURSE_OVERRIDES };

  const coachById   = Object.fromEntries(db.coaches.map((c) => [c.id, c]));
  const athleteById = Object.fromEntries(db.athletes.map((a) => [a.id, a]));

  // ── Pass 1: exact grouping (titre + date key) ─────────────────────────────
  type RawEntry = {
    titre: string;
    date: string;
    distance: DistanceObjectif;
    isNolio: boolean;
    participants: CourseEntry["participants"];
  };

  const exactMap = new Map<string, RawEntry>();

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

  // ── Pass 2: fuzzy merge on same date (with override awareness) ────────────
  const byDate = new Map<string, RawEntry[]>();
  for (const entry of Array.from(exactMap.values())) {
    const bucket = byDate.get(entry.date) ?? [];
    bucket.push(entry);
    byDate.set(entry.date, bucket);
  }

  // Union-Find
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

  for (const bucket of Array.from(byDate.values())) {
    if (bucket.length === 1) {
      const e = bucket[0];
      const defaultTitle = e.titre;
      const groupKey = `${normalizeRaceName(defaultTitle)}||${e.date}`;
      mergedEntries.push({
        ...e,
        titre: overrides.displayNames[groupKey] ?? defaultTitle,
        groupKey,
        originalTitres: [e.titre],
      });
      continue;
    }

    const parent = makeSets(bucket.length);
    for (let i = 0; i < bucket.length; i++) {
      for (let j = i + 1; j < bucket.length; j++) {
        if (raceNamesAreSimilarWithOverrides(bucket[i].titre, bucket[j].titre, overrides)) {
          union(parent, i, j);
        }
      }
    }

    const groups = new Map<number, RawEntry[]>();
    for (let i = 0; i < bucket.length; i++) {
      const root = find(parent, i);
      const g = groups.get(root) ?? [];
      g.push(bucket[i]);
      groups.set(root, g);
    }

    for (const group of Array.from(groups.values())) {
      if (group.length === 1) {
        const e = group[0];
        const defaultTitle = e.titre;
        const groupKey = `${normalizeRaceName(defaultTitle)}||${e.date}`;
        mergedEntries.push({
          ...e,
          titre: overrides.displayNames[groupKey] ?? defaultTitle,
          groupKey,
          originalTitres: [e.titre],
        });
        continue;
      }

      const allParticipants: CourseEntry["participants"] = [];
      const seenIds = new Set<string>();
      let hasNolio = false;
      const distances: DistanceObjectif[] = group.map((e: RawEntry) => e.distance);

      for (const entry of group) {
        if (entry.isNolio) hasNolio = true;
        for (const p of entry.participants) {
          if (!seenIds.has(p.athlete.id)) {
            seenIds.add(p.athlete.id);
            allParticipants.push(p);
          }
        }
      }

      const bestDist: DistanceObjectif =
        distances.find((d: DistanceObjectif) => d !== "Autre") ?? distances[0] ?? "Autre";

      const defaultTitle = bestRaceName(group.map((e: RawEntry) => e.titre));
      const groupKey = `${normalizeRaceName(defaultTitle)}||${group[0].date}`;
      const originalTitres: string[] = Array.from(new Set<string>(group.map((e: RawEntry) => e.titre)));

      mergedEntries.push({
        titre: overrides.displayNames[groupKey] ?? defaultTitle,
        groupKey,
        originalTitres,
        date: group[0].date,
        distance: bestDist,
        isNolio: hasNolio,
        participants: allParticipants,
      });
    }
  }

  const events: CourseEntry[] = mergedEntries.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return <CoursesClient events={events} overrides={overrides} />;
}
