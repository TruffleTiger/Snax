import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.weekPlan.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Week plan not found" }, { status: 404 });
  }
  await prisma.weekPlan.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
