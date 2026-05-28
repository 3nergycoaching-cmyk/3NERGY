/**
 * lib/nolio.ts — Nolio API helper (server-side only, never imported client-side)
 * All secrets stay on the server; client never sees access_token or client_secret.
 */

import { NolioToken, CalendarEvent } from "./types";

const NOLIO_BASE   = "https://www.nolio.io/api";
const CLIENT_ID    = process.env.NOLIO_CLIENT_ID!;
const CLIENT_SECRET = process.env.NOLIO_CLIENT_SECRET!;
const REDIRECT_URI  = process.env.NOLIO_REDIRECT_URI!;

// ── Authorization URL ───────────────────────────────────────────────────────

export function buildAuthUrl(athleteId: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    state: Buffer.from(athleteId).toString("base64url"),
  });
  return `${NOLIO_BASE}/authorize/?${params.toString()}`;
}

export function decodeState(state: string): string {
  return Buffer.from(state, "base64url").toString("utf-8");
}

// ── Token exchange ──────────────────────────────────────────────────────────

export async function exchangeCode(code: string): Promise<NolioToken> {
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
  });

  const res = await fetch(`${NOLIO_BASE}/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Nolio token exchange failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    expiresAt:    Date.now() + (data.expires_in ?? 86400) * 1000,
  };
}

// ── Token refresh ───────────────────────────────────────────────────────────

export async function refreshAccessToken(token: NolioToken): Promise<NolioToken> {
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: token.refreshToken,
  });

  const res = await fetch(`${NOLIO_BASE}/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Nolio refresh failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return {
    ...token,
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? token.refreshToken,
    expiresAt:   Date.now() + (data.expires_in ?? 86400) * 1000,
  };
}

// ── Get a valid token (auto-refresh if expired) ─────────────────────────────

export async function getValidToken(token: NolioToken): Promise<NolioToken> {
  // Refresh 5 min before expiry
  if (Date.now() >= token.expiresAt - 5 * 60 * 1000) {
    return refreshAccessToken(token);
  }
  return token;
}

// ── Generic authenticated call ──────────────────────────────────────────────

