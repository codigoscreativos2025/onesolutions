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
          objections: {
            include: {
              objection: true,
            },
          },
          closerObjections: {
            include: {
              closerObjection: true,
            },
          },
          notAvailableTags: {
            include: {
              tag: true,
            },
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
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { partnerId, parcelTags, parcelNotes, visitedStatus } = body;

  const parcel = await prisma.parcel.findUnique({ where: { id } });
  if (!parcel) {
    return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
  }

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = parcel.setterId === parseInt(session.user.id);
  const isSetterOrCloser = session.user.role === "SETTER" || session.user.role === "CLOSER";

  const updateData: Record<string, unknown> = {};

  if (isAdmin && partnerId !== undefined) {
    updateData.partnerId = partnerId;
  }

  const isTagOrNotesUpdate = parcelTags !== undefined || parcelNotes !== undefined;
  if (isTagOrNotesUpdate && (isAdmin || isOwner || isSetterOrCloser)) {
    if (parcelTags !== undefined) updateData.parcelTags = parcelTags;
    if (parcelNotes !== undefined) updateData.parcelNotes = parcelNotes;
  } else if (isTagOrNotesUpdate) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const exists = await prisma.parcel.findUnique({ where: { id } });
  if (!exists) {
    // Create parcel if it doesn't exist (Regrid parcel first claim)
    const created = await prisma.parcel.create({
      data: { id, ...updateData },
      include: {
        setter: { select: { id: true, name: true } },
        partner: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(created);
  }

  const updated = await prisma.parcel.update({
    where: { id },
    data: updateData,
    include: {
      setter: { select: { id: true, name: true } },
      partner: { select: { id: true, name: true } },
    },
  });

  if (visitedStatus && (isAdmin || isOwner || isSetterOrCloser)) {
    await prisma.parcelVisitHistory.create({
      data: {
        parcelId: id,
        setterId: parseInt(session.user.id),
        visitedAt: new Date(),
        status: visitedStatus,
        notes: parcelNotes || null,
      },
    });
  }

  return NextResponse.json(updated);
}
