import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const members = await prisma.familyMember.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(members);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, sensitivities } = body as {
    name: string;
    sensitivities: string;
  };

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const member = await prisma.familyMember.create({
    data: {
      name: name.trim(),
      sensitivities: sensitivities ?? "",
    },
  });

  return NextResponse.json(member, { status: 201 });
}
