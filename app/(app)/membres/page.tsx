import { readDB } from "@/lib/db";
import MembresClient from "./MembresClient";

export const dynamic = "force-dynamic";

export default async function MembresPage() {
  const db = await readDB();
  return (
    <MembresClient
      athletes={db.athletes}
      coaches={db.coaches}
      youngAthletes={db.youngAthletes ?? []}
      initialLicencies={db.licencies ?? []}
    />
  );
}
