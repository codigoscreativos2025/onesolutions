import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "CLOSER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { weeksAhead = 4 } = await request.json();
    const closerId = parseInt(session.user.id);

    // Obtener patrones del closer
    const patterns = await prisma.weeklyPattern.findMany({
      where: { closerId, isActive: true },
    });

    if (patterns.length === 0) {
      return NextResponse.json({ error: "No weekly patterns configured" }, { status: 400 });
    }

    const now = new Date();
    const createdSlots = [];

    // Generar slots para las próximas N semanas
    for (let week = 0; week < weeksAhead; week++) {
      for (const pattern of patterns) {
        // Calcular la fecha del día de la semana
        const currentDate = new Date(now);
        const currentDay = currentDate.getDay();
        const daysUntilTarget = (pattern.dayOfWeek - currentDay + 7) % 7;
        currentDate.setDate(currentDate.getDate() + daysUntilTarget + (week * 7));

        // Generar slots para cada hora del rango
        for (let hour = pattern.startHour; hour < pattern.endHour; hour++) {
          const startAt = new Date(currentDate);
          startAt.setHours(hour, 0, 0, 0);
          const endAt = new Date(startAt);
          endAt.setMinutes(endAt.getMinutes() + pattern.slotDuration);

          // Verificar si ya existe un slot en ese horario
          const existingSlot = await prisma.closerSlot.findFirst({
            where: {
              closerId,
              startAt,
            },
          });

          if (!existingSlot) {
            const slot = await prisma.closerSlot.create({
              data: {
                closerId,
                startAt,
                endAt,
                isWorkday: pattern.isWorkday,
              },
            });
            createdSlots.push(slot);
          }
        }
      }
    }

    return NextResponse.json({ created: createdSlots.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error generating slots" }, { status: 500 });
  }
}
