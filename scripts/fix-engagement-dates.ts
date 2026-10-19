import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

async function main() {
  const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
  const p = new PrismaClient({ adapter } as never);

  const athletes = [
    { id: "ath-67", dateDebut: new Date("2026-09-07"), dateFinEngagement: new Date("2027-09-07") },
    { id: "ath-68", dateDebut: new Date("2026-09-21"), dateFinEngagement: new Date("2027-09-21") },
  ];

  for (const a of athletes) {
    const updated = await p.athlete.update({
      where: { id: a.id },
      data: { dateDebut: a.dateDebut, dateFinEngagement: a.dateFinEngagement },
    });
    console.log(`${updated.prenom} ${updated.nom} — début: ${a.dateDebut.toLocaleDateString("fr-FR")}, fin: ${a.dateFinEngagement.toLocaleDateString("fr-FR")}`);
  }
  await p.$disconnect();
}
main();
