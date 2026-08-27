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
  const { targetType, targetId, broadcastRole } = body;

  const senderName = session.user.name || "Administrador";
  const messageBody = `${template.content}<br/><br/><i>⚡ Enviado por ${senderName} (Admin)</i>`;
  const adminUserId = parseInt(session.user.id);

    const attachments = template.attachments ? JSON.parse(template.attachments) : [];
    
    async function sendAttachments(roomId: number) {
      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          await prisma.chatMessage.create({
            data: {
              roomId,
              userId: adminUserId,
              body: "Archivo adjunto: " + att.name,
              fileUrl: att.url,
              fileName: att.name,
            }
          });
        }
      }
    }


  // Helper: find or create ANNOUNCEMENTS room for a user
  async function getOrCreateAnnouncementsRoom(userId: number) {
    let room = await prisma.chatRoom.findFirst({
      where: { personalUserId: userId, type: "ANNOUNCEMENTS" },
    });
    if (!room) {
      room = await prisma.chatRoom.create({
        data: { personalUserId: userId, type: "ANNOUNCEMENTS" },
      });
    }
    return room;
  }

  // Helper: send template to a single user via their announcements room
  async function sendToUser(userId: number) {
    const room = await getOrCreateAnnouncementsRoom(userId);
    await prisma.chatMessage.create({
      data: {
        roomId: room.id,
        userId: adminUserId,
        body: messageBody,
        },
      });
      await sendAttachments(room.id);
      await prisma.notification.create({
      data: {
        userId,
        title: `[TEMPLATE] ${template!.title}`,
        body: template!.content,
        link: `/chat?room=${room.id}`,
        isRead: false,
      },
    });
    return room.id;
  }

  // === BROADCAST MODE ===
  if (broadcastRole) {
    let whereClause: any = { isActive: true, role: { not: "ADMIN" } };

    if (broadcastRole === "ALL") {
      // all non-admin active users
    } else if (broadcastRole === "SETTER") {
      whereClause.role = "SETTER";
    } else if (broadcastRole === "CLOSER") {
      whereClause.role = "CLOSER";
    } else if (broadcastRole === "PARTNER") {
      whereClause.role = "PARTNER";
    
    } else {
      return NextResponse.json({ error: "Invalid broadcastRole" }, { status: 400 });
    }

    const users = await prisma.user.findMany({ where: whereClause, select: { id: true } });

    for (const user of users) {
      await sendToUser(user.id);
    }

    return NextResponse.json({ success: true, sentTo: users.length });
  }

  // === SINGLE TARGET MODE ===
  if (!targetType || !targetId) {
    return NextResponse.json({ error: "Missing targetType/targetId or broadcastRole" }, { status: 400 });
  }

  if (targetType === "project") {
    const visitId = parseInt(targetId);
    let room = await prisma.chatRoom.findFirst({
      where: { visitId, type: "GENERAL" },
    });

    if (!room) {
      room = await prisma.chatRoom.create({
        data: { visitId, type: "GENERAL" },
      });
    }
    const roomId = room.id;

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

    await prisma.chatMessage.create({
      data: { roomId, userId: adminUserId, body: messageBody },
      });
      await sendAttachments(roomId);

      return NextResponse.json({ success: true, roomId });
  } else if (targetType === "user") {
    const userId = parseInt(targetId);
    const roomId = await sendToUser(userId);
    return NextResponse.json({ success: true, roomId });
  } else {
    return NextResponse.json({ error: "Invalid targetType" }, { status: 400 });
  }
}
