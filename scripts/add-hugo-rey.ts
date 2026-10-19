import { createCoach } from "../lib/db";

async function main() {
  const coach = await createCoach({
    id: "coach-6",
    prenom: "Hugo",
    nom: "Rey",
    email: "",
    telephone: "",
    couleur: "#f97316",
    role: "Entraineur",
  });
  console.log("✓ Coach créé:", coach.id, coach.prenom, coach.nom);
  process.exit(0);
}

main().catch(console.error);
