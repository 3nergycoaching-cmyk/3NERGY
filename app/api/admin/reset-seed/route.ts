import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

const SEED_PATH = path.join(process.cwd(), "data", "db.seed.json");

/**
 * POST /api/admin/reset-seed
 *
 * Truncates all tables and re-seeds from data/db.seed.json.
 * This is the ONLY endpoint allowed to do so, and only when
 * explicitly triggered by an admin action.
 *
 * db.seed.json is read-only and never mutated here.
 */
export async function POST() {
  try {
    const raw  = await fs.readFile(SEED_PATH, "utf-8");
    const seed = JSON.parse(raw);

    // ── Truncate all tables in one raw statement (CASCADE handles FK order) ────
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE "OnboardingInvitation", "CalendarEvent", "Tache", "Todo",
      "AcademySession", "Athlete", "Licencie", "YoungAthlete", "Lead", "Projet",
      "Coach", "app_config" RESTART IDENTITY CASCADE
    `);

    // ── Re-seed (FK-safe insertion order) ─────────────────────────────────────
    if (seed.coaches?.length) {
      await prisma.coach.createMany({ data: seed.coaches });
    }

    if (seed.athletes?.length) {
      for (const a of seed.athletes) {
        await prisma.athlete.create({
          data: {
            id: a.id, nom: a.nom, prenom: a.prenom,
            email: a.email || null, telephone: a.telephone ?? "",
            adresse: a.adresse ?? "", discipline: (a.discipline ?? "triathlon") as never,
            coachId: a.coachId, statut: (a.statut ?? "actif") as never,
            objectif: a.objectif ?? "", planJusquAu: a.planJusquAu ?? "",
            offreSouscrite: a.offreSouscrite ?? "", lienNolio: a.lienNolio ?? "",
            notes: a.notes ?? "", createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
            service: (a.service ?? "performance") as never, prixMensuel: a.prixMensuel ?? 0,
            nolioId: a.nolioId ?? null, objectifs: a.objectifs ?? null,
            performances: a.performances ?? null,
          },
        });
      }
    }

    if (seed.leads?.length) {
      for (const l of seed.leads) {
        await prisma.lead.create({
          data: {
            id: l.id, nom: l.nom, prenom: l.prenom, email: l.email || null,
            telephone: l.telephone ?? "", source: (l.source ?? "instagram") as never,
            discipline: (l.discipline ?? "triathlon") as never,
            statut: (l.statut ?? "a_contacter") as never, notes: l.notes ?? "",
            createdAt: l.createdAt ? new Date(l.createdAt) : new Date(),
            coachId: l.coachId ?? null, dateDebutCoaching: l.dateDebutCoaching ?? null,
            converti: l.converti ?? false,
          },
        });
      }
    }

    if (seed.projets?.length) {
      await prisma.projet.createMany({ data: seed.projets });
    }

    if (seed.taches?.length) {
      for (const t of seed.taches) {
        await prisma.tache.create({
          data: {
            id: t.id, titre: t.titre, projetId: t.projetId || null,
            athleteId: t.athleteId ?? null, responsable: t.responsable,
            deadline: t.deadline, statut: (t.statut ?? "a_faire") as never,
            priorite: (t.priorite ?? "moyenne") as never,
          },
        });
      }
    }

    if (seed.youngAthletes?.length) {
      for (const y of seed.youngAthletes) {
        await prisma.youngAthlete.create({
          data: {
            id: y.id, prenom: y.prenom, nom: y.nom, dateNaissance: y.dateNaissance,
            discipline: (y.discipline ?? "triathlon") as never,
            contactParent: y.contactParent ?? "", telephoneParent: y.telephoneParent ?? "",
            emailParent: y.emailParent ?? null, urgence: y.urgence ?? "",
            statut: y.statut ?? "actif", createdAt: y.createdAt ? new Date(y.createdAt) : new Date(),
          },
        });
      }
    }

    if (seed.academySessions?.length) {
      for (const s of seed.academySessions) {
        await prisma.academySession.create({
          data: {
            id: s.id, date: s.date, entraineurId: s.entraineurId,
            discipline: (s.discipline ?? "triathlon") as never,
            lieu: s.lieu ?? "", presents: s.presents ?? [], notes: s.notes ?? null,
          },
        });
      }
    }

    if (seed.events?.length) {
      for (const e of seed.events) {
        await prisma.calendarEvent.create({
          data: {
            id: e.id, titre: e.titre, type: (e.type ?? "competition") as never,
            dateDebut: e.dateDebut, dateFin: e.dateFin ?? null,
            responsable: e.responsable ?? null, description: e.description ?? null,
            source: (e.source ?? "manual") as never, refId: e.refId ?? null,
            athleteId: e.athleteId ?? null, participants: e.participants ?? null,
          },
        });
      }
    }

    if (seed.licencies?.length) {
      for (const l of seed.licencies) {
        await prisma.licencie.create({
          data: {
            id: l.id, prenom: l.prenom, nom: l.nom, email: l.email || null,
            telephone: l.telephone ?? "", adresse: l.adresse ?? "",
            dateLicence: l.dateLicence, numeroLicence: l.numeroLicence ?? "",
            discipline: (l.discipline ?? "triathlon") as never,
            statut: l.statut ?? "actif", createdAt: l.createdAt ? new Date(l.createdAt) : new Date(),
          },
        });
      }
    }

    if (seed.invitations?.length) {
      for (const inv of seed.invitations) {
        await prisma.onboardingInvitation.create({
          data: {
            token: inv.token, athleteId: inv.athleteId, prenom: inv.prenom,
            nom: inv.nom, email: inv.email, coachId: inv.coachId,
            createdAt: inv.createdAt ? new Date(inv.createdAt) : new Date(),
            expiresAt: new Date(inv.expiresAt),
            completedAt: inv.completedAt ? new Date(inv.completedAt) : null,
            statut: (inv.statut ?? "pending") as never,
          },
        });
      }
    }

    if (seed.nolioCoachToken) {
      await prisma.appConfig.create({
        data: { key: "nolioCoachToken", value: seed.nolioCoachToken },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[reset-seed] Error:", err);
    return NextResponse.json({ error: "Échec de la réinitialisation" }, { status: 500 });
  }
}
