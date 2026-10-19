import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

async function main() {
  const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
  const p = new PrismaClient({ adapter } as never);
  const athletes = await p.athlete.findMany({
    where: { statut: "actif", prixMensuel: { gt: 0 } },
    select: { id: true, prenom: true, nom: true, prixMensuel: true, regime: true, formule: true, canal: true }
  });
  console.log(`Total actifs payants: ${athletes.length}`);
  const total = athletes.reduce((s, a) => s + (a.prixMensuel ?? 0), 0);
  console.log(`Total mensuel: ${total}€`);
  athletes.filter(a => a.regime === "STANDARD").forEach(a => 
    console.log("STANDARD:", a.prenom, a.nom, a.prixMensuel, a.formule, a.canal)
  );
  await p.$disconnect();
}
main();
