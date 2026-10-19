import { prisma } from "../lib/prisma";

async function main() {
  // Fix Emmanuelle Mulkers: double space + update coach/discipline/price
  await prisma.athlete.update({
    where: { id: "ath-1786175230409" },
    data: { prenom: "Emmanuelle", coachId: "coach-4", discipline: "course_a_pied", prixMensuel: 99 },
  });
  console.log("✓ Emmanuelle Mulkers fixed");

  // Louis Kindt: set actif + update coach/discipline/price
  await prisma.athlete.update({
    where: { id: "ath-38" },
    data: { statut: "actif", coachId: "coach-1", discipline: "triathlon", prixMensuel: 99 },
  });
  console.log("✓ Louis Kindt → actif");
}

main().catch(console.error).finally(() => prisma.$disconnect());
