import { NextRequest, NextResponse } from "next/server";
import { getTodos, createTodo } from "@/lib/db";
import { Todo } from "@/lib/types";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    const todos = await getTodos();
    return NextResponse.json(todos);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const todo: Todo = {
      id: `todo-${randomUUID()}`,
      titre: body.titre,
      responsable: body.responsable || "",
      priorite: body.priorite || "moyenne",
      deadline: body.deadline || undefined,
      statut: body.statut || "a_faire",
      projetId: body.projetId || undefined,
      notes: body.notes || undefined,
      createdAt: new Date().toISOString(),
    };
    const created = await createTodo(todo);
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
