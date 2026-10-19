import { prisma } from "../lib/prisma";

const athletes = [
  {
    id: "ath-67",
    nom: "Roux",
    prenom: "Benoît",
    email: "",
    coachId: "coach-1",
    statut: "actif" as const,
    service: "indiv_300" as const,
    prixMensuel: 300,
    notes: "Formule 300€/mois, engagement 12 mois, apporté par le growth operator. Paiement 3 600€ reçu, facture transmise.",
    planJusquAu: "2027-09-07",
    createdAt: new Date("2026-09-07T10:00:00.000Z"),
  },
  {
    id: "ath-68",
    nom: "Merviel",
    prenom: "Adrien",
    email: "",
    coachId: "coach-1",
    statut: "actif" as const,
    service: "indiv_300" as const,
    prixMensuel: 300,
    notes: "Formule 300€/mois, engagement 12 mois, apporté par le growth operator. Paiement 3 600€ reçu, facture transmise.",
    planJusquAu: "2027-09-21",
    createdAt: new Date("2026-09-21T10:00:00.000Z"),
  },
  {
    id: "ath-69",
    nom: "Dieu",
    prenom: "Vincent",
    email: "",
    coachId: "coach-1",
    statut: "actif" as const,
    service: "autre" as const,
    prixMensuel: 0,
    notes: "À compléter — présent dans Notion.",
    createdAt: new Date("2026-09-15T10:00:00.000Z"),
  },
  {
    id: "ath-70",
    nom: "Brichard",
    prenom: "Christophe",
    email: "",
    coachId: "coach-1",
    statut: "actif" as const,
    service: "autre" as const,
    prixMensuel: 0,
    notes: "À compléter — présent dans Notion.",
    createdAt: new Date("2026-09-15T10:00:00.000Z"),
  },
  {
    id: "ath-71",
    nom: "Mulkers",
    prenom: "Emmanuelle",
    email: "",
    coachId: "coach-1",
    statut: "actif" as const,
    service: "autre" as const,
    prixMensuel: 0,
    notes: "À compléter — présent dans Notion.",
    createdAt: new Date("2026-09-15T10:00:00.000Z"),
  },
  {
    id: "ath-72",
    nom: "Godart",
    prenom: "Corentin",
    email: "",
    coachId: "coach-1",
    statut: "actif" as const,
    service: "autre" as const,
    prixMensuel: 0,
    notes: "À compléter — présent dans Notion.",
    createdAt: new Date("2026-09-15T10:00:00.000Z"),
  },
  {
    id: "ath-73",
    nom: "Gaillet",
    prenom: "Olivier",
    email: "",
    coachId: "coach-1",
    statut: "actif" as const,
    service: "autre" as const,
    prixMensuel: 0,
    notes: "À compléter — présent dans Notion.",
    createdAt: new Date("2026-09-15T10:00:00.000Z"),
  },
  {
    id: "ath-74",
    nom: "Bailleux",
    prenom: "Valentin",
    email: "",
    coachId: "coach-1",
    statut: "actif" as const,
    service: "autre" as const,
    prixMensuel: 0,
    notes: "À compléter — présent dans Notion.",
    createdAt: new Date("2026-09-15T10:00:00.000Z"),
  },
];

async function main() {
  for (const a of athletes) {
    await prisma.athlete.upsert({
      where: { id: a.id },
      update: a,
      create: a,
    });
    console.log(`✓ ${a.prenom} ${a.nom}`);
  }
  console.log("\nDone.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
