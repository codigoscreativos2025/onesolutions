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
  const { reason } = body;

  try {
    const visit = await prisma.visit.findUnique({
      where: { id: parseInt(id) },
      include: { slot: true },
    });

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    if (visit.stage !== "PROJECT" && visit.stage !== "CLOSED") {
      return NextResponse.json({ error: "Only PROJECT or CLOSED visits can be cancelled" }, { status: 400 });
    }

    const updated = await prisma.visit.update({
      where: { id: parseInt(id) },
      data: {
        stage: "CANCELLED",
        outcome: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason: reason || null,
        notes: reason || null,
      },
    });

    // Liberar el slot del calendario si existe
    if (visit.slot) {
      await prisma.closerSlot.update({
        where: { id: visit.slot.id },
        data: {
          isBooked: false,
          visitId: null,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error cancelling visit:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
