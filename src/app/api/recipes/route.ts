import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source");

  const recipes = await prisma.recipe.findMany({
    where: source ? { source } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(recipes);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, description, ingredients, instructions, prepTimeMinutes, tags } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const recipe = await prisma.recipe.create({
    data: {
      title: title.trim(),
      description: description ?? "",
      ingredients: typeof ingredients === "string" ? ingredients : JSON.stringify(ingredients ?? []),
      instructions: instructions ?? "",
      prepTimeMinutes: prepTimeMinutes ?? 30,
      source: "user",
      tags: tags ?? "",
    },
  });

  return NextResponse.json(recipe, { status: 201 });
}
