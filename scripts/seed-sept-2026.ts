import { createCoach, createAthlete, getCoaches } from "../lib/db";

async function main() {
  const coaches = await getCoaches();

  // 1. Ajouter Cindy Lefebvre
  const cindy = coaches.find((c) => c.prenom === "Cindy");
  if (cindy) {
    console.log("✓ Cindy Lefebvre déjà présente:", cindy.id);
  } else {
    const created = await createCoach({
      id: "coach-7",
      prenom: "Cindy",
      nom: "Lefebvre",
      email: "",
      telephone: "",
      couleur: "#06B6D4",
      role: "Entraineur",
    });
    console.log("✓ Coach créé:", created.id, created.prenom, created.nom);
  }

  const coachesAfter = await getCoaches();
  const cindyId = coachesAfter.find((c) => c.prenom === "Cindy")!.id;
  const kylianId = coachesAfter.find((c) => c.prenom === "Kylian")!.id;

  // 2. Melissa Deliens
  const melissa = await createAthlete({
    id: `athlete-melissa-deliens`,
    nom: "Deliens",
    prenom: "Melissa",
    email: "melissa.deliens.1995@hotmail.com",
    telephone: "0491054025",
    adresse: "Willem Matstraat 19, 1560 Hoeilaart, Belgique",
    discipline: "triathlon",
    coachId: cindyId,
    statut: "actif",
    objectif: "",
    notes: "",
    service: "performance",
    prixMensuel: 255,
    canal: "ORGANIQUE",
    regime: "STANDARD",
    engagement: "M9",
    dateDebut: "2026-09-16T00:00:00.000Z",
    dateFinEngagement: "2027-06-16T00:00:00.000Z",
    paiementUnique: 2300,
    statutPaiement: "OK",
    moisPaiement: "2026-09",
    createdAt: "2026-09-16T00:00:00.000Z",
  });
  console.log("✓ Athlète créé:", melissa.id, melissa.prenom, melissa.nom);

  // 3. Manuel Declercq
  const manuel = await createAthlete({
    id: `athlete-manuel-declercq`,
    nom: "Declercq",
    prenom: "Manuel",
    email: "manueldeclercq1993@gmail.com",
    telephone: "+32479633860",
    adresse: "Avenue des Gerfauts 6/42, 1170 Bruxelles, Belgique",
    discipline: "triathlon",
    coachId: kylianId,
    statut: "actif",
    objectif: "",
    notes: "",
    service: "performance",
    prixMensuel: 267,
    canal: "GROWTH_OPERATOR",
    regime: "STANDARD",
    engagement: "M12",
    dateDebut: "2026-09-28T00:00:00.000Z",
    dateFinEngagement: "2027-09-28T00:00:00.000Z",
    paiementUnique: 3200,
    statutPaiement: "OK",
    moisPaiement: "2026-09",
    createdAt: new Date().toISOString(),
  });
  console.log("✓ Athlète créé:", manuel.id, manuel.prenom, manuel.nom);

  console.log("\n✓ Seed terminé.");
}

main().catch(console.error).finally(() => process.exit(0));
