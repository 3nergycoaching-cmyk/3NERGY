async function main() {
  const APP_SECRET = process.env.FALCO_APP_SECRET!;
  const API_KEY = process.env.FALCO_API_KEY!;
  const BASE = "https://api.sandbox.falco-app.be/v1";

  const headers: Record<string, string> = {
    "X-Falco-App-Secret": APP_SECRET,
    "X-Falco-Api-Key": API_KEY,
    "Content-Type": "application/json",
    "accept": "application/json",
  };

  async function falco(path: string, method = "GET", body?: unknown) {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`);
    return JSON.parse(text);
  }

  // 1. Créer le customer
  console.log("1. Création customer...");
  const customer = await falco("/customers", "POST", {
    name: "Victor Platteau",
    emails: ["victor.platteau.5@gmail.com"],
    language: "fr",
    address: { country: "BE", line1: "Rue Test 1", city: "Bruxelles", zip: "1000" },
  });
  console.log("Customer créé:", customer.id, customer.display_name);

  // 2. Créer une facture draft
  console.log("2. Création facture...");
  const today = new Date().toISOString().slice(0, 10);
  const invoice = await falco("/invoices", "POST", {
    document_type: "sale_invoice",
    document_date: today,
    due_date: today,
    language: "fr",
    currency: "EUR",
    payment_status: "paid",
    base_amount: "200.00",
    tax_regime: { type: "other_exoneration", legal_exoneration_text: "ASBL non assujettie" },
    customer_id: customer.id,
    lines: [{
      line_type: "article",
      reference: "COACHING",
      description: "Coaching mensuel 3NERGY",
      quantity: "1",
      unit_price: "200.00",
      tax_rate: "0.0",
      base_amount: "200.00",
    }],
  });
  console.log("Facture créée:", invoice.id, "payment_status:", invoice.payment_status);

  console.log("\n✓ Setup sandbox terminé. Lance le sync depuis la page Facturation.");
}

main().catch(console.error).finally(() => process.exit(0));
