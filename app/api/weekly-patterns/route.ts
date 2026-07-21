import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "CLOSER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const patterns = await prisma.weeklyPattern.findMany({
      where: { closerId: parseInt(session.user.id) },
      orderBy: { dayOfWeek: "asc" },
    });
    return NextResponse.json(patterns);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error fetching patterns" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "CLOSER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = parseInt(session.user.id);
    
    // Validar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { dayOfWeek, startHour, endHour, slotDuration, isWorkday } = await request.json();

    const existingPatterns = await prisma.weeklyPattern.findMany({
      where: { closerId: userId, dayOfWeek },
    });

    const isDuplicate = existingPatterns.some(
      (p) => p.startHour === startHour && p.endHour === endHour
    );
    if (isDuplicate) {
      return NextResponse.json({ error: "Ya existe un patrón idéntico" }, { status: 400 });
    }

    const isOverlapping = existingPatterns.some(
      (p) => startHour < p.endHour && p.startHour < endHour
    );
    if (isOverlapping) {
      return NextResponse.json(
        { error: "El horario se solapa con un patrón existente" },
        { status: 400 }
      );
    }

    const pattern = await prisma.weeklyPattern.create({
      data: {
        closerId: userId,
        dayOfWeek,
        startHour,
        endHour,
        slotDuration: slotDuration || 60,
        isWorkday: isWorkday ?? true,
      },
    });

    return NextResponse.json(pattern);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error creating pattern" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "CLOSER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Pattern ID required" }, { status: 400 });
    }

    await prisma.weeklyPattern.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error deleting pattern" }, { status: 500 });
  }
}
