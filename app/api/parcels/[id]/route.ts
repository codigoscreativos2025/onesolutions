import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const parcel = await prisma.parcel.findUnique({
    where: { id },
    include: {
      setter: {
        select: { id: true, name: true },
      },
      visits: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          setter: {
            select: { id: true, name: true },
          },
          closer: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!parcel) {
    return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
  }

  return NextResponse.json(parcel);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { partnerId } = body;

  const updateData: Record<string, unknown> = {};
  if (partnerId !== undefined) {
    updateData.partnerId = partnerId;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const parcel = await prisma.parcel.update({
    where: { id },
    data: updateData,
    include: {
      setter: { select: { id: true, name: true } },
      partner: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(parcel);
}
