import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const objections = await prisma.closerObjection.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { visits: true },
        },
      },
    });
    return NextResponse.json(objections);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error fetching closer objections" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { key, name, nameEn, color, isActive } = body;

    if (!key || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const objection = await prisma.closerObjection.create({
      data: { key, name, nameEn, color: color || "#545f64", isActive: isActive !== false },
    });

    return NextResponse.json(objection, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error creating closer objection" }, { status: 500 });
  }
}
