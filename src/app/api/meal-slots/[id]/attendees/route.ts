import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: mealSlotId } = await params;
  const body = await request.json();
  const { familyMemberIds } = body as { familyMemberIds: string[] };

  const existing = await prisma.mealSlot.findUnique({ where: { id: mealSlotId } });
  if (!existing) {
    return NextResponse.json({ error: "Meal slot not found" }, { status: 404 });
  }

  // Delete all existing attendees then recreate
  await prisma.mealAttendee.deleteMany({ where: { mealSlotId } });

  if (familyMemberIds && familyMemberIds.length > 0) {
    await prisma.mealAttendee.createMany({
      data: familyMemberIds.map((familyMemberId) => ({
        mealSlotId,
        familyMemberId,
      })),
    });
  }

  const slot = await prisma.mealSlot.findUnique({
    where: { id: mealSlotId },
    include: {
      recipe: true,
      mealAttendees: { include: { familyMember: true } },
    },
  });

  return NextResponse.json(slot);
}
