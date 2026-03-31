import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getMonday(dateStr?: string): Date {
  const d = dateStr ? new Date(dateStr) : new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const weekParam = searchParams.get("week");
  const monday = getMonday(weekParam ?? undefined);

  let plan = await prisma.weekPlan.findFirst({
    where: { weekStartDate: monday },
    include: {
      mealSlots: {
        include: {
          recipe: true,
          mealAttendees: { include: { familyMember: true } },
        },
        orderBy: { dayOfWeek: "asc" },
      },
    },
  });

  if (!plan) {
    plan = await prisma.weekPlan.create({
      data: {
        weekStartDate: monday,
        mealSlots: {
          create: Array.from({ length: 7 }, (_, i) => ({
            dayOfWeek: i,
            mealType: "dinner",
          })),
        },
      },
      include: {
        mealSlots: {
          include: {
            recipe: true,
            mealAttendees: { include: { familyMember: true } },
          },
          orderBy: { dayOfWeek: "asc" },
        },
      },
    });
  }

  return NextResponse.json(plan);
}
