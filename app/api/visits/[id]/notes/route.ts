import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const visitId = parseInt(id);
  const { searchParams } = new URL(request.url);
  const dateFilter = searchParams.get("date");

  try {
    const whereClause: Record<string, unknown> = { visitId };

    if (dateFilter) {
      const filterDate = new Date(dateFilter + "T00:00:00");
      const nextDay = new Date(dateFilter + "T23:59:59.999");
      whereClause.createdAt = { gte: filterDate, lte: nextDay };
    }

    const notes = await prisma.visitNote.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching visit notes:", error);
    return NextResponse.json({ error: "Error fetching notes" }, { status: 500 });
  }
}

export async function POST(
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

  try {
    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const note = await prisma.visitNote.create({
      data: {
        visitId,
        userId,
        content: content.trim(),
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error creating visit note:", error);
    return NextResponse.json({ error: "Error creating note" }, { status: 500 });
  }
}
