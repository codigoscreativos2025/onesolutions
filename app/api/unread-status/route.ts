import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const role = session.user.role;

  const notifications = await prisma.notification.findMany({
    where: { 
      userId: userId,
      isRead: false
    },
    orderBy: { id: "desc" }
  });

  const unreadNotificationsCount = notifications.length;
  const latestUnreadNotificationId = notifications.length > 0 ? notifications[0].id : null;

  let roomCondition: any = {};
  if (role === "ADMIN") {
    roomCondition = {}; 
  } else if (role === "PARTNER") {
    roomCondition = {
      type: "PARTNER",
      partnerId: userId
    };
  } else {
    roomCondition = {
      type: "GENERAL",
      visit: {
        OR: [{ setterId: userId }, { closerId: userId }]
      }
    };
  }

  const unreadMessages = await prisma.chatMessage.findMany({
    where: {
      isRead: false,
      userId: { not: userId },
      room: roomCondition
    },
    orderBy: { id: "desc" }
  });

  const unreadMessagesCount = unreadMessages.length;
  const latestUnreadMessageId = unreadMessages.length > 0 ? unreadMessages[0].id : null;

  return NextResponse.json({
    unreadNotificationsCount,
    latestUnreadNotificationId,
    unreadMessagesCount,
    latestUnreadMessageId
  });
}