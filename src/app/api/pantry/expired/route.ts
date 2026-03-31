import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  const result = await prisma.pantryItem.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
  return NextResponse.json({ deleted: result.count });
}
