import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

/**
 * GET /api/onboarding/health
 *
 * Diagnostic endpoint — checks that all onboarding dependencies are reachable:
 *  - Prisma / Neon DB connection
 *  - Resend API key (optional: pass ?email=<address> to send a test email)
 *
 * This route is NOT in the public routes list on purpose — only authenticated
 * coaches/admins should be able to trigger it.
 */
export async function GET(req: NextRequest) {
  const results: Record<string, { ok: boolean; detail?: string }> = {};

  // ── 1. DB connection ───────────────────────────────────────────────────────
  try {
    const count = await prisma.onboardingInvitation.count();
    results.db = { ok: true, detail: `${count} invitation(s) en base` };
  } catch (err) {
    results.db = { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }

  // ── 2. Resend API key present ──────────────────────────────────────────────
  const hasResendKey = !!process.env.RESEND_API_KEY;
  results.resend_key = { ok: hasResendKey, detail: hasResendKey ? "RESEND_API_KEY définie" : "RESEND_API_KEY absente" };

  // ── 3. Optional test email ─────────────────────────────────────────────────
  const testEmail = req.nextUrl.searchParams.get("email");
  if (testEmail && hasResendKey) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from: "3NERGY <contact@3nergy.be>",
        to: testEmail,
        subject: "[TEST] Onboarding 3NERGY — diagnostic",
        html: `
          <p>Cet email confirme que le système d'onboarding 3NERGY est opérationnel.</p>
          <ul>
            <li>✅ Prisma / Neon DB : ${results.db.detail}</li>
            <li>✅ Resend API : clé présente</li>
            <li>✅ URL de base : ${new URL(req.url).origin}</li>
          </ul>
          <p style="color:#999;font-size:12px;">Test déclenché le ${new Date().toLocaleString("fr-FR")}</p>
        `,
      });
      results.test_email = {
        ok: !error,
        detail: error ? error.message : `Email envoyé à ${testEmail} (id: ${data?.id})`,
      };
    } catch (err) {
      results.test_email = { ok: false, detail: err instanceof Error ? err.message : String(err) };
    }
  }

  // ── 4. Env vars summary ────────────────────────────────────────────────────
  results.base_url = {
    ok: true,
    detail: process.env.NEXT_PUBLIC_BASE_URL
      ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL} (VERCEL_URL)` : null)
      ?? `${new URL(req.url).origin} (request origin fallback)`,
  };

  const allOk = Object.values(results).every((r) => r.ok);
  return NextResponse.json({ ok: allOk, results }, { status: allOk ? 200 : 500 });
}
