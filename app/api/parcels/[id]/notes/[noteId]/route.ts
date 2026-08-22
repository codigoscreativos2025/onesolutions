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

  const { id: rawId, noteId: rawNoteId } = await params;
  const parcelId = decodeURIComponent(rawId);
  const noteId = parseInt(rawNoteId);
  
  if (isNaN(noteId)) {
    return NextResponse.json({ error: "Invalid note ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Check if it is a VisitNote (real ID from DB usually < 1000000000)
    // ParcelNotes have fake timestamp IDs (e.g., 1700000000000)
    if (noteId < 1000000000) {
      const note = await prisma.visitNote.update({
        where: { id: noteId },
        data: { content: content.trim() },
        include: { user: { select: { id: true, name: true, role: true } } },
      });
      return NextResponse.json(note);
    } else {
      const parcel = await prisma.parcel.findFirst({
        where: { OR: [{ id: parcelId }, { externalId: parcelId }] }
      });
      if (parcel?.parcelNotes) {
        let currentNotes = JSON.parse(parcel.parcelNotes);
        if (Array.isArray(currentNotes)) {
          const idx = currentNotes.findIndex((n: any) => n.id === noteId);
          if (idx !== -1) {
            currentNotes[idx].content = content.trim();
            await prisma.parcel.update({
              where: { id: parcel.id },
              data: { parcelNotes: JSON.stringify(currentNotes) }
            });
            return NextResponse.json(currentNotes[idx]);
          }
        }
      }
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error updating parcel note:", error);
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

  const { id: rawId, noteId: rawNoteId } = await params;
  const parcelId = decodeURIComponent(rawId);
  const noteId = parseInt(rawNoteId);
  
  if (isNaN(noteId)) {
    return NextResponse.json({ error: "Invalid note ID" }, { status: 400 });
  }

  try {
    if (noteId < 1000000000) {
      await prisma.visitNote.delete({
        where: { id: noteId },
      });
      return NextResponse.json({ success: true });
    } else {
      const parcel = await prisma.parcel.findFirst({
        where: { OR: [{ id: parcelId }, { externalId: parcelId }] }
      });
      if (parcel?.parcelNotes) {
        let currentNotes = JSON.parse(parcel.parcelNotes);
        if (Array.isArray(currentNotes)) {
          currentNotes = currentNotes.filter((n: any) => n.id !== noteId);
          await prisma.parcel.update({
            where: { id: parcel.id },
            data: { parcelNotes: JSON.stringify(currentNotes) }
          });
          return NextResponse.json({ success: true });
        }
      }
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error deleting parcel note:", error);
    return NextResponse.json({ error: "Error deleting note" }, { status: 500 });
  }
}

