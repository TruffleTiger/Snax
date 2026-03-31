import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.pantryItem.findMany({
    orderBy: [
      { expiresAt: { sort: "asc", nulls: "last" } },
      { name: "asc" },
    ],
  });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, quantity, unit, expiresAt } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const item = await prisma.pantryItem.create({
    data: {
      name: name.trim(),
      quantity: quantity ?? 1,
      unit: unit ?? "",
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
