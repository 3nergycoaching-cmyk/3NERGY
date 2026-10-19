import { prisma } from "../lib/prisma";

// coach-1 = Kylian, coach-2 = Florent, coach-3 = Louis, coach-4 = Rémi
const COACH = { Kylian: "coach-1", Florent: "coach-2", Louis: "coach-3", Rémi: "coach-4" };

const data: { prenom: string; nom: string; coach: keyof typeof COACH; discipline: string; prix: number }[] = [
  { prenom: "Alexandre",  nom: "Jadoul",           coach: "Kylian",  discipline: "triathlon",     prix: 109 },
  { prenom: "Arnaud",     nom: "Equeter",           coach: "Florent", discipline: "course_a_pied", prix: 69  },
  { prenom: "Aymeric",    nom: "Derume",            coach: "Florent", discipline: "triathlon",     prix: 109 },
  { prenom: "Benjamin",   nom: "Nys",               coach: "Kylian",  discipline: "course_a_pied", prix: 109 },
  { prenom: "Boris",      nom: "Blommaert",         coach: "Florent", discipline: "triathlon",     prix: 99  },
  { prenom: "Christophe", nom: "Brichard",          coach: "Rémi",    discipline: "course_a_pied", prix: 69  },
  { prenom: "Cindy",      nom: "Besson",            coach: "Kylian",  discipline: "triathlon",     prix: 99  },
  { prenom: "Corentin",   nom: "Godart",            coach: "Rémi",    discipline: "triathlon",     prix: 109 },
  { prenom: "Cyril",      nom: "Jeanmotte",         coach: "Florent", discipline: "cyclisme",      prix: 59  },
  { prenom: "Dylan",      nom: "Auquier",           coach: "Louis",   discipline: "triathlon",     prix: 69  },
  { prenom: "Elodie",     nom: "Corfers",           coach: "Rémi",    discipline: "course_a_pied", prix: 69  },
  { prenom: "Emmanuelle", nom: "Mulkers",           coach: "Rémi",    discipline: "course_a_pied", prix: 99  },
  { prenom: "Françoise",  nom: "Dulac",             coach: "Kylian",  discipline: "course_a_pied", prix: 99  },
  { prenom: "Gilles",     nom: "Van Remortel",      coach: "Kylian",  discipline: "triathlon",     prix: 69  },
  { prenom: "Guillaume",  nom: "Grulois",           coach: "Kylian",  discipline: "triathlon",     prix: 99  },
  { prenom: "Jérôme",     nom: "Delsoir",           coach: "Kylian",  discipline: "triathlon",     prix: 59  },
  { prenom: "Johan",      nom: "Labby",             coach: "Kylian",  discipline: "cyclisme",      prix: 69  },
  { prenom: "Justine",    nom: "Thibeau",           coach: "Kylian",  discipline: "triathlon",     prix: 99  },
  { prenom: "Laura",      nom: "Deneubourg",        coach: "Louis",   discipline: "course_a_pied", prix: 59  },
  { prenom: "Léa",        nom: "Spitalieri",        coach: "Rémi",    discipline: "triathlon",     prix: 99  },
  { prenom: "Linda",      nom: "Vizzini",           coach: "Florent", discipline: "course_a_pied", prix: 99  },
  { prenom: "Louis",      nom: "Kindt",             coach: "Kylian",  discipline: "triathlon",     prix: 99  },
  { prenom: "Louise",     nom: "Hellin",            coach: "Kylian",  discipline: "course_a_pied", prix: 99  },
  { prenom: "Mathias",    nom: "Vandenbussche",     coach: "Kylian",  discipline: "triathlon",     prix: 99  },
  { prenom: "Maxime",     nom: "Verbruggen",        coach: "Kylian",  discipline: "course_a_pied", prix: 99  },
  { prenom: "Nelson",     nom: "Van Loo",           coach: "Kylian",  discipline: "triathlon",     prix: 69  },
  { prenom: "Nicolas",    nom: "Demoulin",          coach: "Kylian",  discipline: "triathlon",     prix: 69  },
  { prenom: "Nicolas",    nom: "Taverna",           coach: "Rémi",    discipline: "triathlon",     prix: 69  },
  { prenom: "Noa",        nom: "Landrain",          coach: "Florent", discipline: "course_a_pied", prix: 99  },
  { prenom: "Olivier",    nom: "Gaillet",           coach: "Rémi",    discipline: "triathlon",     prix: 69  },
  { prenom: "Ophélie",    nom: "Berland",           coach: "Rémi",    discipline: "triathlon",     prix: 99  },
  { prenom: "Perrine",    nom: "Sadoine",           coach: "Florent", discipline: "triathlon",     prix: 69  },
  { prenom: "Quentin",    nom: "Van Waryenberge",   coach: "Florent", discipline: "triathlon",     prix: 69  },
  { prenom: "Rémy",       nom: "Labye",             coach: "Kylian",  discipline: "triathlon",     prix: 69  },
  { prenom: "Romain",     nom: "Blondeau",          coach: "Kylian",  discipline: "course_a_pied", prix: 59  },
  { prenom: "Sébastien",  nom: "Druart",            coach: "Kylian",  discipline: "triathlon",     prix: 59  },
  { prenom: "Sylvain",    nom: "Dubois",            coach: "Florent", discipline: "triathlon",     prix: 99  },
  { prenom: "Thomas",     nom: "Lo Bue",            coach: "Florent", discipline: "triathlon",     prix: 89  },
  { prenom: "Ugo",        nom: "D'Angelo",          coach: "Kylian",  discipline: "cyclisme",      prix: 109 },
  { prenom: "Vadim",      nom: "Dufrasne",          coach: "Florent", discipline: "triathlon",     prix: 69  },
  { prenom: "Valentin",   nom: "Bailleux",          coach: "Kylian",  discipline: "triathlon",     prix: 99  },
  { prenom: "Victor",     nom: "Platteau",          coach: "Kylian",  discipline: "triathlon",     prix: 109 },
  { prenom: "Vincent",    nom: "Dieu",              coach: "Florent", discipline: "triathlon",     prix: 69  },
  { prenom: "Warren",     nom: "Allard",            coach: "Florent", discipline: "course_a_pied", prix: 69  },
  { prenom: "Yann",       nom: "Moiroux",           coach: "Florent", discipline: "triathlon",     prix: 99  },
  { prenom: "Zacharie",   nom: "Bennis",            coach: "Kylian",  discipline: "triathlon",     prix: 99  },
];

async function main() {
  let updated = 0;
  let notFound: string[] = [];

  for (const row of data) {
    const athletes = await prisma.athlete.findMany({
      where: {
        prenom: { equals: row.prenom, mode: "insensitive" },
        nom: { equals: row.nom, mode: "insensitive" },
        statut: "actif",
      },
    });

    if (athletes.length === 0) {
      notFound.push(`${row.prenom} ${row.nom}`);
      continue;
    }

    for (const a of athletes) {
      await prisma.athlete.update({
        where: { id: a.id },
        data: {
          coachId: COACH[row.coach],
          discipline: row.discipline as any,
          prixMensuel: row.prix,
        },
      });
    }
    updated++;
    console.log(`✓ ${row.prenom} ${row.nom} → ${row.coach}, ${row.discipline}, ${row.prix}€`);
  }

  if (notFound.length) console.log("\n⚠️ Non trouvés:", notFound.join(", "));
  console.log(`\nDone. ${updated} mis à jour.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
