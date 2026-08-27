import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const role = session.user.role;

  let rooms;

  if (role === "ADMIN") {
    rooms = await prisma.chatRoom.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        visit: {
          include: {
            parcel: { select: { address: true, ownerName: true, parcelTags: true } },
            setter: { select: { id: true, name: true } },
            closer: { select: { id: true, name: true } },
            projects: {
              include: {
                projectType: { select: { id: true, name: true } },
                partner: { select: { id: true, name: true } },
              },
            },
            bill: true,
            projectDetails: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    const personalRooms = await prisma.chatRoom.findMany({
      where: { type: "PERSONAL" },
      orderBy: { createdAt: "desc" },
      include: {
        personalUser: { select: { id: true, name: true, role: true, email: true, phone: true, profile: { select: { address: true, profilePhoto: true } } } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { user: { select: { name: true } } },
        },
      },
    });

    const announcementsRooms = await prisma.chatRoom.findMany({
      where: { type: "ANNOUNCEMENTS" },
      orderBy: { createdAt: "desc" },
      include: {
        personalUser: { select: { id: true, name: true, role: true, email: true, phone: true, profile: { select: { address: true, profilePhoto: true } } } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { user: { select: { name: true } } },
        },
      },
    });

    rooms = [...rooms, ...personalRooms, ...announcementsRooms].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } else if (role === "PARTNER") {
    rooms = await prisma.chatRoom.findMany({
      where: {
        type: "PARTNER",
        partnerId: userId,
        visit: {
          stage: { not: "CANCELLED" },
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        visit: {
          include: {
            parcel: { select: { address: true, ownerName: true, parcelTags: true } },
            setter: { select: { id: true, name: true } },
            closer: { select: { id: true, name: true } },
            projects: {
              include: {
                projectType: { select: { id: true, name: true } },
                partner: { select: { id: true, name: true } },
              },
            },
            bill: true,
            projectDetails: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });
  } else {
    rooms = await prisma.chatRoom.findMany({
      where: {
        type: "GENERAL",
        visit: {
          OR: [{ setterId: userId }, { closerId: userId }],
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        visit: {
          include: {
            parcel: { select: { address: true, ownerName: true, parcelTags: true } },
            setter: { select: { id: true, name: true } },
            closer: { select: { id: true, name: true } },
            bill: true,
            projectDetails: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    const personalRooms = await prisma.chatRoom.findMany({
      where: {
        type: "PERSONAL",
        personalUserId: userId,
      },
      orderBy: { createdAt: "desc" },
      include: {
        personalUser: { select: { id: true, name: true, role: true, email: true, phone: true, profile: { select: { address: true, profilePhoto: true } } } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { user: { select: { name: true } } },
        },
      },
    });

    const announcementsRooms = await prisma.chatRoom.findMany({
      where: {
        type: "ANNOUNCEMENTS",
        personalUserId: userId,
      },
      orderBy: { createdAt: "desc" },
      include: {
        personalUser: { select: { id: true, name: true, role: true, email: true, phone: true, profile: { select: { address: true, profilePhoto: true } } } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { user: { select: { name: true } } },
        },
      },
    });

    rooms = [...rooms, ...personalRooms, ...announcementsRooms].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  return NextResponse.json(rooms);
}

