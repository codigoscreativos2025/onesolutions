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
  const { notes, billImageUrl, billFileName, action } = body;

  try {
    const userId = parseInt(session.user.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingVisit = await prisma.visit.findUnique({
      where: { id: parseInt(id) },
      include: { slot: true, chatRoom: true },
    });

    if (!existingVisit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    let newStage = "CLOSED";
    if (action === "start-project") {
      newStage = "PROJECT";
    }

    const visit = await prisma.visit.update({
      where: { id: parseInt(id) },
      data: {
        stage: newStage,
        outcome: newStage === "CLOSED" ? "CLOSED" : undefined,
        notes,
        completedAt: newStage === "CLOSED" ? new Date() : undefined,
      },
      include: {
        setter: { select: { id: true } },
        closer: { select: { id: true } },
        parcel: { select: { address: true } },
        slot: true,
      },
    });

    // Guardar archivo adjunto si se proporcionó
    if (billImageUrl) {
      const existingBill = await prisma.bill.findUnique({
        where: { visitId: visit.id },
      });

      if (existingBill) {
        await prisma.bill.update({
          where: { visitId: visit.id },
          data: {
            additionalFileUrl: billImageUrl,
            additionalFileName: billFileName || "Archivo adjunto",
          },
        });
      } else {
        await prisma.bill.create({
          data: {
            visitId: visit.id,
            imageUrl: billImageUrl,
            phone: "",
            clientName: billFileName || "Archivo adjunto",
            notes: billFileName || "Archivo adjunto",
          },
        });
      }
    }

    if (newStage === "CLOSED") {
      // Marcar parcela como cliente
      await prisma.parcel.update({
        where: { id: visit.parcelId },
        data: { status: "CUSTOMER" },
      });

      // Crear chat automáticamente al cerrar proyecto
      const existingChat = await prisma.chatRoom.findUnique({
        where: { visitId: visit.id },
      });

      if (!existingChat) {
        await prisma.chatRoom.create({
          data: {
            visitId: visit.id,
          },
        });

        await prisma.visit.update({
          where: { id: visit.id },
          data: {
            chatCreatedAt: new Date(),
            chatCreatedBy: userId,
          },
        });
      }
    }

    // Liberar el slot del calendario si existe (para CLOSED o PROJECT)
    if (existingVisit.slot && newStage !== "PROJECT") {
      await prisma.closerSlot.update({
        where: { id: existingVisit.slot.id },
        data: {
          isBooked: false,
          visitId: null,
        },
      });
    }

    return NextResponse.json(visit);
  } catch (error) {
    console.error("Error closing visit:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
