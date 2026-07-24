import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tags = await prisma.notAvailableTag.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: { visits: true },
      },
    },
  });

  return NextResponse.json(tags);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, nameEn, color, order } = body;

  if (!name) {
    return NextResponse.json(
      { error: "name is required" },
      { status: 400 }
    );
  }

  const tag = await prisma.notAvailableTag.create({
    data: {
      name,
      nameEn,
      color: color || "#fb7800",
      order: order ?? 0,
    },
  });

  return NextResponse.json(tag, { status: 201 });
}
