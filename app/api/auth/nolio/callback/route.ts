import { NextRequest, NextResponse } from "next/server";
import { decodeState, exchangeCode, fetchNolioUser } from "@/lib/nolio";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/auth/nolio/callback?code=<code>&state=<base64url>
 *
 * Exchanges the authorization code for a token and persists it as the
 * GLOBAL coach token in AppConfig (key = "nolioCoachToken").
 * Redirects to returnTo on success (from state) or /equipe/nolio on error.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // User denied authorization
  if (error) {
    return NextResponse.redirect(new URL("/equipe/nolio", req.url));
  }

  if (!code || !state) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  let decoded: { athleteId?: string; returnTo: string };
  try {
    decoded = decodeState(state);
  } catch {
    return NextResponse.json({ error: "State invalide" }, { status: 400 });
  }

  const { athleteId, returnTo } = decoded;

  try {
    // 1. Exchange code → token
    const token = await exchangeCode(code);

    // 2. Fetch Nolio user profile (non-fatal)
    try {
      const profile = await fetchNolioUser(token);
      token.nolioUserId = profile.id;
    } catch {
      // Ignore — we can operate without the Nolio user ID
    }

    // 3. Persist as global coach token in AppConfig
    await prisma.appConfig.upsert({
      where:  { key: "nolioCoachToken" },
      update: { value: token as never },
      create: { key: "nolioCoachToken", value: token as never },
    });

    // 4. Redirect to returnTo with success indicator
    const successUrl = new URL(returnTo, req.url);
    successUrl.searchParams.set("nolio", "connected");
    return NextResponse.redirect(successUrl);
  } catch (err) {
    console.error("[Nolio callback]", err);
    // Redirect back to athlete page if we have one, otherwise equipe/nolio
    const errorBase = athleteId ? `/athletes/${athleteId}` : "/equipe/nolio";
    const errorUrl = new URL(errorBase, req.url);
    errorUrl.searchParams.set("nolio", "error");
    return NextResponse.redirect(errorUrl);
  }
}
