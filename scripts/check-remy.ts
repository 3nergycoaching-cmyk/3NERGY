import { prisma } from "../lib/prisma";

async function main() {
  const coaches = await prisma.coach.findMany({ orderBy: { id: "asc" } });
  console.log("Coaches:", coaches.map(c => `${c.id}: ${c.prenom} ${c.nom}`).join(", "));

  const remy = coaches.find(c => c.prenom.toLowerCase().includes("rém") || c.nom.toLowerCase().includes("rém") || c.prenom.toLowerCase().includes("rem"));
  if (!remy) { console.log("Rémy not found"); return; }

  console.log("\nRémy =", remy.id, remy.prenom, remy.nom);

  const athletes = await prisma.athlete.findMany({ where: { coachId: remy.id } });
  console.log("\nAthlètes assignés à Rémy:");
  athletes.forEach(a => console.log(` - ${a.prenom} ${a.nom} (${a.statut}, ${a.prixMensuel}€)`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
