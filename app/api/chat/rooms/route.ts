import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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
            parcel: { select: { address: true } },
            setter: { select: { name: true } },
            closer: { select: { name: true } },
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
        visit: {
          OR: [{ setterId: userId }, { closerId: userId }],
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        visit: {
          include: {
            parcel: { select: { address: true } },
            setter: { select: { name: true } },
            closer: { select: { name: true } },
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
