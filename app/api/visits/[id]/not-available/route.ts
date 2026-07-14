import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { tagIds, notes } = body;

  try {
    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      await prisma.visitNotAvailableTag.deleteMany({
        where: { visitId: parseInt(id) },
      });

      await prisma.visitNotAvailableTag.createMany({
        data: tagIds.map((tagId: number) => ({
          visitId: parseInt(id),
          tagId,
          notes: notes || null,
        })),
      });
    }

    const visit = await prisma.visit.update({
      where: { id: parseInt(id) },
      data: {
        stage: "NOT_AVAILABLE",
        outcome: "NOT_AVAILABLE",
        notes,
      },
    });

    return NextResponse.json(visit);
  } catch {
    return NextResponse.json({ error: "Visit not found" }, { status: 404 });
  }
}
