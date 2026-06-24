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

  let visits;

  if (role === "ADMIN") {
    visits = await prisma.visit.findMany({
      where: {
        stage: {
          in: ["PROPOSAL_ACCEPTED", "CLOSED"],
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        parcel: { select: { id: true, address: true } },
        setter: { select: { name: true } },
        closer: { select: { name: true } },
        bill: true,
        slot: true,
      },
    });
  } else if (role === "CLOSER") {
    visits = await prisma.visit.findMany({
      where: {
        closerId: userId,
        stage: {
          in: ["PROPOSAL_ACCEPTED", "CLOSED"],
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        parcel: { select: { id: true, address: true } },
        setter: { select: { name: true } },
        closer: { select: { name: true } },
        bill: true,
        slot: true,
      },
    });
  } else {
    // Setter
    visits = await prisma.visit.findMany({
      where: {
        setterId: userId,
        stage: {
          in: ["PROPOSAL_ACCEPTED", "CLOSED"],
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        parcel: { select: { id: true, address: true } },
        setter: { select: { name: true } },
        closer: { select: { name: true } },
        bill: true,
        slot: true,
      },
    });
  }

  return NextResponse.json(visits);
}
