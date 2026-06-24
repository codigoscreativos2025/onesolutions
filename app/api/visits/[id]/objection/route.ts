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
  const { objectionIds, notes } = body;

  if (!objectionIds || objectionIds.length === 0) {
    return NextResponse.json(
      { error: "objectionIds is required" },
      { status: 400 }
    );
  }

  try {
    await prisma.visitObjection.deleteMany({
      where: { visitId: parseInt(id) },
    });

    await prisma.visitObjection.createMany({
      data: objectionIds.map((objectionId: number) => ({
        visitId: parseInt(id),
        objectionId,
        notes,
      })),
    });

    const visit = await prisma.visit.update({
      where: { id: parseInt(id) },
      data: {
        stage: "OBJECTION",
        outcome: "OBJECTION",
        notes,
      },
    });

    return NextResponse.json(visit);
  } catch {
    return NextResponse.json({ error: "Visit not found" }, { status: 404 });
  }
}
