import { readDB } from "@/lib/db";
import TodoClient from "./TodoClient";

export const dynamic = "force-dynamic";

export default async function TodoPage() {
  const db = await readDB();
  return (
    <TodoClient
      initialTodos={db.todos}
      coaches={db.coaches}
      projets={db.projets}
    />
  );
}
