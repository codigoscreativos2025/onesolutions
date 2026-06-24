import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = parseInt(session.user.id);
  const role = session.user.role;

  const room = await prisma.chatRoom.findUnique({
    where: { id: parseInt(id) },
    include: {
      visit: {
        include: {
          parcel: { select: { address: true } },
          setter: { select: { id: true, name: true } },
          closer: { select: { id: true, name: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const hasAccess =
    role === "ADMIN" ||
    room.visit.setterId === userId ||
    room.visit.closerId === userId;

  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Marcar mensajes como leídos
  await prisma.chatMessage.updateMany({
    where: {
      roomId: room.id,
      userId: { not: userId },
      isRead: false,
    },
    data: { isRead: true },
  });

  return NextResponse.json(room);
}
