import { NextResponse } from "next/server";
import { readDB } from "@/lib/db";
import { getValidToken, nolioGet } from "@/lib/nolio";
import { NolioToken } from "@/lib/types";

interface NolioAthleteRaw {
  nolio_id: number;
  name: string;
  [key: string]: unknown;
}

interface NolioTrainingRaw {
  nolio_id: number;
  name: string;
  date_start: string;
  is_competition?: boolean;
  sport?: string;
  [key: string]: unknown;
}

/**
 * GET /api/nolio/diagnostic
 *
 * Diagnostic complet :
 * 1. Vérifie db.nolioCoachToken
 * 2. Appelle GET /get/athletes/ et liste les 90 athlètes
 * 3. Compare les emails Nolio avec les emails CRM
 * 4. Pour chaque athlète CRM avec nolioId, appelle /get/planned/training/?athlete_id=
 * 5. Résumé du mapping
 */
export async function GET() {
  const log: string[] = [];
  const separator = "─".repeat(60);

  function out(msg: string) {
    console.log(msg);
    log.push(msg);
  }

  try {
    const db = await readDB();

    // ── ÉTAPE 1 : Vérification du token ──────────────────────────────────────
    out(`\n${"═".repeat(60)}`);
    out("ÉTAPE 1 — db.nolioCoachToken");
    out("═".repeat(60));

    if (!db.nolioCoachToken) {
      out("❌ ERREUR : db.nolioCoachToken est ABSENT !");
      return NextResponse.json({ log, error: "Pas de token coach" });
    }

    const rawToken = db.nolioCoachToken;
    out(`✅ Token présent`);
    out(`   accessToken  : ${rawToken.accessToken.slice(0, 12)}...`);
    out(`   refreshToken : ${rawToken.refreshToken.slice(0, 12)}...`);
    out(`   expiresAt    : ${new Date(rawToken.expiresAt).toISOString()} (${rawToken.expiresAt > Date.now() ? "VALIDE" : "EXPIRÉ!"})`);
    out(`   nolioUserId  : ${rawToken.nolioUserId ?? "non défini"}`);

    const token: NolioToken = await getValidToken(rawToken);
    if (token.accessToken !== rawToken.accessToken) {
      out(`🔄 Token rafraîchi automatiquement`);
    }

    // ── ÉTAPE 2 : GET /get/athletes/ ─────────────────────────────────────────
    out(`\n${"═".repeat(60)}`);
    out("ÉTAPE 2 — GET /get/athletes/ (liste des 90 athlètes Nolio)");
    out("═".repeat(60));

    let nolioAthletes: NolioAthleteRaw[] = [];
    try {
      const res = await nolioGet<NolioAthleteRaw[] | { results?: NolioAthleteRaw[] }>(
        "/get/athletes/",
        token,
      );
      nolioAthletes = Array.isArray(res) ? res : (res.results ?? []);
      out(`✅ ${nolioAthletes.length} athlètes retournés par Nolio`);
      out(separator);
      out("  IDNolio  │ Email (name)");
      out(separator);
      for (const a of nolioAthletes) {
        out(`  ${String(a.nolio_id).padEnd(8)} │ ${a.name}`);
      }
    } catch (err) {
      out(`❌ ERREUR GET /get/athletes/ : ${err}`);
      return NextResponse.json({ log, error: String(err) });
    }

    // ── ÉTAPE 3 : Comparaison emails Nolio ↔ emails CRM ─────────────────────
    out(`\n${"═".repeat(60)}`);
    out("ÉTAPE 3 — Comparaison emails Nolio ↔ emails CRM");
    out("═".repeat(60));

    const crmEmails = new Map<string, { id: string; nom: string; nolioId?: number }>();
    for (const a of db.athletes) {
      if (a.email) {
        crmEmails.set(a.email.toLowerCase().trim(), {
          id: a.id,
          nom: `${a.prenom} ${a.nom}`,
          nolioId: a.nolioId,
        });
      }
    }

    out(`CRM : ${db.athletes.length} athlètes dont ${crmEmails.size} avec email`);
    out(`Nolio : ${nolioAthletes.length} athlètes`);
    out(separator);

    let matchByEmail = 0;
    let matchByNolioId = 0;
    let noMatch = 0;
    const matched: { nolioId: number; email: string; crmId: string; crmNom: string; via: string }[] = [];
    const unmatched: { nolioId: number; email: string }[] = [];

    // Build nolioId → CRM map
    const nolioIdToCrm = new Map<number, { id: string; nom: string }>();
    for (const a of db.athletes) {
      if (a.nolioId) nolioIdToCrm.set(a.nolioId, { id: a.id, nom: `${a.prenom} ${a.nom}` });
    }

    for (const n of nolioAthletes) {
      const email = String(n.name).toLowerCase().trim();
      const byId = nolioIdToCrm.get(n.nolio_id);
      const byEmail = crmEmails.get(email);

      if (byId) {
        matched.push({ nolioId: n.nolio_id, email, crmId: byId.id, crmNom: byId.nom, via: "nolioId" });
        matchByNolioId++;
      } else if (byEmail) {
        matched.push({ nolioId: n.nolio_id, email, crmId: byEmail.id, crmNom: byEmail.nom, via: "email" });
        matchByEmail++;
      } else {
        unmatched.push({ nolioId: n.nolio_id, email });
        noMatch++;
      }
    }

    out(`\n✅ Matchés : ${matched.length} (${matchByNolioId} par nolioId, ${matchByEmail} par email)`);
    out(`❌ Non matchés : ${noMatch}`);
    out(`\n── Athlètes matchés ──`);
    for (const m of matched) {
      out(`  nolio_id=${m.nolioId} | ${m.email} → ${m.crmNom} (${m.crmId}) [via ${m.via}]`);
    }
    out(`\n── Non matchés (premiers 20) ──`);
    for (const u of unmatched.slice(0, 20)) {
      out(`  nolio_id=${u.nolioId} | ${u.email}`);
    }

    // ── ÉTAPE 4 : Athlètes CRM avec nolioId ─────────────────────────────────
    out(`\n${"═".repeat(60)}`);
    out("ÉTAPE 4 — Athlètes CRM avec nolioId → GET /get/planned/training/");
    out("═".repeat(60));

    const crmWithNolioId = db.athletes.filter((a) => a.nolioId);
    out(`${crmWithNolioId.length} athlètes CRM avec nolioId renseigné`);

    for (const a of crmWithNolioId) {
      out(`\n${separator}`);
      out(`  ${a.prenom} ${a.nom} (CRM: ${a.id}) → nolioId: ${a.nolioId}`);
      try {
        const res = await nolioGet<NolioTrainingRaw[] | { results?: NolioTrainingRaw[] }>(
          "/get/planned/training/",
          token,
          { athlete_id: String(a.nolioId!), limit: "200" },
        );
        const trainings = Array.isArray(res) ? res : (res.results ?? []);
        const competitions = trainings.filter(
          (t) =>
            t.is_competition === true ||
            ["compét", "race", "triathlon", "marathon", "ironman", "course", "championnat", "challenge"].some(
              (kw) => t.name?.toLowerCase().includes(kw),
            ),
        );
        out(`  ✅ ${trainings.length} entraînements dont ${competitions.length} compétitions`);
        if (competitions.length > 0) {
          out("  Compétitions :");
          for (const c of competitions) {
            out(`    nolio_id=${c.nolio_id} | ${c.date_start} | ${c.name} | is_competition=${c.is_competition} | sport=${c.sport}`);
          }
        } else if (trainings.length > 0) {
          out("  (aucune compétition — voici les 5 premiers entraînements) :");
          for (const t of trainings.slice(0, 5)) {
            out(`    nolio_id=${t.nolio_id} | ${t.date_start} | ${t.name} | is_competition=${t.is_competition}`);
          }
        }
      } catch (err) {
        out(`  ❌ ERREUR : ${err}`);
      }
    }

    // ── ÉTAPE 5 : État actuel de db.events ──────────────────────────────────
    out(`\n${"═".repeat(60)}`);
    out("ÉTAPE 5 — État actuel de db.events");
    out("═".repeat(60));

    const nolioEvents = (db.events ?? []).filter((e) => e.source === "nolio");
    const byAthlete: Record<string, number> = {};
    for (const e of nolioEvents) {
      const key = e.athleteId ?? "inconnu";
      byAthlete[key] = (byAthlete[key] ?? 0) + 1;
    }
    out(`Total événements Nolio dans db.events : ${nolioEvents.length}`);
    const athById = Object.fromEntries(db.athletes.map((a) => [a.id, `${a.prenom} ${a.nom}`]));
    for (const [aid, count] of Object.entries(byAthlete)) {
      out(`  ${athById[aid] ?? aid} (${aid}) : ${count} événements`);
    }

    // ── RÉSUMÉ ───────────────────────────────────────────────────────────────
    out(`\n${"═".repeat(60)}`);
    out("RÉSUMÉ DIAGNOSTIC");
    out("═".repeat(60));
    out(`Token coach     : ✅ présent (nolioUserId=${rawToken.nolioUserId})`);
    out(`Athlètes Nolio  : ${nolioAthletes.length}`);
    out(`Matchés CRM     : ${matched.length}/${nolioAthletes.length}`);
    out(`Events db.events: ${nolioEvents.length} Nolio events`);

    return NextResponse.json({
      success: true,
      summary: {
        tokenPresent: true,
        tokenValid: rawToken.expiresAt > Date.now(),
        nolioUserId: rawToken.nolioUserId,
        nolioAthletes: nolioAthletes.length,
        matched: matched.length,
        matchByEmail,
        matchByNolioId,
        unmatched: noMatch,
        nolioEventsInDb: nolioEvents.length,
        eventsPerAthlete: byAthlete,
      },
      matchedAthletes: matched,
      unmatchedAthletes: unmatched,
      log,
    });
  } catch (err) {
    out(`\n❌ ERREUR FATALE : ${err}`);
    console.error("[Nolio Diagnostic]", err);
    return NextResponse.json({ error: String(err), log }, { status: 500 });
  }
}
