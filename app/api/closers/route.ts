import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const showTrainees = searchParams.get("trainees") === "true";

  const userId = parseInt(session.user.id);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, closerId: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (showTrainees && user.role === "CLOSER") {
    const trainees = await prisma.user.findMany({
      where: { closerId: userId },
      select: { id: true, name: true, email: true },
    });
    return NextResponse.json(trainees);
  }

  let closers;

  if (user.role === "CLOSER") {
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