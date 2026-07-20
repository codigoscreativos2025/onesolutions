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

  const whereClause: Record<string, unknown> = {};

  if (role === "PARTNER") {
    whereClause.partnerId = userId;
  } else if (role !== "ADMIN") {
    whereClause.setterId = userId;
  }

  const parcels = await prisma.parcel.findMany({
    where: whereClause,
    include: {
      setter: {
        select: { id: true, name: true },
      },
      partner: {
        select: { id: true, name: true },
      },
      visits: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          stage: true,
          outcome: true,
          setter: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  return NextResponse.json(parcels);
}
