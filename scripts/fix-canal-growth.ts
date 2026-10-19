import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

async function main() {
  const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
  const p = new PrismaClient({ adapter } as never);
  
  for (const id of ["ath-67", "ath-68"]) {
    const updated = await p.athlete.update({
      where: { id },
      data: { canal: "GROWTH_OPERATOR", engagement: "M12" }
    });
    console.log(`Updated ${updated.id} ${updated.prenom} ${updated.nom} → canal: ${updated.canal}, engagement: ${updated.engagement}`);
  }
  await p.$disconnect();
}
main();
