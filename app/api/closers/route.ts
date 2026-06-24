import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, closerId: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let closers;

  if (user.role === "CLOSER") {
    // Un closer se puede asignar a sí mismo sus propios slots
    closers = await prisma.user.findMany({
      where: { id: userId, role: "CLOSER" },
      select: {
        id: true,
        name: true,
        email: true,
        slots: {
          where: { isBooked: false },
          orderBy: { startAt: "asc" },
        },
      },
    });
  } else {
    // Setter solo ve su closer asignado
    closers = await prisma.user.findMany({
      where: {
        id: user.closerId || 0,
        role: "CLOSER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        slots: {
          where: { isBooked: false },
          orderBy: { startAt: "asc" },
        },
      },
    });
  }

  return NextResponse.json(closers);
}
