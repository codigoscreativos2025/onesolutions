import { verifyApiAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authRes = await verifyApiAuth();
  if (authRes.error) {
    return NextResponse.json({ error: authRes.error }, { status: authRes.status });
  }
  const session = authRes.session!;

  const { id } = await params;

  const parcel = await prisma.parcel.findFirst({
    where: { OR: [{ id }, { externalId: id }] },
    include: {
      setter: {
        select: { id: true, name: true },
      },
      visitHistory: true,
      visits: {
        orderBy: { createdAt: "desc" },
        include: {
          setter: {
            select: { id: true, name: true },
          },
          closer: {
            select: { id: true, name: true },
          },
          projects: {
            include: {
              projectType: { select: { id: true, name: true } },
            },
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

  const role = session.user.role;
  const userId = parseInt(session.user.id);
  
  if (role === 'SETTER' || role === 'SETTER_JR' || role === 'TRAINEE') {
    const isOwner = parcel.setterId === userId || 
                    parcel.visits?.some((v: any) => v.setterId === userId || v.closerId === userId) ||
                    parcel.visitHistory?.some((h: any) => h.setterId === userId);
    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (role === 'PARTNER') {
    if (parcel.partnerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Remove history/notes if Trainee didn't claim it? No, if isOwner is true, they claimed it or were assigned.

  return NextResponse.json(parcel);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authRes = await verifyApiAuth();
  if (authRes.error) {
    return NextResponse.json({ error: authRes.error }, { status: authRes.status });
  }
  const session = authRes.session!;

  const { id } = await params;
  const body = await request.json();
  const { partnerId, parcelTags, parcelNotes, visitedStatus, address: bodyAddress, geometry: bodyGeometry } = body;

  const parcel = await prisma.parcel.findUnique({ where: { id } });

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = parcel?.setterId === parseInt(session.user.id);
  const isSetterOrCloser = session.user.role === "SETTER" || session.user.role === "SETTER_JR" || session.user.role === "CLOSER";

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

  // Use upsert for Regrid parcels (may not exist in DB yet)
  const created = await prisma.parcel.upsert({
    where: { id },
    update: updateData,
    create: {
      id,
      ...updateData,
      address: bodyAddress || "Sin direccion",
      geometry: bodyGeometry || JSON.stringify({ type: "Polygon", coordinates: [] }),
      ...(isAdmin ? { partnerId: partnerId as number } : {}),
    },
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

  return NextResponse.json(created);
}
