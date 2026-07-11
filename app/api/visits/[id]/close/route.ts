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
  const { notes, billImageUrl, billFileName } = body;

  try {
    const userId = parseInt(session.user.id);

    // Validar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const visit = await prisma.visit.update({
      where: { id: parseInt(id) },
      data: {
        stage: "CLOSED",
        outcome: "CLOSED",
        notes,
        completedAt: new Date(),
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
        // Si ya existe un recibo de luz, guardar como archivo adicional
        await prisma.bill.update({
          where: { visitId: visit.id },
          data: {
            additionalFileUrl: billImageUrl,
            additionalFileName: billFileName || "Archivo adjunto",
          },
        });
      } else {
        // No existe recibo, crear nuevo registro
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

    // Marcar parcela como cliente
    await prisma.parcel.update({
      where: { id: visit.parcelId },
      data: { status: "CUSTOMER" },
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

    // NO crear chat automáticamente - el closer debe crearlo manualmente después de cargar la información

    return NextResponse.json(visit);
  } catch (error) {
    console.error("Error closing visit:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
