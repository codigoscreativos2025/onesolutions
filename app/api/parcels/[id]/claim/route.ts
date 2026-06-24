import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = parseInt(session.user.id);

  const parcel = await prisma.parcel.findUnique({
    where: { id },
  });

  if (!parcel) {
    return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
  }

  if (parcel.status !== "AVAILABLE") {
    return NextResponse.json(
      { error: "Parcel already claimed" },
      { status: 409 }
    );
  }

  const updated = await prisma.parcel.update({
    where: { id },
    data: {
      status: "LEAD",
      setterId: userId,
    },
  });

  await prisma.visit.create({
    data: {
      parcelId: id,
      setterId: userId,
      stage: "IN_PROGRESS",
    },
  });

  return NextResponse.json(updated);
}
