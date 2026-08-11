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
            parcel: { select: { address: true, ownerName: true } },
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
  } else if (role === "PARTNER") {
    rooms = await prisma.chatRoom.findMany({
      where: {
        type: "PARTNER",
        visit: {
          stage: { not: "CANCELLED" },
          parcel: { partnerId: userId },
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        visit: {
          include: {
            parcel: { select: { address: true, ownerName: true } },
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
            parcel: { select: { address: true, ownerName: true } },
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
  }

  return NextResponse.json(rooms);
}
