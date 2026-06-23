import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/nolio/token
 * Removes the global Nolio coach token from AppConfig.
 * After this, /api/nolio/sync will return 400 and the app will prompt re-auth.
 */
export async function DELETE() {
  await prisma.appConfig.deleteMany({ where: { key: "nolioCoachToken" } });
  return NextResponse.json({ success: true });
}
