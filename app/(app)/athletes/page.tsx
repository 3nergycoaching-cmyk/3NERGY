import { readDB } from "@/lib/db";
import AthletesClient from "./AthletesClient";

export const dynamic = "force-dynamic";

export default async function AthletesPage() {
  const db = await readDB();
  return <AthletesClient athletes={db.athletes} coaches={db.coaches} />;
}
