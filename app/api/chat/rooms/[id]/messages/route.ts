import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = parseInt(session.user.id);
  const body = await request.json();
  const { body: messageBody, fileUrl, fileName } = body;

  if (!messageBody && !fileUrl) {
    return NextResponse.json(
      { error: "Message body or file is required" },
      { status: 400 }
    );
  }

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const room = await prisma.chatRoom.findUnique({
    where: { id: parseInt(id) },
    include: {
      visit: {
        select: { 
          id: true,
          setterId: true, 
          closerId: true,
          stage: true,
          createdAt: true,
          parcel: { select: { id: true, address: true } },
          setter: { select: { id: true, name: true } },
          closer: { select: { id: true, name: true } },
          bill: { select: { imageUrl: true, clientName: true, phone: true, clientEmail: true, additionalFileUrl: true, additionalFileName: true } },
          projectDetails: true,
          projects: { include: { projectType: { select: { id: true, name: true } } } },
          objections: { include: { objection: { select: { name: true, color: true } } } },
          closerObjections: { include: { closerObjection: { select: { name: true, color: true } } } },
          notes: true,
          cancelledAt: true,
          cancellationReason: true,
          completedAt: true,
          scheduledAt: true,
          finalizedAt: true,
          commissions: {
            include: {
              user: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const role = session.user.role;
  const hasAccess =
    role === "ADMIN" ||
    room.visit.setterId === userId ||
    room.visit.closerId === userId;

  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const message = await prisma.chatMessage.create({
    data: {
      roomId: parseInt(id),
      userId,
      body: messageBody || "",
      fileUrl,
      fileName,
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  // Parse @mentions and create notifications
  if (messageBody) {
    const mentionRegex = /(?:^|\s)@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(messageBody)) !== null) {
      mentions.push(match[1].toLowerCase());
    }

    if (mentions.length > 0) {
      const mentionedUsers = await prisma.user.findMany({
        where: {
          name: { in: mentions },
          NOT: { id: userId },
        },
        select: { id: true, name: true },
      });

      const mentionedNames = new Set(mentions);
      const matchedUsers = mentionedUsers.filter((u) =>
        mentionedNames.has(u.name.toLowerCase())
      );

      if (matchedUsers.length > 0) {
        const address = room.visit?.parcel?.address || "el proyecto";
        const notifications = matchedUsers.map((u) => ({
          userId: u.id,
          title: "Te mencionaron en un chat",
          body: `@${user.name} te mencionó en el chat de ${address}`,
          link: "/chat",
        }));

        await prisma.notification.createMany({ data: notifications });
      }
    }
  }

  return NextResponse.json(message, { status: 201 });
}
