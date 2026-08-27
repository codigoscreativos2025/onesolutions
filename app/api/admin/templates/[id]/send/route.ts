import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const templateId = parseInt(id);

  const template = await prisma.template.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const body = await request.json();
  const { targetType, targetId } = body;

  if (!targetType || !targetId) {
    return NextResponse.json({ error: "Missing targetType or targetId" }, { status: 400 });
  }

  const senderName = session.user.name || "Administrador";
  const messageBody = `${template.content}\n\n— Enviado por ${senderName} (Admin)`;

  let roomId: number;
  let notificationUserId: number;

  if (targetType === "project") {
    // Find or create GENERAL chat room for the visit
    const visitId = parseInt(targetId);
    let room = await prisma.chatRoom.findFirst({
      where: { visitId, type: "GENERAL" },
    });

    if (!room) {
      room = await prisma.chatRoom.create({
        data: { visitId, type: "GENERAL" },
      });
    }
    roomId = room.id;

    // Determine who to notify for the project (setter and closer)
    const visit = await prisma.visit.findUnique({ where: { id: visitId } });
    if (visit) {
      const userIds = [visit.setterId, visit.closerId].filter(Boolean) as number[];
      if (userIds.length > 0) {
        await prisma.notification.createMany({
          data: userIds.map((uId) => ({
            userId: uId,
            title: `[TEMPLATE] ${template.title}`,
            body: template.content,
            link: `/chat?room=${roomId}`,
            isRead: false,
          })),
        });
      }
    }
  } else if (targetType === "user") {
    // PERSONAL CHAT
    const userId = parseInt(targetId);
    let room = await prisma.chatRoom.findFirst({
      where: { personalUserId: userId, type: "PERSONAL" },
    });

    if (!room) {
      room = await prisma.chatRoom.create({
        data: { personalUserId: userId, type: "PERSONAL" },
      });
    }
    roomId = room.id;

    // Send notification to the specific user
    await prisma.notification.create({
      data: {
        userId,
        title: `[TEMPLATE] ${template.title}`,
        body: template.content,
        link: `/chat?room=${roomId}`,
        isRead: false,
      },
    });
  } else {
    return NextResponse.json({ error: "Invalid targetType" }, { status: 400 });
  }

  // Create the actual chat message in the room
  await prisma.chatMessage.create({
    data: {
      roomId,
      userId: parseInt(session.user.id),
      body: messageBody,
    },
  });

  return NextResponse.json({ success: true, roomId });
}
