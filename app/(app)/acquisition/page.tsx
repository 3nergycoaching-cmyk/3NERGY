import { readDB } from "@/lib/db";
import AcquisitionClient from "./AcquisitionClient";

export const dynamic = "force-dynamic";

export default async function AcquisitionPage() {
  const db = await readDB();
  return <AcquisitionClient leads={db.leads} coaches={db.coaches} />;
}
