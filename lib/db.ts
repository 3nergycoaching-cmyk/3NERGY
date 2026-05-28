/**
 * lib/db.ts — Database access layer (Prisma / Neon PostgreSQL)
 *
 * Public API is identical to the previous JSON implementation so all
 * callers work without changes.  readDB() and writeDB() still exist for
 * backward-compat; writeDB() only persists the Nolio coach token.
 */

import { prisma } from "./prisma";
import {
  Database,
  Athlete,
  Lead,
  Projet,
  Tache,
  Coach,
  Todo,
  Licencie,
  YoungAthlete,
  AcademySession,
  CalendarEvent,
  OnboardingInvitation,
  NolioToken,
  Objectif,
  Performances,
} from "./types";

// ── Mapper helpers ────────────────────────────────────────────────────────────
// Convert Prisma rows (which use enums + DateTime) to TypeScript interfaces.

function mapCoach(p: {
  id: string; nom: string; prenom: string; email: string;
  telephone: string; couleur: string; role: string;
}): Coach {
  return {
    id: p.id,
    nom: p.nom,
    prenom: p.prenom,
    email: p.email,
    telephone: p.telephone,
    couleur: p.couleur,
    role: p.role,
  };
}

function mapAthlete(p: {
  id: string; nom: string; prenom: string; email: string | null;
  telephone: string; adresse: string; discipline: string; coachId: string;
  statut: string; objectif: string; planJusquAu: string; offreSouscrite: string;
  lienNolio: string; notes: string; createdAt: Date; service: string;
  prixMensuel: number; nolioId: number | null;
  objectifs: unknown; performances: unknown;
}): Athlete {
  return {
    id: p.id,
    nom: p.nom,
    prenom: p.prenom,
    email: p.email ?? "",
    telephone: p.telephone,
    adresse: p.adresse || undefined,
    discipline: p.discipline as Athlete["discipline"],
    coachId: p.coachId,
    statut: p.statut as Athlete["statut"],
    objectif: p.objectif,
    planJusquAu: p.planJusquAu || undefined,
    offreSouscrite: p.offreSouscrite || undefined,
    lienNolio: p.lienNolio || undefined,
    service: p.service as Athlete["service"],
    prixMensuel: p.prixMensuel,
    notes: p.notes,
    createdAt: p.createdAt.toISOString(),
    nolioId: p.nolioId ?? undefined,
    objectifs: (p.objectifs as Objectif[] | null) ?? undefined,
    performances: (p.performances as Performances | null) ?? undefined,
  };
}

function mapLead(p: {
  id: string; nom: string; prenom: string; email: string | null;
  telephone: string; source: string; discipline: string; statut: string;
  notes: string; createdAt: Date; coachId: string | null;
  dateDebutCoaching: string | null; converti: boolean;
}): Lead {
  return {
    id: p.id,
    nom: p.nom,
    prenom: p.prenom,
    email: p.email ?? "",
    telephone: p.telephone,
    source: p.source as Lead["source"],
    discipline: p.discipline as Lead["discipline"],
    statut: p.statut as Lead["statut"],
    notes: p.notes,
    createdAt: p.createdAt.toISOString(),
    coachId: p.coachId ?? undefined,
    dateDebutCoaching: p.dateDebutCoaching ?? undefined,
    converti: p.converti,
  };
}

function mapProjet(p: {
  id: string; nom: string; responsable: string; deadline: string;
  progression: number; statut: string; description: string;
}): Projet {
  return {
    id: p.id,
    nom: p.nom,
    responsable: p.responsable,
    deadline: p.deadline,
    progression: p.progression,
    statut: p.statut as Projet["statut"],
    description: p.description,
  };
}

function mapTache(p: {
  id: string; titre: string; projetId: string | null; athleteId: string | null;
  responsable: string; deadline: string; statut: string; priorite: string;
}): Tache {
  return {
    id: p.id,
    titre: p.titre,
    projetId: p.projetId ?? "",
    athleteId: p.athleteId ?? undefined,
    responsable: p.responsable,
    deadline: p.deadline,
    statut: p.statut as Tache["statut"],
    priorite: p.priorite as Tache["priorite"],
  };
}

