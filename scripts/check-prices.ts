import { prisma } from "../lib/prisma";

async function main() {
  const athletes = await prisma.athlete.findMany({
    where: { statut: "actif" },
    select: { prenom: true, nom: true, prixMensuel: true, service: true },
  });
  const groups: Record<number, string[]> = {};
  athletes.forEach((a) => {
    if (!groups[a.prixMensuel]) groups[a.prixMensuel] = [];
    groups[a.prixMensuel].push(`${a.prenom} ${a.nom}`);
  });
  Object.keys(groups)
    .map(Number)
    .sort((a, b) => b - a)
    .forEach((p) => {
      console.log(`${p}€ (${groups[p].length}): ${groups[p].join(", ")}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
