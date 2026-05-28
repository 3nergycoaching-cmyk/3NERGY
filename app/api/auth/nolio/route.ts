import { NextRequest, NextResponse } from "next/server";
import { buildAuthUrl } from "@/lib/nolio";
import { getAthleteById } from "@/lib/db";

/**
 * GET /api/auth/nolio?athleteId=<id>
 * Redirects the user to the Nolio OAuth2 authorization page.
 * The CRM athlete ID is encoded in the `state` parameter.
 */
export async function GET(req: NextRequest) {
  const athleteId = req.nextUrl.searchParams.get("athleteId");

  if (!athleteId) {
    return NextResponse.json({ error: "athleteId requis" }, { status: 400 });
  }

  // Verify the athlete exists before starting the flow
  const athlete = await getAthleteById(athleteId);
  if (!athlete) {
    return NextResponse.json({ error: "Athlète introuvable" }, { status: 404 });
  }

  const url = buildAuthUrl(athleteId);
  return NextResponse.redirect(url);
}