function mapTodo(p: {
  id: string; titre: string; responsable: string; priorite: string;
  deadline: string; statut: string; projetId: string | null;
  notes: string | null; createdAt: Date;
}): Todo {
  return {
    id: p.id,
    titre: p.titre,
    responsable: p.responsable,
    priorite: p.priorite as Todo["priorite"],
    deadline: p.deadline || undefined,
    statut: p.statut as Todo["statut"],
    projetId: p.projetId ?? undefined,
    notes: p.notes ?? undefined,
    createdAt: p.createdAt.toISOString(),
  };
}

function mapLicencie(p: {
  id: string; prenom: string; nom: string; email: string | null;
  telephone: string; adresse: string; dateLicence: string;
  numeroLicence: string; discipline: string; statut: string; createdAt: Date;
}): Licencie {
  return {
    id: p.id,
    prenom: p.prenom,
    nom: p.nom,
    email: p.email ?? "",
    telephone: p.telephone,
    adresse: p.adresse || undefined,
    dateLicence: p.dateLicence,
    numeroLicence: p.numeroLicence || undefined,
    discipline: p.discipline as Licencie["discipline"],
    statut: p.statut as Licencie["statut"],
    createdAt: p.createdAt.toISOString(),
  };
}

function mapYoungAthlete(p: {
  id: string; prenom: string; nom: string; dateNaissance: string;
  discipline: string; contactParent: string; telephoneParent: string;
  emailParent: string | null; urgence: string; statut: string; createdAt: Date;
}): YoungAthlete {
  return {
    id: p.id,
    prenom: p.prenom,
    nom: p.nom,
    dateNaissance: p.dateNaissance,
    discipline: p.discipline as YoungAthlete["discipline"],
    contactParent: p.contactParent,
    telephoneParent: p.telephoneParent,
    emailParent: p.emailParent ?? undefined,
    urgence: p.urgence || undefined,
    statut: p.statut as YoungAthlete["statut"],
    createdAt: p.createdAt.toISOString(),
  };
}

function mapAcademySession(p: {
  id: string; date: string; entraineurId: string; discipline: string;
  lieu: string; notes: string | null; presents: unknown;
}): AcademySession {
  return {
    id: p.id,
    date: p.date,
    entraineurId: p.entraineurId,
    discipline: p.discipline as AcademySession["discipline"],
    lieu: p.lieu,
    presents: (p.presents as string[]) ?? [],
    notes: p.notes ?? undefined,
  };
}

function mapCalendarEvent(p: {
  id: string; titre: string; type: string; dateDebut: string;
  dateFin: string | null; responsable: string | null; description: string | null;
  source: string; refId: string | null; athleteId: string | null;
  participants: unknown;
}): CalendarEvent {
  return {
    id: p.id,
    titre: p.titre,
    type: p.type as CalendarEvent["type"],
    dateDebut: p.dateDebut,
    dateFin: p.dateFin ?? undefined,
    responsable: p.responsable ?? undefined,
    description: p.description ?? undefined,
    source: p.source as CalendarEvent["source"],
    refId: p.refId ?? undefined,
    athleteId: p.athleteId ?? undefined,
    participants: (p.participants as string[] | null) ?? undefined,
  };
}

function mapInvitation(p: {
  token: string; athleteId: string; prenom: string; nom: string;
  email: string; coachId: string; createdAt: Date; expiresAt: Date;
  completedAt: Date | null; statut: string;
}): OnboardingInvitation {
  return {
    token: p.token,
    athleteId: p.athleteId,
    prenom: p.prenom,
    nom: p.nom,
    email: p.email,
    coachId: p.coachId,
    createdAt: p.createdAt.toISOString(),
    expiresAt: p.expiresAt.toISOString(),
    completedAt: p.completedAt?.toISOString(),
    statut: p.statut as OnboardingInvitation["statut"],
  };
}

// ── readDB / writeDB (backward-compat) ────────────────────────────────────────

