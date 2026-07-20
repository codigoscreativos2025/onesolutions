import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const visitId = parseInt(id);
  const userId = parseInt(session.user.id);
  const role = session.user.role;

  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    include: {
      parcel: { select: { address: true } },
    },
  });

  if (!visit) {
    return NextResponse.json({ error: "Visit not found" }, { status: 404 });
  }

  if (visit.stage !== "CLOSED") {
    return NextResponse.json(
      { error: "Only closed visits can be finalized" },
      { status: 400 }
    );
  }

  if (visit.finalizedAt) {
    return NextResponse.json(
      { error: "Visit is already finalized" },
      { status: 400 }
    );
  }

  if (role !== "ADMIN" && visit.closerId !== userId) {
    return NextResponse.json(
      { error: "Only admin or the visit's closer can finalize" },
      { status: 403 }
    );
  }

  const updated = await prisma.visit.update({
    where: { id: visitId },
    data: { finalizedAt: new Date() },
    include: {
      parcel: {
        select: { id: true, address: true, ownerName: true },
      },
      setter: { select: { id: true, name: true } },
      closer: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(updated);
}
