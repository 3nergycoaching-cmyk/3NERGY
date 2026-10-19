import { NextResponse } from "next/server";
import { getAthletes, updateAthlete } from "@/lib/db";

function falcoBase(apiKey: string) {
  return apiKey.startsWith("sk_test_")
    ? "https://api.sandbox.falco-app.be/v1"
    : "https://api.falco-app.be/v1";
}

interface FalcoInvoice {
  id: string;
  status: "draft" | "sent" | "locked";
  document_date: string;
  payment_status: "not_paid" | "partially" | "paid";
  customer: {
    id: string;
    display_name: string;
    email: string;
  };
}

interface FalcoListResponse {
  data: FalcoInvoice[];
}

export async function POST() {
  const appSecret = process.env.FALCO_APP_SECRET;
  const apiKey = process.env.FALCO_API_KEY;

  if (!appSecret || !apiKey) {
    return NextResponse.json(
      { error: "FALCO_APP_SECRET et FALCO_API_KEY requis dans .env.local" },
      { status: 500 }
    );
  }

  const now = new Date();
  const mois = now.toISOString().slice(0, 7); // "YYYY-MM"
  const dateFrom = `${mois}-01T00:00:00Z`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dateTo = `${mois}-${String(lastDay).padStart(2, "0")}T23:59:59Z`;

  // Fetch invoices for current month from Falco
  const url = `${falcoBase(apiKey)}/invoices?date_from=${dateFrom}&date_to=${dateTo}&document_type=sale_invoice&page_size=100`;
  let invoices: FalcoInvoice[] = [];

  try {
    const res = await fetch(url, {
      headers: {
        "X-Falco-App-Secret": appSecret,
        "X-Falco-Api-Key": apiKey,
        "accept": "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Falco API error ${res.status}: ${text}` },
        { status: 502 }
      );
    }

    const json: FalcoListResponse = await res.json();
    invoices = json.data ?? [];
  } catch (err) {
    return NextResponse.json(
      { error: `Impossible de contacter Falco: ${String(err)}` },
      { status: 502 }
    );
  }

  // Build email → payment_status map from Falco invoices
  const paidEmails = new Set<string>();
  const partialEmails = new Set<string>();

  for (const inv of invoices) {
    const email = inv.customer?.email?.toLowerCase();
    if (!email) continue;
    if (inv.payment_status === "paid") paidEmails.add(email);
    else if (inv.payment_status === "partially") partialEmails.add(email);
  }

  // Load all CRM athletes and update matching ones
  const athletes = await getAthletes();
  const results: { id: string; email: string; ancien: string; nouveau: string }[] = [];

  for (const athlete of athletes) {
    if (!athlete.email) continue;
    const email = athlete.email.toLowerCase();

    if (paidEmails.has(email)) {
      const currentEffectif =
        athlete.moisPaiement === mois ? athlete.statutPaiement : "EN_ATTENTE";
      if (currentEffectif !== "OK") {
        await updateAthlete(athlete.id, { statutPaiement: "OK", moisPaiement: mois });
        results.push({ id: athlete.id, email, ancien: currentEffectif, nouveau: "OK" });
      }
    }
    // Note: "partially" and "not_paid" are not automatically set to EN_RETARD
    // (EN_RETARD is set manually — auto-sync only validates payments, not flags overdue)
  }

  return NextResponse.json({
    mois,
    invoicesChecked: invoices.length,
    paidFound: paidEmails.size,
    updated: results.length,
    details: results,
  });
}