/**
 * Returns a snapshot of the entire database as a plain JS object.
 * Used by server page components that need to read multiple collections.
 */
export async function readDB(): Promise<Database> {
  const [
    coaches, athletes, leads, projets, taches, todos, licencies,
    youngAthletes, academySessions, events, invitations, tokenConfig,
  ] = await Promise.all([
    prisma.coach.findMany(),
    prisma.athlete.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.lead.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.projet.findMany(),
    prisma.tache.findMany(),
    prisma.todo.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.licencie.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.youngAthlete.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.academySession.findMany({ orderBy: { date: "desc" } }),
    prisma.calendarEvent.findMany({ orderBy: { dateDebut: "asc" } }),
    prisma.onboardingInvitation.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.appConfig.findUnique({ where: { key: "nolioCoachToken" } }),
  ]);

  return {
    coaches:         coaches.map(mapCoach),
    athletes:        athletes.map(mapAthlete),
    leads:           leads.map(mapLead),
    projets:         projets.map(mapProjet),
    taches:          taches.map(mapTache),
    todos:           todos.map(mapTodo),
    licencies:       licencies.map(mapLicencie),
    youngAthletes:   youngAthletes.map(mapYoungAthlete),
    academySessions: academySessions.map(mapAcademySession),
    events:          events.map(mapCalendarEvent),
    invitations:     invitations.map(mapInvitation),
    nolioCoachToken: tokenConfig
      ? (tokenConfig.value as unknown as NolioToken)
      : undefined,
  };
}

/**
 * Persists only the Nolio coach token (and nothing else).
 *
 * All other mutations go through dedicated CRUD helpers below.
 * Callers in Nolio routes that still pass the whole Database object:
 * only db.nolioCoachToken is written.
 */
export async function writeDB(data: Database): Promise<void> {
  if (data.nolioCoachToken) {
    await prisma.appConfig.upsert({
      where: { key: "nolioCoachToken" },
      update: { value: data.nolioCoachToken as never },
      create: { key: "nolioCoachToken", value: data.nolioCoachToken as never },
    });
  } else {
    await prisma.appConfig.deleteMany({ where: { key: "nolioCoachToken" } });
  }
}

// ── Coaches ───────────────────────────────────────────────────────────────────

export async function getCoaches(): Promise<Coach[]> {
  const rows = await prisma.coach.findMany();
  return rows.map(mapCoach);
}

export async function getCoachById(id: string): Promise<Coach | undefined> {
  const row = await prisma.coach.findUnique({ where: { id } });
  return row ? mapCoach(row) : undefined;
}

export async function createCoach(coach: Coach): Promise<Coach> {
  const row = await prisma.coach.create({
    data: {
      id:        coach.id,
      nom:       coach.nom,
      prenom:    coach.prenom,
      email:     coach.email     ?? "",
      telephone: coach.telephone ?? "",
      couleur:   coach.couleur   ?? "#7c1d35",
      role:      coach.role      ?? "",
    },
  });
  return mapCoach(row);
}

export async function updateCoach(id: string, data: Partial<Coach>): Promise<Coach | null> {
  try {
    const row = await prisma.coach.update({
      where: { id },
      data: {
        nom:       data.nom,
        prenom:    data.prenom,
        email:     data.email,
        telephone: data.telephone,
        couleur:   data.couleur,
        role:      data.role,
      },
    });
    return mapCoach(row);
  } catch {
    return null;
  }
}

