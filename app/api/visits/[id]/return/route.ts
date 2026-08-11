import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const visitId = parseInt(id);

  try {
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        parcel: { select: { address: true } },
      },
    });

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    let existing: Record<string, unknown> = {};
    if (visit.contractFields) {
      try { existing = JSON.parse(visit.contractFields); } catch {}
    }
    delete existing.closeRequestedAt;
    existing.returnedAt = new Date().toISOString();

    await prisma.visit.update({
      where: { id: visitId },
      data: { contractFields: JSON.stringify(existing) },
    });

    const userIdsToNotify = new Set<number>();
    if (visit.setterId) userIdsToNotify.add(visit.setterId);
    if (visit.closerId) userIdsToNotify.add(visit.closerId);

    const address = visit.parcel?.address || "el proyecto";

    if (userIdsToNotify.size > 0) {
      await prisma.notification.createMany({
        data: Array.from(userIdsToNotify).map((uId) => ({
          userId: uId,
          title: "Proyecto devuelto",
          body: `El proyecto en ${address} ha sido devuelto por un administrador para su edición.`,
          link: `/lead/${visitId}`,
        })),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error returning project:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
