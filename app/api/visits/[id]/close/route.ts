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
  const { notes } = body;

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
      },
    });

    // Marcar parcela como cliente
    await prisma.parcel.update({
      where: { id: visit.parcelId },
      data: { status: "CUSTOMER" },
    });

    // Crear chat room si no existe
    const existingRoom = await prisma.chatRoom.findUnique({
      where: { visitId: visit.id },
    });

    if (!existingRoom) {
      await prisma.chatRoom.create({
        data: {
          visitId: visit.id,
          messages: {
            create: {
              userId: userId,
              body: `Proyecto cerrado para ${visit.parcel.address}. Chat creado automáticamente.`,
            },
          },
        },
      });

      // Notificar a setter y admin
      const notifications = [];
      if (visit.setter) {
        notifications.push({
          userId: visit.setter.id,
          title: "Proyecto cerrado",
          body: `Un closer cerró el proyecto de ${visit.parcel.address}`,
          link: `/chat`,
        });
      }

      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      admins.forEach((admin) => {
        notifications.push({
          userId: admin.id,
          title: "Proyecto cerrado",
          body: `Se cerró el proyecto de ${visit.parcel.address}`,
          link: `/admin/chats`,
        });
      });

      if (notifications.length > 0) {
        await prisma.notification.createMany({ data: notifications });
      }
    }

    return NextResponse.json(visit);
  } catch {
    return NextResponse.json({ error: "Visit not found" }, { status: 404 });
  }
}
