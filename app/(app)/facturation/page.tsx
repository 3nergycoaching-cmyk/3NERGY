import { readDB } from "@/lib/db";
import FacturationClient from "./FacturationClient";

export const dynamic = "force-dynamic";

export default async function FacturationPage() {
  const db = await readDB();
  const athletes = db.athletes.filter((a) => a.statut === "actif" && a.prixMensuel > 0);
  return <FacturationClient athletes={athletes} coaches={db.coaches} />;
}
