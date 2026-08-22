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

  const { id: rawId } = await params;
  const parcelId = decodeURIComponent(rawId);
  const { searchParams } = new URL(request.url);
  const dateFilter = searchParams.get("date");

  try {
    const parcel = await prisma.parcel.findFirst({
      where: { OR: [{ id: parcelId }, { externalId: parcelId }] },
      include: {
        visits: {
          include: {
            notes: {
              include: { user: { select: { id: true, name: true, role: true } } }
            }
          }
        }
      }
    });

    if (!parcel) {
      return NextResponse.json([]);
    }

    let allNotes: any[] = [];

    if (parcel.visits) {
      parcel.visits.forEach((v: any) => {
        if (v.notes) {
          allNotes = allNotes.concat(v.notes);
        }
      });
    }

    if (parcel.parcelNotes) {
      try {
        const parsed = JSON.parse(parcel.parcelNotes);
        if (Array.isArray(parsed)) {
          allNotes = allNotes.concat(parsed);
        } else {
          throw new Error("Not an array");
        }
      } catch (e) {
        allNotes.push({
          id: -1,
          content: parcel.parcelNotes,
          createdAt: (parcel as any).createdAt || new Date(),
          user: { id: 0, name: "Nota de Mapa", role: "" }
        });
      }
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter + "T00:00:00");
      const nextDay = new Date(dateFilter + "T23:59:59.999");
      allNotes = allNotes.filter(n => {
        const d = new Date(n.createdAt);
        return d >= filterDate && d <= nextDay;
      });
    }

    allNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(allNotes);
  } catch (error) {
    console.error("Error fetching parcel notes:", error);
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

  const { id: rawId } = await params;
  const parcelId = decodeURIComponent(rawId);
  const userId = parseInt(session.user.id);

  try {
    const body = await request.json();
    const { content, visitId, parcelData } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    if (visitId) {
      const note = await prisma.visitNote.create({
        data: {
          visitId: parseInt(visitId),
          userId,
          content: content.trim(),
        },
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
      });
      return NextResponse.json(note);
    } else {
      const parcel = await prisma.parcel.findFirst({
        where: { OR: [{ id: parcelId }, { externalId: parcelId }] }
      });
      
      const newNote = {
        id: Date.now(),
        content: content.trim(),
        createdAt: new Date().toISOString(),
        user: { id: userId, name: session.user.name || "Usuario", role: session.user.role || "" },
        isParcelNote: true
      };

      let currentNotes = [];
      if (parcel?.parcelNotes) {
        try {
          currentNotes = JSON.parse(parcel.parcelNotes);
          if (!Array.isArray(currentNotes)) {
             currentNotes = [{
               id: -1,
               content: parcel.parcelNotes,
               createdAt: (parcel as any).createdAt || new Date(),
               user: { id: 0, name: "Nota de Mapa", role: "" }
             }];
          }
        } catch {
          currentNotes = [{
            id: -1,
            content: parcel.parcelNotes,
            createdAt: (parcel as any).createdAt || new Date(),
            user: { id: 0, name: "Nota de Mapa", role: "" }
          }];
        }
      }

      currentNotes.push(newNote);

      await prisma.parcel.upsert({
        where: { id: parcel?.id || parcelId },
        update: { parcelNotes: JSON.stringify(currentNotes) },
        create: {
          id: parcel?.id || parcelId,
          externalId: parcelData?.externalId || parcelId,
          address: parcelData?.address || "Sin direccion",
          geometry: parcelData?.geometry || JSON.stringify({ type: "Point", coordinates: [0, 0] }),
          parcelNotes: JSON.stringify(currentNotes)
        }
      });

      return NextResponse.json(newNote);
    }
  } catch (error) {
    console.error("Error creating parcel note:", error);
    return NextResponse.json({ error: "Error creating note" }, { status: 500 });
  }
}


