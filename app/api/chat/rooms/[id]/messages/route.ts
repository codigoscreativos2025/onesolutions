import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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
        select: { setterId: true, closerId: true },
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

  return NextResponse.json(message, { status: 201 });
}
