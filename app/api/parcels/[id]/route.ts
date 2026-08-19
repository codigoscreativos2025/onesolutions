import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gisGetByExternalId, isGisExternalId } from "@/lib/gis";
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

  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);

  const parcel = await prisma.parcel.findFirst({
    where: { OR: [{ id }, { externalId: id }] },
    include: {
      setter: {
        select: { id: true, name: true, role: true },
      },
      visits: {
        orderBy: { createdAt: "desc" },
        include: {
          setter: {
            select: { id: true, name: true, role: true },
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

  if (parcel) {
    return NextResponse.json(parcel);
  }

  // Fallback: query GIS provider for external ids like "provider:parcelId"
  if (isGisExternalId(id)) {
    try {
      const gisParcel = await gisGetByExternalId(id);
      if (gisParcel) {
        return NextResponse.json({
          id: id,
          externalId: gisParcel.externalId || gisParcel.id,
          address: gisParcel.address,
          ownerName: gisParcel.ownerName,
          city: gisParcel.city,
          state: gisParcel.state,
          zipCode: gisParcel.zipCode,
          ownerOccupied: gisParcel.ownerOccupied,
          geometry: gisParcel.geometry,
          status: "AVAILABLE",
          parcelTags: null,
          parcelNotes: null,
          setter: null,
          visits: [],
        });
      }
    } catch (err) {
      console.error("GIS fallback error for", id, err);
    }
  }

  return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const body = await request.json();
  const { partnerId, parcelTags, parcelNotes, visitedStatus, address: bodyAddress, geometry: bodyGeometry, ownerName: bodyOwnerName, metadata: bodyMetadata, externalId: bodyExternalId } = body;

  const parcel = await prisma.parcel.findFirst({
    where: { OR: [{ id }, { externalId: id }] },
  });

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = parcel?.setterId === parseInt(session.user.id);
  const isSetterOrCloser = session.user.role === "SETTER" || session.user.role === "SETTER_JR" || session.user.role === "CLOSER" || session.user.role === "TRAINEE";

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

  const parcelKey = parcel?.id || id;

  try {
    const created = await prisma.parcel.upsert({
      where: { id: parcelKey },
      update: updateData,
      create: {
        id: parcelKey,
        externalId: bodyExternalId || parcel?.externalId || id,
        ...updateData,
        address: bodyAddress || parcel?.address || "Sin direccion",
        ownerName: bodyOwnerName || parcel?.ownerName || null,
        geometry: bodyGeometry || parcel?.geometry || JSON.stringify({ type: "Polygon", coordinates: [] }),
        metadata: bodyMetadata || parcel?.metadata || null,
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
          parcelId: created.id,
          setterId: parseInt(session.user.id),
          visitedAt: new Date(),
          status: visitedStatus,
          notes: parcelNotes || null,
        },
      });
    }

    return NextResponse.json(created);
  } catch (err) {
    console.error("PATCH parcel upsert error:", err);
    return NextResponse.json({ error: "Failed to update parcel" }, { status: 500 });
  }
}
