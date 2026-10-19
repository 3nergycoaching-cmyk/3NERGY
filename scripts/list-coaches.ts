import { getCoaches } from "../lib/db";
async function main() {
  const coaches = await getCoaches();
  console.log(JSON.stringify(coaches.map(c => ({ id: c.id, prenom: c.prenom, nom: c.nom, couleur: c.couleur, role: c.role })), null, 2));
  process.exit(0);
}
main();
