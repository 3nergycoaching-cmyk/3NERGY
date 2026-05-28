import { readDB } from "@/lib/db";
import { notFound } from "next/navigation";
import ProjetDetailClient from "./ProjetDetailClient";

export const dynamic = "force-dynamic";

export default async function ProjetDetailPage({ params }: { params: { id: string } }) {
  const db = await readDB();
  const projet = db.projets.find((p) => p.id === params.id);
  if (!projet) notFound();

  const taches = db.taches.filter((t) => t.projetId === params.id);
  const todos  = (db.todos || []).filter((t) => t.projetId === params.id);
  const coach  = db.coaches.find((c) => c.id === projet.responsable);

  return (
    <ProjetDetailClient
      projet={projet}
      taches={taches}
      todos={todos}
      coaches={db.coaches}
      responsable={coach}
    />
  );
}
