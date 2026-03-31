import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const prefs = await prisma.mealPreference.findMany({
    orderBy: [{ dayOfWeek: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(prefs);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { dayOfWeek, label } = body;

  if (typeof dayOfWeek !== "number" || dayOfWeek < 0 || dayOfWeek > 6) {
    return NextResponse.json({ error: "Invalid dayOfWeek (0-6)" }, { status: 400 });
  }
  if (!label || typeof label !== "string" || label.trim().length === 0) {
    return NextResponse.json({ error: "Label is required" }, { status: 400 });
  }

  const pref = await prisma.mealPreference.create({
    data: { dayOfWeek, label: label.trim() },
  });

  return NextResponse.json(pref, { status: 201 });
}
