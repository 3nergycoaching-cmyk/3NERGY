import { readDB } from "@/lib/db";
import ProjetsClient from "./ProjetsClient";

export const dynamic = "force-dynamic";

export default async function ProjetsPage() {
  const db = await readDB();
  return <ProjetsClient projets={db.projets} coaches={db.coaches} taches={db.taches} />;
}
