import { getAthletes } from "../lib/db";
async function main() {
  const athletes = await getAthletes();
  const actifs = athletes.filter(a => a.statut === "actif" && a.email).slice(0, 5);
  console.log(JSON.stringify(actifs.map(a => ({ id: a.id, nom: a.nom, prenom: a.prenom, email: a.email })), null, 2));
  process.exit(0);
}
main();
