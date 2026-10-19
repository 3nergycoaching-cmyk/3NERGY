import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

async function main() {
  const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
  const p = new PrismaClient({ adapter } as never);
  for (const id of ["ath-67", "ath-68"]) {
    const u = await p.athlete.update({ where: { id }, data: { statutPaiement: "OK" } });
    console.log(`${u.prenom} ${u.nom} → statutPaiement: ${u.statutPaiement}`);
  }
  await p.$disconnect();
}
main();
