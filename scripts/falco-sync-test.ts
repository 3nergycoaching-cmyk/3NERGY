// Simule exactement ce que fait /api/sync/falco
import { getAthletes, updateAthlete } from "../lib/db";

const APP_SECRET = process.env.FALCO_APP_SECRET!;
const API_KEY = process.env.FALCO_API_KEY!;
const BASE = API_KEY.startsWith("sk_test_")
  ? "https://api.sandbox.falco-app.be/v1"
  : "https://api.falco-app.be/v1";

const headers = {
  "X-Falco-App-Secret": APP_SECRET,
  "X-Falco-Api-Key": API_KEY,
  "accept": "application/json",
};

async function main() {
  const now = new Date();
  const mois = now.toISOString().slice(0, 7);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dateFrom = `${mois}-01T00:00:00Z`;
  const dateTo = `${mois}-${String(lastDay).padStart(2, "0")}T23:59:59Z`;

  console.log(`Sync pour ${mois} (${dateFrom} → ${dateTo})`);

  const res = await fetch(`${BASE}/invoices?date_from=${dateFrom}&date_to=${dateTo}&document_type=sale_invoice&page_size=100`, { headers });
  const json = await res.json() as any;
  const invoices = json.data ?? [];
  console.log(`${invoices.length} factures récupérées`);

  const paidEmails = new Set<string>();
  for (const inv of invoices) {
    const email = inv.customer?.email?.toLowerCase();
    if (email && inv.payment_status === "paid") {
      paidEmails.add(email);
      console.log(` ✓ PAID: ${email}`);
    }
  }

  const athletes = await getAthletes();
  let updated = 0;
  for (const a of athletes) {
    if (!a.email) continue;
    const email = a.email.toLowerCase();
    if (paidEmails.has(email)) {
      const currentEffectif = a.moisPaiement === mois ? a.statutPaiement : "EN_ATTENTE";
      if (currentEffectif === "OK") {
        console.log(`  ✓ déjà OK: ${a.prenom} ${a.nom}`);
        continue;
      }
      console.log(`  → ${a.prenom} ${a.nom} (${email}): ${currentEffectif} → OK`);
      await updateAthlete(a.id, { statutPaiement: "OK", moisPaiement: mois });
      updated++;
    }
  }

  console.log(`\n✓ ${updated} athlète(s) mis à jour`);
}

main().catch(console.error).finally(() => process.exit(0));
