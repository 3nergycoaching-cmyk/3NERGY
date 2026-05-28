import { NextRequest, NextResponse } from "next/server";
import { decodeState, exchangeCode, fetchNolioUser } from "@/lib/nolio";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/auth/nolio/callback?code=<code>&state=<base64(athleteId)>
 *
 * Exchanges the authorization code for a token and persists it as the
 * GLOBAL coach token in AppConfig (key = "nolioCoachToken").
 *
 * The state carries an athleteId so we can redirect back to the correct
 * athlete profile after authentication.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // User denied authorization
  if (error) {
    return NextResponse.redirect(new URL("/athletes", req.url));
  }

  if (!code || !state) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  let athleteId: string;
  try {
    athleteId = decodeState(state);
  } catch {
    return NextResponse.json({ error: "State invalide" }, { status: 400 });
  }

  try {
    // 1. Exchange code → token
    const token = await exchangeCode(code);

    // 2. Fetch Nolio user profile to store the Nolio user ID
    try {
      const profile = await fetchNolioUser(token);
      token.nolioUserId = profile.id;
    } catch {
      // Non-fatal — we can still operate without the Nolio user ID
    }

    // 3. Persist as global coach token in AppConfig
    await prisma.appConfig.upsert({
      where:  { key: "nolioCoachToken" },
      update: { value: token as never },
      create: { key: "nolioCoachToken", value: token as never },
    });

    // 4. Redirect to athlete profile with success message
    const url = new URL(`/athletes/${athleteId}`, req.url);
    url.searchParams.set("nolio", "connected");
    return NextResponse.redirect(url);
  } catch (err) {
    console.error("[Nolio callback]", err);
    const url = new URL(`/athletes/${athleteId}`, req.url);
    url.searchParams.set("nolio", "error");
    return NextResponse.redirect(url);
  }
}