export async function deleteCoach(id: string): Promise<boolean> {
  try {
    await prisma.coach.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

// ── Athletes ──────────────────────────────────────────────────────────────────

export async function getAthletes(): Promise<Athlete[]> {
  const rows = await prisma.athlete.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map(mapAthlete);
}

export async function getAthleteById(id: string): Promise<Athlete | undefined> {
  const row = await prisma.athlete.findUnique({ where: { id } });
  return row ? mapAthlete(row) : undefined;
}

export async function createAthlete(athlete: Athlete): Promise<Athlete> {
  const row = await prisma.athlete.create({
    data: {
      id:             athlete.id,
      nom:            athlete.nom,
      prenom:         athlete.prenom,
      email:          athlete.email     || null,
      telephone:      athlete.telephone ?? "",
      adresse:        athlete.adresse   ?? "",
      discipline:     (athlete.discipline ?? "triathlon") as never,
      coachId:        athlete.coachId,
      statut:         (athlete.statut   ?? "actif") as never,
      objectif:       athlete.objectif  ?? "",
      planJusquAu:    athlete.planJusquAu    ?? "",
      offreSouscrite: athlete.offreSouscrite ?? "",
      lienNolio:      athlete.lienNolio      ?? "",
      notes:          athlete.notes          ?? "",
      createdAt:      athlete.createdAt ? new Date(athlete.createdAt) : new Date(),
      service:        (athlete.service  ?? "performance") as never,
      prixMensuel:    athlete.prixMensuel ?? 0,
      nolioId:        athlete.nolioId ?? null,
      objectifs:      athlete.objectifs  as never ?? undefined,
      performances:   athlete.performances as never ?? undefined,
    },
  });
  return mapAthlete(row);
}

export async function updateAthlete(id: string, data: Partial<Athlete>): Promise<Athlete | null> {
  try {
    // Build update payload — only include defined fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: Record<string, any> = {};
    if (data.nom            !== undefined) payload.nom            = data.nom;
    if (data.prenom         !== undefined) payload.prenom         = data.prenom;
    if (data.email          !== undefined) payload.email          = data.email || null;
    if (data.telephone      !== undefined) payload.telephone      = data.telephone;
    if (data.adresse        !== undefined) payload.adresse        = data.adresse ?? "";
    if (data.discipline     !== undefined) payload.discipline     = data.discipline;
    if (data.coachId        !== undefined) payload.coachId        = data.coachId;
    if (data.statut         !== undefined) payload.statut         = data.statut;
    if (data.objectif       !== undefined) payload.objectif       = data.objectif;
    if (data.planJusquAu    !== undefined) payload.planJusquAu    = data.planJusquAu;
    if (data.offreSouscrite !== undefined) payload.offreSouscrite = data.offreSouscrite;
    if (data.lienNolio      !== undefined) payload.lienNolio      = data.lienNolio;
    if (data.notes          !== undefined) payload.notes          = data.notes;
    if (data.service        !== undefined) payload.service        = data.service;
    if (data.prixMensuel    !== undefined) payload.prixMensuel    = data.prixMensuel;
    if (data.nolioId        !== undefined) payload.nolioId        = data.nolioId ?? null;
    if (data.objectifs      !== undefined) payload.objectifs      = data.objectifs ?? null;
    if (data.performances   !== undefined) payload.performances   = data.performances ?? null;

    const row = await prisma.athlete.update({ where: { id }, data: payload });
    return mapAthlete(row);
  } catch {
    return null;
  }
}

export async function deleteAthlete(id: string): Promise<boolean> {
  try {
    // Remove FK-dependent rows first (raw SQL avoids transaction requirement)
    await prisma.$executeRaw`DELETE FROM "Tache" WHERE "athleteId" = ${id}`;
    await prisma.$executeRaw`DELETE FROM "OnboardingInvitation" WHERE "athleteId" = ${id}`;
    await prisma.$executeRaw`DELETE FROM "CalendarEvent" WHERE "athleteId" = ${id}`;
    await prisma.athlete.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

// ── Leads ─────────────────────────────────────────────────────────────────────

export async function getLeads(): Promise<Lead[]> {
  const rows = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(mapLead);
}

export async function getLeadById(id: string): Promise<Lead | undefined> {
  const row = await prisma.lead.findUnique({ where: { id } });
  return row ? mapLead(row) : undefined;
}

export async function createLead(lead: Lead): Promise<Lead> {
  const row = await prisma.lead.create({
    data: {
      id:               lead.id,
      nom:              lead.nom,
      prenom:           lead.prenom,
      email:            lead.email     || null,
      telephone:        lead.telephone ?? "",
      source:           (lead.source ?? "instagram") as never,
      discipline:       (lead.discipline ?? "triathlon") as never,
      statut:           (lead.statut ?? "a_contacter") as never,
      notes:            lead.notes     ?? "",
      createdAt:        lead.createdAt ? new Date(lead.createdAt) : new Date(),
      coachId:          lead.coachId   ?? null,
      dateDebutCoaching: lead.dateDebutCoaching ?? null,
      converti:         lead.converti  ?? false,
    },
  });
  return mapLead(row);
}

export async function updateLead(id: string, data: Partial<Lead>): Promise<Lead | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: Record<string, any> = {};
    if (data.nom              !== undefined) payload.nom              = data.nom;
    if (data.prenom           !== undefined) payload.prenom           = data.prenom;
    if (data.email            !== undefined) payload.email            = data.email || null;
    if (data.telephone        !== undefined) payload.telephone        = data.telephone;
    if (data.source           !== undefined) payload.source           = data.source;
    if (data.discipline       !== undefined) payload.discipline       = data.discipline;
    if (data.statut           !== undefined) payload.statut           = data.statut;
    if (data.notes            !== undefined) payload.notes            = data.notes;
    if (data.coachId          !== undefined) payload.coachId          = data.coachId ?? null;
    if (data.dateDebutCoaching !== undefined) payload.dateDebutCoaching = data.dateDebutCoaching ?? null;
    if (data.converti         !== undefined) payload.converti         = data.converti;

    const row = await prisma.lead.update({ where: { id }, data: payload });
    return mapLead(row);
  } catch {
    return null;
  }
}

export async function deleteLead(id: string): Promise<boolean> {
  try {
    await prisma.lead.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

// ── Projets ───────────────────────────────────────────────────────────────────

export async function getProjets(): Promise<Projet[]> {
  const rows = await prisma.projet.findMany();
  return rows.map(mapProjet);
}

export async function getProjetById(id: string): Promise<Projet | undefined> {
  const row = await prisma.projet.findUnique({ where: { id } });
  return row ? mapProjet(row) : undefined;
}

export async function createProjet(projet: Projet): Promise<Projet> {
  const row = await prisma.projet.create({
    data: {
      id:          projet.id,
      nom:         projet.nom,
      responsable: projet.responsable,
      deadline:    projet.deadline,
      progression: projet.progression ?? 0,
      statut:      projet.statut ?? "en_cours",
      description: projet.description ?? "",
    },
  });
  return mapProjet(row);
}

export async function updateProjet(id: string, data: Partial<Projet>): Promise<Projet | null> {
  try {
    const row = await prisma.projet.update({
      where: { id },
      data: {
        nom:         data.nom,
        responsable: data.responsable,
        deadline:    data.deadline,
        progression: data.progression,
        statut:      data.statut,
        description: data.description,
      },
    });
    return mapProjet(row);
  } catch {
    return null;
  }
}

export async function deleteProjet(id: string): Promise<boolean> {
  try {
    await prisma.$executeRaw`DELETE FROM "Tache" WHERE "projetId" = ${id}`;
    await prisma.projet.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

// ── Tâches ────────────────────────────────────────────────────────────────────

export async function getTaches(): Promise<Tache[]> {
  const rows = await prisma.tache.findMany();
  return rows.map(mapTache);
}

export async function getTachesByProjet(projetId: string): Promise<Tache[]> {
  const rows = await prisma.tache.findMany({ where: { projetId } });
  return rows.map(mapTache);
}

export async function createTache(tache: Tache): Promise<Tache> {
  const row = await prisma.tache.create({
    data: {
      id:          tache.id,
      titre:       tache.titre,
      projetId:    tache.projetId || null,
      athleteId:   tache.athleteId ?? null,
      responsable: tache.responsable,
      deadline:    tache.deadline,
      statut:      (tache.statut   ?? "a_faire") as never,
      priorite:    (tache.priorite ?? "moyenne") as never,
    },
  });
  return mapTache(row);
}

export async function updateTache(id: string, data: Partial<Tache>): Promise<Tache | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: Record<string, any> = {};
    if (data.titre       !== undefined) payload.titre       = data.titre;
    if (data.projetId    !== undefined) payload.projetId    = data.projetId || null;
    if (data.athleteId   !== undefined) payload.athleteId   = data.athleteId ?? null;
    if (data.responsable !== undefined) payload.responsable = data.responsable;
    if (data.deadline    !== undefined) payload.deadline    = data.deadline;
    if (data.statut      !== undefined) payload.statut      = data.statut;
    if (data.priorite    !== undefined) payload.priorite    = data.priorite;

    const row = await prisma.tache.update({ where: { id }, data: payload });
    return mapTache(row);
  } catch {
    return null;
  }
}

export async function deleteTache(id: string): Promise<boolean> {
  try {
    await prisma.tache.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

// ── Todos ─────────────────────────────────────────────────────────────────────

export async function getTodos(): Promise<Todo[]> {
  const rows = await prisma.todo.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map(mapTodo);
}

export async function createTodo(todo: Todo): Promise<Todo> {
  const row = await prisma.todo.create({
    data: {
      id:          todo.id,
      titre:       todo.titre,
      responsable: todo.responsable ?? "",
      priorite:    (todo.priorite ?? "moyenne") as never,
      deadline:    todo.deadline   ?? "",
      statut:      (todo.statut   ?? "a_faire") as never,
      projetId:    todo.projetId  ?? null,
      notes:       todo.notes     ?? null,
      createdAt:   todo.createdAt ? new Date(todo.createdAt) : new Date(),
    },
  });
  return mapTodo(row);
}

export async function updateTodo(id: string, data: Partial<Todo>): Promise<Todo | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: Record<string, any> = {};
    if (data.titre       !== undefined) payload.titre       = data.titre;
    if (data.responsable !== undefined) payload.responsable = data.responsable;
    if (data.priorite    !== undefined) payload.priorite    = data.priorite;
    if (data.deadline    !== undefined) payload.deadline    = data.deadline ?? "";
    if (data.statut      !== undefined) payload.statut      = data.statut;
    if (data.projetId    !== undefined) payload.projetId    = data.projetId ?? null;
    if (data.notes       !== undefined) payload.notes       = data.notes ?? null;

    const row = await prisma.todo.update({ where: { id }, data: payload });
    return mapTodo(row);
  } catch {
    return null;
  }
}

export async function deleteTodo(id: string): Promise<boolean> {
  try {
    await prisma.todo.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

// ── Licenciés ─────────────────────────────────────────────────────────────────

export async function getLicencies(): Promise<Licencie[]> {
  const rows = await prisma.licencie.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(mapLicencie);
}

export async function createLicencie(l: Licencie): Promise<Licencie> {
  const row = await prisma.licencie.create({
    data: {
      id:            l.id,
      prenom:        l.prenom,
      nom:           l.nom,
      email:         l.email     || null,
      telephone:     l.telephone ?? "",
      adresse:       l.adresse   ?? "",
      dateLicence:   l.dateLicence,
      numeroLicence: l.numeroLicence ?? "",
      discipline:    (l.discipline ?? "triathlon") as never,
      statut:        l.statut    ?? "actif",
      createdAt:     l.createdAt ? new Date(l.createdAt) : new Date(),
    },
  });
  return mapLicencie(row);
}

export async function updateLicencie(id: string, data: Partial<Licencie>): Promise<Licencie | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: Record<string, any> = {};
    if (data.prenom        !== undefined) payload.prenom        = data.prenom;
    if (data.nom           !== undefined) payload.nom           = data.nom;
    if (data.email         !== undefined) payload.email         = data.email || null;
    if (data.telephone     !== undefined) payload.telephone     = data.telephone;
    if (data.adresse       !== undefined) payload.adresse       = data.adresse ?? "";
    if (data.dateLicence   !== undefined) payload.dateLicence   = data.dateLicence;
    if (data.numeroLicence !== undefined) payload.numeroLicence = data.numeroLicence ?? "";
    if (data.discipline    !== undefined) payload.discipline    = data.discipline;
    if (data.statut        !== undefined) payload.statut        = data.statut;

    const row = await prisma.licencie.update({ where: { id }, data: payload });
    return mapLicencie(row);
  } catch {
    return null;
  }
}

export async function deleteLicencie(id: string): Promise<boolean> {
  try {
    await prisma.licencie.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

// ── Young Athletes (Academy) ──────────────────────────────────────────────────

export async function getYoungAthletes(): Promise<YoungAthlete[]> {
  const rows = await prisma.youngAthlete.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map(mapYoungAthlete);
}

export async function createYoungAthlete(ya: YoungAthlete): Promise<YoungAthlete> {
  const row = await prisma.youngAthlete.create({
    data: {
      id:              ya.id,
      prenom:          ya.prenom,
      nom:             ya.nom,
      dateNaissance:   ya.dateNaissance,
      discipline:      (ya.discipline ?? "triathlon") as never,
      contactParent:   ya.contactParent   ?? "",
      telephoneParent: ya.telephoneParent ?? "",
      emailParent:     ya.emailParent ?? null,
      urgence:         ya.urgence ?? "",
      statut:          ya.statut ?? "actif",
      createdAt:       ya.createdAt ? new Date(ya.createdAt) : new Date(),
    },
  });
  return mapYoungAthlete(row);
}

export async function updateYoungAthlete(id: string, data: Partial<YoungAthlete>): Promise<YoungAthlete | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: Record<string, any> = {};
    if (data.prenom          !== undefined) payload.prenom          = data.prenom;
    if (data.nom             !== undefined) payload.nom             = data.nom;
    if (data.dateNaissance   !== undefined) payload.dateNaissance   = data.dateNaissance;
    if (data.discipline      !== undefined) payload.discipline      = data.discipline;
    if (data.contactParent   !== undefined) payload.contactParent   = data.contactParent;
    if (data.telephoneParent !== undefined) payload.telephoneParent = data.telephoneParent;
    if (data.emailParent     !== undefined) payload.emailParent     = data.emailParent ?? null;
    if (data.urgence         !== undefined) payload.urgence         = data.urgence;
    if (data.statut          !== undefined) payload.statut          = data.statut;

    const row = await prisma.youngAthlete.update({ where: { id }, data: payload });
    return mapYoungAthlete(row);
  } catch {
    return null;
  }
}

export async function deleteYoungAthlete(id: string): Promise<boolean> {
  try {
    await prisma.youngAthlete.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

// ── Academy Sessions ──────────────────────────────────────────────────────────

export async function getAcademySessions(): Promise<AcademySession[]> {
  const rows = await prisma.academySession.findMany({ orderBy: { date: "desc" } });
  return rows.map(mapAcademySession);
}

export async function createAcademySession(session: AcademySession): Promise<AcademySession> {
  const row = await prisma.academySession.create({
    data: {
      id:           session.id,
      date:         session.date,
      entraineurId: session.entraineurId,
      discipline:   (session.discipline ?? "triathlon") as never,
      lieu:         session.lieu  ?? "",
      presents:     session.presents as never ?? [],
      notes:        session.notes ?? null,
    },
  });
  return mapAcademySession(row);
}

export async function updateAcademySession(id: string, data: Partial<AcademySession>): Promise<AcademySession | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: Record<string, any> = {};
    if (data.date         !== undefined) payload.date         = data.date;
    if (data.entraineurId !== undefined) payload.entraineurId = data.entraineurId;
    if (data.discipline   !== undefined) payload.discipline   = data.discipline;
    if (data.lieu         !== undefined) payload.lieu         = data.lieu;
    if (data.presents     !== undefined) payload.presents     = data.presents;
    if (data.notes        !== undefined) payload.notes        = data.notes ?? null;

    const row = await prisma.academySession.update({ where: { id }, data: payload });
    return mapAcademySession(row);
  } catch {
    return null;
  }
}

export async function deleteAcademySession(id: string): Promise<boolean> {
  try {
    await prisma.academySession.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

// ── Calendar Events ───────────────────────────────────────────────────────────

export async function getEvents(): Promise<CalendarEvent[]> {
  const rows = await prisma.calendarEvent.findMany({ orderBy: { dateDebut: "asc" } });
  return rows.map(mapCalendarEvent);
}

export async function createEvent(event: CalendarEvent): Promise<CalendarEvent> {
  const row = await prisma.calendarEvent.create({
    data: {
      id:           event.id,
      titre:        event.titre,
      type:         (event.type ?? "competition") as never,
      dateDebut:    event.dateDebut,
      dateFin:      event.dateFin      ?? null,
      responsable:  event.responsable  ?? null,
      description:  event.description  ?? null,
      source:       (event.source ?? "manual") as never,
      refId:        event.refId        ?? null,
      athleteId:    event.athleteId    ?? null,
      participants: event.participants as never ?? null,
    },
  });
  return mapCalendarEvent(row);
}

export async function updateEvent(id: string, data: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: Record<string, any> = {};
    if (data.titre        !== undefined) payload.titre        = data.titre;
    if (data.type         !== undefined) payload.type         = data.type;
    if (data.dateDebut    !== undefined) payload.dateDebut    = data.dateDebut;
    if (data.dateFin      !== undefined) payload.dateFin      = data.dateFin ?? null;
    if (data.responsable  !== undefined) payload.responsable  = data.responsable ?? null;
    if (data.description  !== undefined) payload.description  = data.description ?? null;
    if (data.source       !== undefined) payload.source       = data.source;
    if (data.refId        !== undefined) payload.refId        = data.refId ?? null;
    if (data.athleteId    !== undefined) payload.athleteId    = data.athleteId ?? null;
    if (data.participants !== undefined) payload.participants  = data.participants ?? null;

    const row = await prisma.calendarEvent.update({ where: { id }, data: payload });
    return mapCalendarEvent(row);
  } catch {
    return null;
  }
}

export async function deleteEvent(id: string): Promise<boolean> {
  try {
    await prisma.calendarEvent.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

// ── Onboarding Invitations ────────────────────────────────────────────────────

export async function getInvitations(): Promise<OnboardingInvitation[]> {
  const rows = await prisma.onboardingInvitation.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(mapInvitation);
}

export async function getInvitationByToken(token: string): Promise<OnboardingInvitation | undefined> {
  const row = await prisma.onboardingInvitation.findUnique({ where: { token } });
  return row ? mapInvitation(row) : undefined;
}

export async function createInvitation(inv: OnboardingInvitation): Promise<OnboardingInvitation> {
  const row = await prisma.onboardingInvitation.create({
    data: {
      token:       inv.token,
      athleteId:   inv.athleteId,
      prenom:      inv.prenom,
      nom:         inv.nom,
      email:       inv.email,
      coachId:     inv.coachId,
      createdAt:   inv.createdAt   ? new Date(inv.createdAt)   : new Date(),
      expiresAt:   new Date(inv.expiresAt),
      completedAt: inv.completedAt ? new Date(inv.completedAt) : null,
      statut:      (inv.statut ?? "pending") as never,
    },
  });
  return mapInvitation(row);
}

export async function updateInvitation(token: string, data: Partial<OnboardingInvitation>): Promise<OnboardingInvitation | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: Record<string, any> = {};
    if (data.prenom      !== undefined) payload.prenom      = data.prenom;
    if (data.nom         !== undefined) payload.nom         = data.nom;
    if (data.email       !== undefined) payload.email       = data.email;
    if (data.statut      !== undefined) payload.statut      = data.statut;
    if (data.completedAt !== undefined) payload.completedAt = data.completedAt ? new Date(data.completedAt) : null;
    if (data.expiresAt   !== undefined) payload.expiresAt   = new Date(data.expiresAt);

    const row = await prisma.onboardingInvitation.update({ where: { token }, data: payload });
    return mapInvitation(row);
  } catch {
    return null;
  }
}
