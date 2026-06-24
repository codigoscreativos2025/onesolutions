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
  const { scheduledAt, notes } = body;

  if (!scheduledAt) {
    return NextResponse.json(
      { error: "scheduledAt is required" },
      { status: 400 }
    );
  }

  try {
    const visit = await prisma.visit.update({
      where: { id: parseInt(id) },
      data: {
        stage: "NOT_AVAILABLE",
        outcome: "NOT_AVAILABLE",
        scheduledAt: new Date(scheduledAt),
        notes,
      },
    });

    return NextResponse.json(visit);
  } catch {
    return NextResponse.json({ error: "Visit not found" }, { status: 404 });
  }
}
