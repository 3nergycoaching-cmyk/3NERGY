import { NextRequest, NextResponse } from "next/server";
import { buildAuthUrl } from "@/lib/nolio";
import { getAthleteById } from "@/lib/db";

/**
 * GET /api/auth/nolio?athleteId=<id>&returnTo=<path>
 *
 * Starts the Nolio OAuth2 flow. Both params are optional:
 *  - athleteId: if provided, the athlete is verified and returnTo defaults to /athletes/<id>
 *  - returnTo:  where to redirect after a successful OAuth (overrides default)
 *
 * If neither is provided, the user is redirected to /equipe/nolio after auth.
 */
export async function GET(req: NextRequest) {
  const athleteId = req.nextUrl.searchParams.get("athleteId") ?? undefined;
  const returnTo  = req.nextUrl.searchParams.get("returnTo")  ?? undefined;

  // Verify athlete exists when an ID is supplied
  if (athleteId) {
    const athlete = await getAthleteById(athleteId);
    if (!athlete) {
      return NextResponse.json({ error: "Athlète introuvable" }, { status: 404 });
    }
  }

  const url = buildAuthUrl({ athleteId, returnTo });
  return NextResponse.redirect(url);
}
