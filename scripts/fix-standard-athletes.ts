import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

async function main() {
  const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
  const p = new PrismaClient({ adapter } as never);
  
  for (const id of ["ath-67", "ath-68"]) {
    await p.athlete.update({
      where: { id },
      data: { regime: "STANDARD", formule: "F300" }
    });
    console.log(`Updated ${id} → STANDARD / F300`);
  }
  await p.$disconnect();
}
main();
