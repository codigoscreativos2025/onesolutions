import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const objections = await prisma.objection.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { visits: true },
      },
    },
  });

  return NextResponse.json(objections);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { key, name, nameEn, color } = body;

  if (!key || !name) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const existing = await prisma.objection.findUnique({ where: { key } });
  if (existing) {
    return NextResponse.json(
      { error: "Key already exists" },
      { status: 409 }
    );
  }

  const objection = await prisma.objection.create({
    data: {
      key,
      name,
      nameEn,
      color: color || "#fb7800",
    },
  });

  return NextResponse.json(objection, { status: 201 });
}
