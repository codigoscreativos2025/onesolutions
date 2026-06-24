import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parcels = await prisma.parcel.findMany({
    include: {
      setter: {
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