export async function nolioGet<T = unknown>(
  endpoint: string,
  token: NolioToken,
  params: Record<string, string> = {},
): Promise<T> {
  const valid = await getValidToken(token);
  const qs = Object.keys(params).length
    ? "?" + new URLSearchParams(params).toString()
    : "";

  const res = await fetch(`${NOLIO_BASE}${endpoint}${qs}`, {
    headers: {
      Authorization: `Bearer ${valid.accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Nolio GET ${endpoint} failed (${res.status}): ${err}`);
  }

  return res.json() as Promise<T>;
}

// ── Nolio user/athlete shapes ────────────────────────────────────────────────

export interface NolioUser {
  id: number;
  first_name: string;
  last_name: string;
  birthday?: string;
  [key: string]: unknown;
}

export interface NolioAthleteEntry {
  nolio_id: number;
  name: string;
  [key: string]: unknown;
}

export async function fetchNolioUser(token: NolioToken): Promise<NolioUser> {
  const data = await nolioGet<NolioUser>("/get/user/", token);
  console.log("[Nolio] GET /get/user/ →", JSON.stringify(data, null, 2));
  return data;
}

/**
 * Fetch the list of athletes managed by the connected coach.
 * Returns an empty array if the endpoint is not available or authorized.
 */
export async function fetchNolioAthletes(token: NolioToken): Promise<NolioAthleteEntry[]> {
  try {
    const data = await nolioGet<NolioAthleteEntry[] | { results?: NolioAthleteEntry[] }>(
      "/get/athletes/",
      token,
    );
    const list = Array.isArray(data) ? data : (data.results ?? []);
    console.log(`[Nolio] GET /get/athletes/ → ${list.length} athlètes:`, JSON.stringify(list, null, 2));
    return list;
  } catch (err) {
    console.warn("[Nolio] GET /get/athletes/ — impossible de récupérer les athlètes:", err);
    return [];
  }
}

// ── Nolio training shape ────────────────────────────────────────────────────

interface NolioTraining {
  nolio_id: number;            // ← API returns "nolio_id", not "id"
  name: string;
  date_start: string;          // "YYYY-MM-DD"
  date_end?: string;
  description?: string;
  sport?: string;              // e.g. "Triathlon", "Vélo - Route"
  sport_id?: number;
  duration?: number;
  distance?: number;
  is_competition?: boolean;
  athlete_id?: number;
  [key: string]: unknown;
}

/**
 * Fetch planned + past trainings for a given Nolio user.
 * Pass `nolioAthleteId` to fetch on behalf of a managed athlete (requires
 * special authorization from Nolio — contact contact@nolio.io).
 * If omitted, fetches for the authenticated user (the coach themselves).
 */
async function fetchAllTrainings(
  token: NolioToken,
  nolioAthleteId?: number,
): Promise<NolioTraining[]> {
  const athleteParam: Record<string, string> = nolioAthleteId
    ? { athlete_id: String(nolioAthleteId) }
    : {};
  const label = nolioAthleteId ? `athlete_id=${nolioAthleteId}` : "coach (self)";

  let planned: NolioTraining[] = [];
  let past: NolioTraining[] = [];

  // ── GET /get/planned/training/ ──────────────────────────────────────────
  try {
    const res = await nolioGet<NolioTraining[] | { results?: NolioTraining[] }>(
      "/get/planned/training/",
      token,
      { limit: "200", ...athleteParam },
    );
    planned = Array.isArray(res) ? res : (res.results ?? []);
    console.log(
      `[Nolio] GET /get/planned/training/ (${label}) → ${planned.length} entrées:`,
      JSON.stringify(planned, null, 2),
    );
  } catch (err) {
    console.warn(`[Nolio] GET /get/planned/training/ (${label}) — erreur:`, err);
  }

  // ── GET /get/training/ ──────────────────────────────────────────────────
  try {
    const res = await nolioGet<NolioTraining[] | { results?: NolioTraining[] }>(
      "/get/training/",
      token,
      { limit: "200", ...athleteParam },
    );
    past = Array.isArray(res) ? res : (res.results ?? []);
    console.log(
      `[Nolio] GET /get/training/ (${label}) → ${past.length} entrées:`,
      JSON.stringify(past, null, 2),
    );
  } catch (err) {
    console.warn(`[Nolio] GET /get/training/ (${label}) — erreur:`, err);
  }

  return [...planned, ...past];
}

function isCompetition(t: NolioTraining): boolean {
  if (t.is_competition === true) return true;
  const lower = (t.name ?? "").toLowerCase();
  return (
    lower.includes("compét") ||
    lower.includes("race") ||
    lower.includes("triathlon") ||
    lower.includes("marathon") ||
    lower.includes("ironman") ||
    lower.includes("course") ||
    lower.includes("championnat") ||
    lower.includes("challenge")
  );
}

// ── Map a competition to a CalendarEvent ────────────────────────────────────

function trainingToEvent(t: NolioTraining, crmAthleteId: string): Omit<CalendarEvent, "id"> {
  return {
    titre: t.name ?? "Compétition Nolio",
    type: "competition" as const,
    dateDebut: t.date_start,
    dateFin: (t.date_end && t.date_end !== "") ? t.date_end : undefined,
    description: [
      t.description && t.description.trim() !== "" ? t.description.trim() : null,
      t.sport ? `Sport : ${t.sport}` : null,
      t.distance ? `Distance : ${t.distance} km` : null,
      t.duration ? `Durée : ${Math.round(t.duration / 60)} min` : null,
    ].filter(Boolean).join(" · ") || undefined,
    source: "nolio" as const,
    refId: `nolio_${t.nolio_id}`,
    athleteId: crmAthleteId,
  };
}

// ── Result shape returned by the global bulk sync ───────────────────────────

export interface NolioAthleteResult {
  nolioId: number;
  email: string;
  crmAthleteId: string | null;  // null = no CRM match found
  competitions: Omit<CalendarEvent, "id">[];
}

/**
 * Global bulk sync.
 *
 * 1. Uses the coach token to fetch all 90 Nolio athletes (email + nolio_id)
 * 2. For each, fetches competitions via athlete_id
 * 3. Returns per-athlete results so the caller can match to CRM athletes by email
 * 4. crmAthleteId is filled in by the caller after email matching
 *
 * Kept separate from DB logic so the route can handle matching + writing.
 */
export async function fetchAllAthletesCompetitions(
  token: NolioToken,
  /** email → CRM athlete ID map, built by the caller from db.athletes */
  emailToCrmId: Map<string, string>,
  /** nolioId (number) → CRM athlete ID map — higher priority than email */
  nolioIdToCrmId: Map<number, string> = new Map(),
): Promise<{ results: NolioAthleteResult[]; updatedToken: NolioToken }> {
  const valid = await getValidToken(token);

  console.log("═══════════════════════════════════════════════════");
  console.log("[Nolio] Début sync globale de tous les athlètes");
  console.log("═══════════════════════════════════════════════════");

  // ── 1. Get all Nolio athletes ──────────────────────────────────────────────
  const nolioAthletes = await fetchNolioAthletes(valid);
  console.log(`[Nolio] ${nolioAthletes.length} athlètes Nolio récupérés`);

  // ── 2. Build full match map: nolio_id → { crmAthleteId, email } ────────────
  // Priority: nolioId (manual) > email
  const toProcess: Array<{ nolio_id: number; name: string; crmAthleteId: string }> = [];
  const skipped: number[] = [];

  for (const n of nolioAthletes) {
    const email = String(n.name).toLowerCase().trim();
    const byId  = nolioIdToCrmId.get(n.nolio_id);
    const byEmail = emailToCrmId.get(email);
    const crmAthleteId = byId ?? byEmail ?? null;

    if (crmAthleteId) {
      toProcess.push({ nolio_id: n.nolio_id, name: n.name as string, crmAthleteId });
      console.log(`[Nolio] ✅ Match: nolio_id=${n.nolio_id} | ${n.name} → CRM ${crmAthleteId} (via ${byId ? "nolioId" : "email"})`);
    } else {
      skipped.push(n.nolio_id);
    }
  }

  console.log(`[Nolio] ${toProcess.length} athlètes à synchroniser, ${skipped.length} ignorés (pas de match CRM)`);

  const results: NolioAthleteResult[] = [];

  // ── 3. Fetch competitions only for matched athletes (+ 200ms delay) ────────
  for (let i = 0; i < toProcess.length; i++) {
    const { nolio_id, name, crmAthleteId } = toProcess[i];

    // Small delay to avoid rate-limiting (skip on first call)
    if (i > 0) await new Promise((r) => setTimeout(r, 200));

    let planned: NolioTraining[] = [];
    try {
      const res = await nolioGet<NolioTraining[] | { results?: NolioTraining[] }>(
        "/get/planned/training/",
        valid,
        { athlete_id: String(nolio_id), limit: "200" },
      );
      planned = Array.isArray(res) ? res : (res.results ?? []);
    } catch (err) {
      // Log the real error so we can diagnose issues
      console.error(`[Nolio] ❌ Erreur /get/planned/training/?athlete_id=${nolio_id} (${name}):`, err);
    }

    const competitions = planned.filter(isCompetition);
    console.log(
      `[Nolio] [${i + 1}/${toProcess.length}] ${name} (${nolio_id}): ` +
      `${planned.length} séances, ${competitions.length} compétitions`,
    );

    const events = competitions.map((t) => trainingToEvent(t, crmAthleteId));
    const email = name.toLowerCase().trim();

    results.push({ nolioId: nolio_id, email, crmAthleteId, competitions: events });
  }

  const totalComps = results.reduce((s, r) => s + r.competitions.length, 0);
  console.log(`[Nolio] Sync terminée — ${results.length} athlètes traités, ${totalComps} compétitions au total`);
  console.log("═══════════════════════════════════════════════════");

  return { results, updatedToken: valid };
}

/**
 * Legacy single-athlete sync — kept for the per-athlete sync route.
 * Uses the global function internally.
 */
export async function fetchNolioCompetitions(
  token: NolioToken,
  crmAthleteId: string,
): Promise<{ events: Omit<CalendarEvent, "id">[]; updatedToken: NolioToken }> {
  const valid = await getValidToken(token);

  let planned: NolioTraining[] = [];
  try {
    const res = await nolioGet<NolioTraining[] | { results?: NolioTraining[] }>(
      "/get/planned/training/",
      valid,
      { limit: "200" },
    );
    planned = Array.isArray(res) ? res : (res.results ?? []);
  } catch { /* ignore */ }

  const competitions = planned.filter(isCompetition);
  const events = competitions.map((t) => trainingToEvent(t, crmAthleteId));

  return { events, updatedToken: valid };
}
