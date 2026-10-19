import { prisma } from "../lib/prisma";

async function main() {
  const mulkers = await prisma.athlete.findMany({ where: { nom: { contains: "ulker", mode: "insensitive" } } });
  console.log("Mulkers:", mulkers.map(a => `${a.id} ${a.prenom} ${a.nom} (${a.statut})`));

  const kindt = await prisma.athlete.findMany({ where: { nom: { contains: "indt", mode: "insensitive" } } });
  console.log("Kindt:", kindt.map(a => `${a.id} ${a.prenom} ${a.nom} (${a.statut})`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
