import { prisma } from "../lib/prisma";

async function main() {
  // Delete the duplicate athletes I added (ath-69 to ath-74) — they already existed in DB
  const toDelete = ["ath-69", "ath-70", "ath-71", "ath-72", "ath-73", "ath-74"];
  for (const id of toDelete) {
    const a = await prisma.athlete.findUnique({ where: { id }, select: { prenom: true, nom: true } });
    if (a) {
      await prisma.athlete.delete({ where: { id } });
      console.log(`Deleted duplicate: ${a.prenom} ${a.nom} (${id})`);
    }
  }
  console.log("Done.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
