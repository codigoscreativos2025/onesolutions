import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parcelId = searchParams.get("parcelId");

  if (!parcelId) {
    return NextResponse.json(
      { error: "parcelId is required" },
      { status: 400 }
    );
  }

  const visit = await prisma.visit.findFirst({
    where: {
      parcelId,
      stage: {
        not: "CLOSED",
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      parcel: true,
      setter: {
        select: { id: true, name: true },
      },
      closer: {
        select: { id: true, name: true },
      },
      objections: {
        include: {
          objection: true,
        },
      },
      bill: true,
      slot: true,
    },
  });

  if (!visit) {
    return NextResponse.json({ error: "Visit not found" }, { status: 404 });
  }

  return NextResponse.json(visit);
}
