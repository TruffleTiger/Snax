import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { recipeId, notes } = body;

  const existing = await prisma.mealSlot.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Meal slot not found" }, { status: 404 });
  }

  const slot = await prisma.mealSlot.update({
    where: { id },
    data: {
      recipeId: recipeId === null ? null : recipeId ?? existing.recipeId,
      notes: notes ?? existing.notes,
    },
    include: {
      recipe: true,
      mealAttendees: { include: { familyMember: true } },
    },
  });

  return NextResponse.json(slot);
}
