import { readDB } from "@/lib/db";
import { Athlete, Coach, DistanceObjectif } from "@/lib/types";
import CoursesClient from "./CoursesClient";

export const dynamic = "force-dynamic";

// ─── Normalisation ──────────────────────────────────────────────────────────

/** Remove accents: "é" → "e", "ç" → "c", etc. */
function removeAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Normalise a race name for fuzzy comparison:
 *  - lower-case
 *  - remove accents
 *  - "20 km" | "20km" | "20kms" → "20km"
 *  - remove stopwords: de/du/des/d'/les/la/le/l'/en/au/aux/sur/à
 *  - collapse whitespace
 */
function normalise(name: string): string {
  let s = removeAccents(name.toLowerCase().trim());
  // Unify km variants: "20 km", "20kms", "20 kms" → "20km"
  s = s.replace(/(\d+)\s*kms?\b/g, "$1km");
  // Remove articles and prepositions
  s = s.replace(/\b(de|du|des|d|les|la|le|l|en|au|aux|sur|à|a|et)\b/g, " ");
  // Collapse whitespace
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/** Extract "significant" tokens: numbers, words ≥ 4 chars. */
function keywords(name: string): Set<string> {
  const tokens = normalise(name).split(" ").filter((t) => t.length >= 3 || /^\d+/.test(t));
  return new Set(tokens);
}

/** Classic Levenshtein distance (O(n·m)). */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/** Distances considered "specific" — two different specific distances = different race. */
const SPECIFIC_DISTANCES = new Set<DistanceObjectif>(["Sprint","Olympic","70.3","Ironman","5km","10km","Semi","Marathon"]);

/**
 * Two race names are "similar" on the same date if:
 *  - Levenshtein(norm(a), norm(b)) ≤ 4, OR
 *  - They share ≥ 2 significant keywords (catches "20km Bruxelles" vs "20 km de Bruxelles")
 *
 * Guard: if both have specific but DIFFERENT inferred distances → not similar.
 */
function areSimilar(a: string, b: string): boolean {
  const na = normalise(a);
  const nb = normalise(b);
  if (na === nb) return true;

  // Guard: conflicting specific distances → definitely different races
  const da = inferDistance(a);
  const db = inferDistance(b);
  if (da !== db && SPECIFIC_DISTANCES.has(da) && SPECIFIC_DISTANCES.has(db)) return false;

  // Guard: generic names with ≤ 2 tokens are too ambiguous to fuzzy-match
  const tokensA = normalise(a).split(" ").filter(Boolean);
  const tokensB = normalise(b).split(" ").filter(Boolean);
  if (tokensA.length <= 2 || tokensB.length <= 2) {
    // Only allow if they're literally equal after normalisation (already caught above)
    return false;
  }

  // Levenshtein threshold
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen <= 6) return levenshtein(na, nb) <= 1;   // short names: stricter
  if (levenshtein(na, nb) <= 4) return true;

  // Keyword overlap: at least 2 shared tokens
  const ka = keywords(a);
  const kb = keywords(b);
  let shared = 0;
  ka.forEach((k) => { if (kb.has(k)) shared++; });
  return shared >= 2;
}

/** Pick the most descriptive name (longest after trimming). */
function bestName(names: string[]): string {
  return names.reduce((best, n) => (n.trim().length > best.trim().length ? n : best), names[0]);
}

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
        if (areSimilar(bucket[i].titre, bucket[j].titre)) {
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
        titre: bestName(group.map((e: CourseEntry) => e.titre)),
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
