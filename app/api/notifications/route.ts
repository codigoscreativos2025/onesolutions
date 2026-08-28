import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailTemplates } from "@/lib/email";
import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cancelledVisits = await prisma.visit.findMany({
    where: { stage: "CANCELLED" },
    select: {
      id: true,
      chatRooms: { select: { id: true } }
    }
  });

  const cancelledVisitIds = new Set(cancelledVisits.map(v => v.id));
  const cancelledRoomIds = new Set(cancelledVisits.flatMap(v => v.chatRooms.map(r => r.id)));

  // Auto-delete notifications older than 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  await prisma.notification.deleteMany({
    where: {
      userId: parseInt(session.user.id),
      createdAt: { lt: sevenDaysAgo },
    },
  });

  const allNotifications = await prisma.notification.findMany({
    where: { userId: parseInt(session.user.id) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const notifications = allNotifications.filter(n => {
    if (!n.link) return true;
    
    const leadMatch = n.link.match(/^\/lead\/(\d+)/);
    if (leadMatch && cancelledVisitIds.has(parseInt(leadMatch[1]))) return false;

    const roomMatch = n.link.match(/room=(\d+)/);
    if (roomMatch && cancelledRoomIds.has(parseInt(roomMatch[1]))) return false;

    return true;
  });

  return NextResponse.json(notifications.slice(0, 20));
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
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { userId, title, body: notificationBody, link } = body;

  if (!title || !notificationBody) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let targetUserIds: number[] = [];

  if (userId) {
    targetUserIds.push(parseInt(userId));
  } else {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    targetUserIds = admins.map((a) => a.id);
  }

  const notifications = await Promise.all(
    targetUserIds.map(async (id) => {
      const notification = await prisma.notification.create({
        data: {
          userId: id,
          title,
          body: notificationBody,
          link: link || null,
        },
      });

      const user = await prisma.user.findUnique({
        where: { id },
        select: { email: true, name: true },
      });

      if (user && user.email && !user.email.endsWith("@onesolutions.com")) {
        try {
          await sendEmail({
            to: user.email,
            subject: "Nueva notificaci\u00f3n - One Solutions",
            html: emailTemplates.notification(user.name || "", title, notificationBody),
          });
        } catch {
          // email failure shouldn't break notification creation
        }
      }

      return notification;
    })
  );

  return NextResponse.json(notifications);
}
