import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { phone, clientName, billImageUrl, notes, slotId, closerId } = body;

  if (!phone || !billImageUrl || !slotId || !closerId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const existingBill = await prisma.bill.findUnique({
      where: { visitId: parseInt(id) },
    });

    if (existingBill) {
      await prisma.bill.update({
        where: { visitId: parseInt(id) },
        data: {
          imageUrl: billImageUrl,
          phone,
          clientName,
          notes,
        },
      });
    } else {
      await prisma.bill.create({
        data: {
          visitId: parseInt(id),
          imageUrl: billImageUrl,
          phone,
          clientName,
          notes,
        },
      });
    }

    await prisma.closerSlot.update({
      where: { id: parseInt(slotId) },
      data: { isBooked: true },
    });

    const visit = await prisma.visit.update({
      where: { id: parseInt(id) },
      data: {
        stage: "PROPOSAL_ACCEPTED",
        outcome: "PROPOSAL_ACCEPTED",
        closerId: parseInt(closerId),
        slot: { connect: { id: parseInt(slotId) } },
        notes,
      },
    });

    // Crear notificación para el closer
    await prisma.notification.create({
      data: {
        userId: parseInt(closerId),
        title: "Nueva cita asignada",
        body: `Te han asignado una nueva cita de un setter.`,
        link: `/dashboard`,
      },
    });

    return NextResponse.json(visit);
  } catch {
    return NextResponse.json({ error: "Visit not found" }, { status: 404 });
  }
}
