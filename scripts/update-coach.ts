import { prisma } from "../lib/prisma";

async function main() {
  const coach = await prisma.coach.update({
    where: { id: "coach-5" },
    data: { prenom: "Hugo", nom: "Grey" },
  });
  console.log("Updated:", coach.prenom, coach.nom);
}

main().catch(console.error).finally(() => prisma.$disconnect());
