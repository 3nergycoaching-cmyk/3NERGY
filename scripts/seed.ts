/**
 * scripts/seed.ts
 *
 * Imports all data from data/db.json into Neon PostgreSQL via Prisma.
 * Safe to run multiple times — clears existing data first.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * Make sure DATABASE_URL is set in .env (or .env.local via dotenv/config).
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import fs from "fs";
import path from "path";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
const prisma  = new PrismaClient({ adapter });
const DB_PATH = path.join(process.cwd(), "data", "db.json");

async function main() {
  console.log("📂 Reading", DB_PATH);
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: Record<string, any> = JSON.parse(raw);

  // ── Truncate all tables via raw SQL (CASCADE handles FK order) ───────────────
  console.log("🗑  Truncating existing data …");
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE "OnboardingInvitation", "CalendarEvent", "Tache", "Todo",
    "AcademySession", "Athlete", "Licencie", "YoungAthlete", "Lead", "Projet",
    "Coach", "app_config" RESTART IDENTITY CASCADE
  `);

  // ── Coaches ──────────────────────────────────────────────────────────────────
  const coaches: unknown[] = db.coaches ?? [];
  for (const c of coaches as Record<string, unknown>[]) {
    await prisma.coach.create({
      data: {
        id: String(c.id), nom: String(c.nom), prenom: String(c.prenom),
        email: String(c.email ?? ""), telephone: String(c.telephone ?? ""),
        couleur: String(c.couleur ?? "#7c1d35"), role: String(c.role ?? ""),
      },
    });
  }
  console.log(`✅ Coaches: ${coaches.length}`);

  // ── Athletes ─────────────────────────────────────────────────────────────────
  const athletes: unknown[] = db.athletes ?? [];
  let athleteCount = 0;
  for (const a of athletes as Record<string, unknown>[]) {
    await prisma.athlete.create({
      data: {
        id:             String(a.id),
        nom:            String(a.nom),
        prenom:         String(a.prenom),
        email:          a.email ? String(a.email) : null,
        telephone:      String(a.telephone ?? ""),
        adresse:        String(a.adresse ?? ""),
        discipline:     (String(a.discipline ?? "triathlon")) as never,
        coachId:        String(a.coachId),
        statut:         (String(a.statut ?? "actif")) as never,
        objectif:       String(a.objectif ?? ""),
        planJusquAu:    String(a.planJusquAu ?? ""),
        offreSouscrite: String(a.offreSouscrite ?? ""),
        lienNolio:      String(a.lienNolio ?? ""),
        notes:          String(a.notes ?? ""),
        createdAt:      a.createdAt ? new Date(String(a.createdAt)) : new Date(),
        service:        (String(a.service ?? "performance")) as never,
        prixMensuel:    Number(a.prixMensuel ?? 0),
        nolioId:        a.nolioId != null ? Number(a.nolioId) : null,
        objectifs:      (a.objectifs as never) ?? null,
        performances:   (a.performances as never) ?? null,
      },
    });
    athleteCount++;
  }
  console.log(`✅ Athletes: ${athleteCount}`);

  // ── Leads ────────────────────────────────────────────────────────────────────
  const leads: unknown[] = db.leads ?? [];
  let leadCount = 0;
  for (const l of leads as Record<string, unknown>[]) {
    await prisma.lead.create({
      data: {
        id:               String(l.id),
        nom:              String(l.nom),
        prenom:           String(l.prenom),
        email:            l.email ? String(l.email) : null,
        telephone:        String(l.telephone ?? ""),
        source:           (String(l.source ?? "instagram")) as never,
        discipline:       (String(l.discipline ?? "triathlon")) as never,
        statut:           (String(l.statut ?? "a_contacter")) as never,
        notes:            String(l.notes ?? ""),
        createdAt:        l.createdAt ? new Date(String(l.createdAt)) : new Date(),
        coachId:          l.coachId ? String(l.coachId) : null,
        dateDebutCoaching: l.dateDebutCoaching ? String(l.dateDebutCoaching) : null,
        converti:         Boolean(l.converti ?? false),
      },
    });
    leadCount++;
  }
  console.log(`✅ Leads: ${leadCount}`);

  // ── Projets ──────────────────────────────────────────────────────────────────
  const projets: unknown[] = db.projets ?? [];
  for (const p of projets as Record<string, unknown>[]) {
    await prisma.projet.create({
      data: {
        id: String(p.id), nom: String(p.nom), responsable: String(p.responsable ?? ""),
        deadline: String(p.deadline ?? ""), progression: Number(p.progression ?? 0),
        statut: String(p.statut ?? "en_cours"), description: String(p.description ?? ""),
      },
    });
  }
  console.log(`✅ Projets: ${projets.length}`);

  // ── Tâches ───────────────────────────────────────────────────────────────────
  const taches: unknown[] = db.taches ?? [];
  let tacheCount = 0;
  for (const t of taches as Record<string, unknown>[]) {
    await prisma.tache.create({
      data: {
        id:          String(t.id),
        titre:       String(t.titre),
        projetId:    t.projetId ? String(t.projetId) : null,
        athleteId:   t.athleteId ? String(t.athleteId) : null,
        responsable: String(t.responsable ?? ""),
        deadline:    String(t.deadline ?? ""),
        statut:      (String(t.statut ?? "a_faire")) as never,
        priorite:    (String(t.priorite ?? "moyenne")) as never,
      },
    });
    tacheCount++;
  }
  console.log(`✅ Tâches: ${tacheCount}`);

  // ── Todos ────────────────────────────────────────────────────────────────────
  const todos: unknown[] = db.todos ?? [];
  let todoCount = 0;
  for (const td of todos as Record<string, unknown>[]) {
    await prisma.todo.create({
      data: {
        id:          String(td.id),
        titre:       String(td.titre),
        responsable: String(td.responsable ?? ""),
        priorite:    (String(td.priorite ?? "moyenne")) as never,
        deadline:    String(td.deadline ?? ""),
        statut:      (String(td.statut ?? "a_faire")) as never,
        projetId:    td.projetId ? String(td.projetId) : null,
        notes:       td.notes ? String(td.notes) : null,
        createdAt:   td.createdAt ? new Date(String(td.createdAt)) : new Date(),
      },
    });
    todoCount++;
  }
  console.log(`✅ Todos: ${todoCount}`);

  // ── Young Athletes ───────────────────────────────────────────────────────────
  const youngAthletes: unknown[] = db.youngAthletes ?? [];
  let yaCount = 0;
  for (const ya of youngAthletes as Record<string, unknown>[]) {
    await prisma.youngAthlete.create({
      data: {
        id:              String(ya.id),
        prenom:          String(ya.prenom),
        nom:             String(ya.nom),
        dateNaissance:   String(ya.dateNaissance),
        discipline:      (String(ya.discipline ?? "triathlon")) as never,
        contactParent:   String(ya.contactParent ?? ""),
        telephoneParent: String(ya.telephoneParent ?? ""),
        emailParent:     ya.emailParent ? String(ya.emailParent) : null,
        urgence:         String(ya.urgence ?? ""),
        statut:          String(ya.statut ?? "actif"),
        createdAt:       ya.createdAt ? new Date(String(ya.createdAt)) : new Date(),
      },
    });
    yaCount++;
  }
  console.log(`✅ Young athletes: ${yaCount}`);

  // ── Academy Sessions ─────────────────────────────────────────────────────────
  const academySessions: unknown[] = db.academySessions ?? [];
  let sessCount = 0;
  for (const s of academySessions as Record<string, unknown>[]) {
    await prisma.academySession.create({
      data: {
        id:           String(s.id),
        date:         String(s.date),
        entraineurId: String(s.entraineurId),
        discipline:   (String(s.discipline ?? "triathlon")) as never,
        lieu:         String(s.lieu ?? ""),
        presents:     (s.presents as never) ?? [],
        notes:        s.notes ? String(s.notes) : null,
      },
    });
    sessCount++;
  }
  console.log(`✅ Academy sessions: ${sessCount}`);

  // ── Calendar Events ──────────────────────────────────────────────────────────
  const events: unknown[] = db.events ?? [];
  let evCount = 0;
  for (const e of events as Record<string, unknown>[]) {
    await prisma.calendarEvent.create({
      data: {
        id:           String(e.id),
        titre:        String(e.titre),
        type:         (String(e.type ?? "competition")) as never,
        dateDebut:    String(e.dateDebut),
        dateFin:      e.dateFin ? String(e.dateFin) : null,
        responsable:  e.responsable ? String(e.responsable) : null,
        description:  e.description ? String(e.description) : null,
        source:       (String(e.source ?? "manual")) as never,
        refId:        e.refId ? String(e.refId) : null,
        athleteId:    e.athleteId ? String(e.athleteId) : null,
        participants: (e.participants as never) ?? null,
      },
    });
    evCount++;
  }
  console.log(`✅ Calendar events: ${evCount}`);

  // ── Licenciés ────────────────────────────────────────────────────────────────
  const licencies: unknown[] = db.licencies ?? [];
  let licCount = 0;
  for (const l of licencies as Record<string, unknown>[]) {
    await prisma.licencie.create({
      data: {
        id:            String(l.id),
        prenom:        String(l.prenom),
        nom:           String(l.nom),
        email:         l.email ? String(l.email) : null,
        telephone:     String(l.telephone ?? ""),
        adresse:       String(l.adresse ?? ""),
        dateLicence:   String(l.dateLicence),
        numeroLicence: String(l.numeroLicence ?? ""),
        discipline:    (String(l.discipline ?? "triathlon")) as never,
        statut:        String(l.statut ?? "actif"),
        createdAt:     l.createdAt ? new Date(String(l.createdAt)) : new Date(),
      },
    });
    licCount++;
  }
  console.log(`✅ Licenciés: ${licCount}`);

  // ── Invitations ──────────────────────────────────────────────────────────────
  // Build set of seeded athlete IDs to skip orphaned invitations
  const seededAthleteIds = new Set((db.athletes ?? []).map((a: Record<string, unknown>) => String(a.id)));
  const invitations: unknown[] = db.invitations ?? [];
  let invCount = 0;
  for (const inv of invitations as Record<string, unknown>[]) {
    // Skip invitations that reference a non-existent athlete
    if (!seededAthleteIds.has(String(inv.athleteId))) {
      console.log(`  ⚠️  Skipping invitation ${inv.token} — athleteId ${inv.athleteId} not found`);
      continue;
    }
    await prisma.onboardingInvitation.create({
      data: {
        token:       String(inv.token),
        athleteId:   String(inv.athleteId),
        prenom:      String(inv.prenom),
        nom:         String(inv.nom),
        email:       String(inv.email),
        coachId:     String(inv.coachId),
        createdAt:   inv.createdAt ? new Date(String(inv.createdAt)) : new Date(),
        expiresAt:   new Date(String(inv.expiresAt)),
        completedAt: inv.completedAt ? new Date(String(inv.completedAt)) : null,
        statut:      (String(inv.statut ?? "pending")) as never,
      },
    });
    invCount++;
  }
  console.log(`✅ Invitations: ${invCount}`);

  // ── Nolio coach token ────────────────────────────────────────────────────────
  if (db.nolioCoachToken) {
    await prisma.appConfig.create({
      data: { key: "nolioCoachToken", value: db.nolioCoachToken },
    });
    console.log("✅ Nolio coach token stored");
  }

  console.log("\n🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
