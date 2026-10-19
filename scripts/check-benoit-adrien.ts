import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

async function main() {
  const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
  const p = new PrismaClient({ adapter } as never);
  const athletes = await p.athlete.findMany({
    where: { OR: [{ prenom: "Benoît" }, { prenom: "Adrien" }] }
  });
  athletes.forEach(a => console.log(a.id, a.prenom, a.nom, "regime:", a.regime, "formule:", a.formule, "prix:", a.prixMensuel, "statut:", a.statut));
  await p.$disconnect();
}
main();
