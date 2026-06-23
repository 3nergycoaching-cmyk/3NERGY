/**
 * Shared race-name normalisation utilities.
 * Used by /courses (server) and /posts-resultats/PosterPreview (client).
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CourseGroupOverrides {
  /** groupKey (normalizedName||date) → custom display name */
  displayNames: Record<string, string>;
  /** pairs of [normA, normB] that must NEVER be auto-merged */
  forceSeparate: [string, string][];
  /** pairs of [normA, normB] that must ALWAYS be merged */
  forceMerge: [string, string][];
}

export const DEFAULT_COURSE_OVERRIDES: CourseGroupOverrides = {
  displayNames: {},
  forceSeparate: [],
  forceMerge: [],
};

// ─── Normalisation ───────────────────────────────────────────────────────────

/** Remove accents: "é" → "e", "ç" → "c", etc. */
export function removeAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Normalise a race name for fuzzy comparison:
 *  - lower-case + trim + remove accents
 *  - "20 km" | "20km" | "20kms" | "20 kil" | "20k" → "20km"
 *  - remove articles/prepositions (de/du/des/le/la/les/en/à…)
 *  - remove punctuation (keep digits, alpha, spaces, "." for "70.3")
 *  - collapse whitespace
 */
export function normalizeRaceName(name: string): string {
  let s = removeAccents(name.toLowerCase().trim());
  // Unify km variants: "20 km", "20kms", "20 kil", "20 kilomètr…" → "20km"
  s = s.replace(/(\d+)\s*(?:kilomet(?:re|er)s?|kils?|kms?)\b/g, "$1km");
  // "20k" word-boundary → "20km"
  s = s.replace(/(\d+)k\b/g, "$1km");
  // Remove articles and prepositions
  s = s.replace(/\b(de|du|des|d|les|la|le|l|en|au|aux|sur|a|et)\b/g, " ");
  // Remove punctuation (keep alphanumeric + "." for 70.3)
  s = s.replace(/[^\w\s.]/g, " ");
  // Collapse whitespace
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/** Pick the most descriptive name (longest after trimming). */
export function bestRaceName(names: string[]): string {
  return names.reduce((best, n) => (n.trim().length > best.trim().length ? n : best), names[0]);
}

/** Extract "significant" tokens: numbers, words ≥ 3 chars. */
export function raceKeywords(name: string): Set<string> {
  const tokens = normalizeRaceName(name)
    .split(" ")
    .filter((t) => t.length >= 3 || /^\d/.test(t));
  return new Set(tokens);
}

/** Classic Levenshtein distance (O(n·m)). */
export function levenshtein(a: string, b: string): number {
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

const SPECIFIC_DISTANCES = ["sprint", "olympic", "70.3", "ironman", "5km", "10km", "semi", "marathon"] as const;

/**
 * Two race names are "similar" on the same date if:
 *  - normalised forms are identical, OR
 *  - Levenshtein(norm(a), norm(b)) ≤ 4, OR
 *  - They share ≥ 2 significant keywords
 *
 * Guards:
 *  - conflicting specific distances → not similar
 *  - ≤ 2 normalised tokens → require exact match (too generic to fuzzy-match)
 */
export function raceNamesAreSimilar(a: string, b: string): boolean {
  const na = normalizeRaceName(a);
  const nb = normalizeRaceName(b);
  if (na === nb) return true;

  // Guard: conflicting specific distances
  const distA = SPECIFIC_DISTANCES.find((d) => na.includes(d));
  const distB = SPECIFIC_DISTANCES.find((d) => nb.includes(d));
  if (distA && distB && distA !== distB) return false;

  // Guard: short/generic names → too risky to fuzzy-match
  const tokA = na.split(" ").filter(Boolean);
  const tokB = nb.split(" ").filter(Boolean);
  if (tokA.length <= 2 || tokB.length <= 2) return false;

  const maxLen = Math.max(na.length, nb.length);
  if (maxLen <= 6) return levenshtein(na, nb) <= 1;
  if (levenshtein(na, nb) <= 4) return true;

  // Keyword overlap: at least 2 shared tokens
  const ka = raceKeywords(a);
  const kb = raceKeywords(b);
  let shared = 0;
  ka.forEach((k) => { if (kb.has(k)) shared++; });
  return shared >= 2;
}

// ─── Override-aware similarity ────────────────────────────────────────────────

/**
 * Like raceNamesAreSimilar but respects manual forceMerge / forceSeparate overrides.
 * forceMerge takes priority over forceSeparate (to allow un-splitting).
 */
export function raceNamesAreSimilarWithOverrides(
  a: string,
  b: string,
  overrides: CourseGroupOverrides
): boolean {
  const na = normalizeRaceName(a);
  const nb = normalizeRaceName(b);

  const isForcedMerge = overrides.forceMerge.some(
    ([x, y]) => (x === na && y === nb) || (x === nb && y === na)
  );
  if (isForcedMerge) return true;

  const isForcedSep = overrides.forceSeparate.some(
    ([x, y]) => (x === na && y === nb) || (x === nb && y === na)
  );
  if (isForcedSep) return false;

  return raceNamesAreSimilar(a, b);
}
