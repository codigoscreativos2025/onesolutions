import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const closerIdParam = searchParams.get("closerId");

  const userId = parseInt(session.user.id);
  const role = session.user.role;

  // Si es setter, solo puede ver slots si proporciona un closerId específico
  if (role === "SETTER" && !closerIdParam) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Determinar qué closerId usar
  const closerId = closerIdParam ? parseInt(closerIdParam) : userId;

  const slots = await prisma.closerSlot.findMany({
    where: { closerId },
    orderBy: { startAt: "asc" },
    include: {
      visit: {
        include: {
          parcel: {
            select: { id: true, address: true },
          },
          setter: {
            select: { name: true },
          },
          projects: {
            include: {
              projectType: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json(slots);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.user.id);

  if (session.user.role === "SETTER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Validar que el usuario existe
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await request.json();
  const { date, hour, isWorkday } = body;

  if (!date || hour === undefined) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const startAt = new Date(`${date}T${hour}:00:00`);
  const endAt = new Date(startAt);
  endAt.setHours(startAt.getHours() + 1);

  const slot = await prisma.closerSlot.create({
    data: {
      closerId: userId,
      startAt,
      endAt,
      isWorkday: isWorkday !== false,
    },
  });

  return NextResponse.json(slot, { status: 201 });
}
