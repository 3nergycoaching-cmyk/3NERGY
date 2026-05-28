import { readDB } from "@/lib/db";
import EquipeClient from "./EquipeClient";

export const dynamic = "force-dynamic";

export default async function EquipePage() {
  const db = await readDB();
  return <EquipeClient coaches={db.coaches} athletes={db.athletes} />;
}
