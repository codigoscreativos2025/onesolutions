import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: parseInt(session.user.id) },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(notifications);
}

export async function PATCH() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.notification.updateMany({
    where: {
      userId: parseInt(session.user.id),
      isRead: false,
    },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { userId, title, body: notificationBody, link } = body;

  if (!userId || !title || !notificationBody) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const notification = await prisma.notification.create({
    data: {
      userId: parseInt(userId),
      title,
      body: notificationBody,
      link: link || null,
    },
  });

  return NextResponse.json(notification);
}
