import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== "SETTER" && role !== "CLOSER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const userId = parseInt(session.user.id);
  const body = await request.json();
  const { parcelTags, parcelNotes, address, ownerName, geometry, metadata } = body;

  try {
    let parcel = await prisma.parcel.findFirst({
      where: { OR: [{ id }, { externalId: id }] },
    });

    if (!parcel) {
      parcel = await prisma.parcel.create({
        data: {
          externalId: id,
          address: address || "Sin direccion",
          ownerName: ownerName || null,
          geometry: geometry || JSON.stringify({
            type: "Polygon",
            coordinates: [[[0, 0], [0, 0], [0, 0]]],
          }),
          metadata: metadata || null,
          parcelTags: parcelTags || null,
          parcelNotes: parcelNotes || null,
        },
      });
    } else {
      const updateData: Record<string, unknown> = {};
      if (parcelTags !== undefined) updateData.parcelTags = parcelTags;
      if (parcelNotes !== undefined) updateData.parcelNotes = parcelNotes;
      if (Object.keys(updateData).length > 0) {
        parcel = await prisma.parcel.update({
          where: { id: parcel.id },
          data: updateData,
        });
      }
    }

    await prisma.parcelVisitHistory.create({
      data: {
        parcelId: parcel.id,
        setterId: userId,
        visitedAt: new Date(),
        status: "DOOR_KNOCK",
        notes: parcelNotes || null,
      },
    });

    return NextResponse.json({ success: true, parcel });
  } catch (error) {
    console.error("Error saving activity:", error);
    return NextResponse.json(
      { error: "Failed to save activity" },
      { status: 500 }
    );
  }
}
