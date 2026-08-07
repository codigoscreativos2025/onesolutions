import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; noteId: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, noteId } = await params;
  const visitId = parseInt(id);
  const noteIdNum = parseInt(noteId);
  const userId = parseInt(session.user.id);
  const isAdmin = session.user.role === "ADMIN";

  try {
    const note = await prisma.visitNote.findUnique({ where: { id: noteIdNum } });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (note.visitId !== visitId) {
      return NextResponse.json({ error: "Note does not belong to this visit" }, { status: 403 });
    }

    if (note.userId !== userId && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const updated = await prisma.visitNote.update({
      where: { id: noteIdNum },
      data: { content: content.trim() },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating visit note:", error);
    return NextResponse.json({ error: "Error updating note" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; noteId: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, noteId } = await params;
  const visitId = parseInt(id);
  const noteIdNum = parseInt(noteId);
  const userId = parseInt(session.user.id);
  const isAdmin = session.user.role === "ADMIN";

  try {
    const note = await prisma.visitNote.findUnique({ where: { id: noteIdNum } });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (note.visitId !== visitId) {
      return NextResponse.json({ error: "Note does not belong to this visit" }, { status: 403 });
    }

    if (note.userId !== userId && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.visitNote.delete({ where: { id: noteIdNum } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting visit note:", error);
    return NextResponse.json({ error: "Error deleting note" }, { status: 500 });
  }
}
