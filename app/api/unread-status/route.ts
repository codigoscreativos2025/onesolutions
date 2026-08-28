
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

  // Fetch cancelled visits & rooms to filter out their notifications
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
      userId: userId,
      createdAt: { lt: sevenDaysAgo },
    },
  });

  const allNotifications = await prisma.notification.findMany({
    where: { 
      userId: userId,
      isRead: false
    },
    orderBy: { id: "desc" }
  });

  const notifications = allNotifications.filter(n => {
    if (!n.link) return true;
    
    // Filter out /lead/:id
    const leadMatch = n.link.match(/^\/lead\/(\d+)/);
    if (leadMatch && cancelledVisitIds.has(parseInt(leadMatch[1]))) return false;

    // Filter out /admin/chats?room=:id
    const roomMatch = n.link.match(/room=(\d+)/);
    if (roomMatch && cancelledRoomIds.has(parseInt(roomMatch[1]))) return false;

    return true;
  });

  const unreadNotificationsCount = notifications.length;
  const latestUnreadNotificationId = notifications.length > 0 ? notifications[0].id : null;

  let roomCondition: any = {
    visit: {
      stage: { not: "CANCELLED" }
    }
  };
  
  if (role === "ADMIN") {
    // Admin can see everything (except cancelled)
  } else if (role === "PARTNER") {
    roomCondition = {
      OR: [
        { type: "PARTNER", partnerId: userId, visit: { stage: { not: "CANCELLED" } } },
        { type: "PERSONAL", personalUserId: userId },
        { type: "ANNOUNCEMENTS", personalUserId: userId }
      ]
    };
  } else if (role === "CLOSER") {
    roomCondition = {
      OR: [
        { type: "GENERAL", visit: { stage: { not: "CANCELLED" }, OR: [{ setterId: userId }, { closerId: userId }] } },
        { type: "PERSONAL", personalUserId: userId },
        { type: "ANNOUNCEMENTS", personalUserId: userId }
      ]
    };
  } else {
    // SETTER and SETTER_JR only get personal and announcements
    roomCondition = {
      OR: [
        { type: "ANNOUNCEMENTS", personalUserId: userId },
        { type: "PERSONAL", personalUserId: userId }
      ]
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

