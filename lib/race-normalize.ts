/**
 * Shared race-name normalisation utilities.
 * Used by /courses (server) and /posts-resultats/PosterPreview (client).
 */

/** Remove accents: "é" → "e", "ç" → "c", etc. */
export function removeAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Normalise a race name for fuzzy comparison:
 *  - lower-case + trim
 *  - remove accents
 *  - "20 km" | "20km" | "20kms" → "20km"
 *  - remove stopwords: de/du/des/d/les/la/le/l/en/au/aux/sur/à/a/et
 *  - collapse whitespace
 *  - remove punctuation (except digits)
 */
export function normalizeRaceName(name: string): string {
  let s = removeAccents(name.toLowerCase().trim());
  // Unify km variants: "20 km", "20kms", "20 kms" → "20km"
  s = s.replace(/(\d+)\s*kms?\b/g, "$1km");
  // Remove articles and prepositions
  s = s.replace(/\b(de|du|des|d|les|la|le|l|en|au|aux|sur|à|a|et)\b/g, " ");
  // Remove punctuation (keep alphanumeric, spaces, dots for "70.3")
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
    .filter((t) => t.length >= 3 || /^\d+/.test(t));
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

/**
 * Two race names are "similar" on the same date if:
 *  - Levenshtein(norm(a), norm(b)) ≤ 4, OR
 *  - They share ≥ 2 significant keywords (catches "20km Bruxelles" vs "20 km de Bruxelles")
 *
 * Guards:
 *  - conflicting specific distances → not similar
 *  - generic names with ≤ 2 tokens → require exact normalised match
 */
export function raceNamesAreSimilar(a: string, b: string): boolean {
  const na = normalizeRaceName(a);
  const nb = normalizeRaceName(b);
  if (na === nb) return true;

  // Guard: conflicting specific distances → definitely different races
  const SPECIFIC = ["sprint", "olympic", "70.3", "ironman", "5km", "10km", "semi", "marathon"] as const;
  const distA = SPECIFIC.find((d) => na.includes(d));
  const distB = SPECIFIC.find((d) => nb.includes(d));
  if (distA && distB && distA !== distB) return false;

  // Guard: short / generic names → too risky to fuzzy-match
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
