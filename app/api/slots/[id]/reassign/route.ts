import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slotId, reason, toCloserId, newSlotId } = await request.json();

    if (!slotId || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Obtener el slot actual
    const currentSlot = await prisma.closerSlot.findUnique({
      where: { id: parseInt(slotId) },
      include: { visit: true },
    });

    if (!currentSlot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    // Crear registro de reasignación
    const reassignment = await prisma.slotReassignment.create({
      data: {
        slotId: parseInt(slotId),
        fromCloserId: parseInt(session.user.id),
        toCloserId: toCloserId ? parseInt(toCloserId) : null,
        reason,
        status: toCloserId && newSlotId ? "APPROVED" : "PENDING",
      },
    });

    // Si se proporciona nuevo closer y slot, hacer la reasignación automáticamente
    if (toCloserId && newSlotId) {
      // Actualizar el slot original para liberarlo
      await prisma.closerSlot.update({
        where: { id: parseInt(slotId) },
        data: { isBooked: false, visitId: null },
      });

      // Reservar el nuevo slot para el nuevo closer
      await prisma.closerSlot.update({
        where: { id: parseInt(newSlotId) },
        data: { 
          isBooked: true,
          visitId: currentSlot.visitId,
        },
      });

      // Actualizar la visita con el nuevo closer
      if (currentSlot.visitId) {
        await prisma.visit.update({
          where: { id: currentSlot.visitId },
          data: { closerId: parseInt(toCloserId) },
        });
      }

      // Notificar al admin
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
      });

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: "Cita reasignada",
            body: `Una cita fue reasignada de ${session.user.name} a otro closer.`,
            link: "/admin/metrics",
          },
        });
      }

      // Notificar al nuevo closer
      await prisma.notification.create({
        data: {
          userId: parseInt(toCloserId),
          title: "Nueva cita asignada",
          body: `Se te asignó una cita previamente agendada por otro closer.`,
          link: "/calendar",
        },
      });

      await prisma.slotReassignment.update({
        where: { id: reassignment.id },
        data: { status: "APPROVED", resolvedAt: new Date() },
      });
    } else {
      // Solo notificar al admin para que evalúe
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
      });

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: "Solicitud de reasignación",
            body: `${session.user.name} no puede asistir a una cita. Motivo: ${reason}`,
            link: "/admin/calendar",
          },
        });
      }
    }

    return NextResponse.json(reassignment);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error reassigning slot" }, { status: 500 });
  }
}
