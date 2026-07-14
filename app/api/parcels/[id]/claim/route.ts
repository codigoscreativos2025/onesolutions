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

  const { id } = await params;
  const userId = parseInt(session.user.id);
  const body = await request.json().catch(() => ({}));

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let parcel = await prisma.parcel.findFirst({
      where: { OR: [{ id }, { externalId: id }] },
    });

    if (!parcel) {
      parcel = await prisma.parcel.create({
        data: {
          externalId: id,
          address: body.address || "Sin dirección",
          ownerName: body.ownerName || null,
          geometry:
            body.geometry ||
            JSON.stringify({
              type: "Polygon",
              coordinates: [
                [
                  [0, 0],
                  [0, 0],
                  [0, 0],
                ],
              ],
            }),
          metadata: body.metadata || null,
        },
      });
    }

    if (parcel.status !== "AVAILABLE") {
      const existingSetter =
        parcel.setterId !== userId && parcel.setterId !== null;
      if (existingSetter) {
        return NextResponse.json(
          { error: "Parcel already claimed" },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.parcel.update({
      where: { id: parcel.id },
      data: {
        status: "LEAD",
        setterId: userId,
      },
      include: {
        setter: { select: { id: true, name: true } },
        visits: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            stage: true,
            outcome: true,
            setter: { select: { id: true, name: true } },
          },
        },
      },
    });

    await prisma.visit.create({
      data: {
        parcelId: parcel.id,
        setterId: userId,
        stage: "IN_PROGRESS",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error claiming parcel:", error);
    return NextResponse.json(
      { error: "Failed to claim parcel" },
      { status: 500 }
    );
  }
}
