import { NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authRes = await verifyApiAuth();
  if (authRes.error) {
    return NextResponse.json({ error: authRes.error }, { status: authRes.status });
  }
  
  const { searchParams } = new URL(request.url);
  const parcelId = searchParams.get('parcelId');
  if (!parcelId) return NextResponse.json({ note: "" });

  try {
    const parcel = await prisma.parcel.findFirst({
      where: { OR: [{ id: parcelId }, { externalId: parcelId }] },
      select: { parcelNotes: true }
    });
    
    return NextResponse.json({ note: parcel?.parcelNotes || "" });
  } catch (error) {
    console.error("Error fetching map notes:", error);
    return NextResponse.json({ note: "" });
  }
}

export async function POST(request: Request) {
  const authRes = await verifyApiAuth();
  if (authRes.error) {
    return NextResponse.json({ error: authRes.error }, { status: authRes.status });
  }
  
  try {
    const { parcelId, note } = await request.json();
    if (!parcelId) return NextResponse.json({ error: "Missing parcelId" }, { status: 400 });
    
    const existing = await prisma.parcel.findFirst({
      where: { OR: [{ id: parcelId }, { externalId: parcelId }] }
    });
    const parcelKey = existing?.id || parcelId;

    await prisma.parcel.upsert({
      where: { id: parcelKey },
      update: {
        parcelNotes: note || null
      },
      create: {
        id: parcelKey,
        externalId: parcelId,
        address: "Sin dirección",
        geometry: JSON.stringify({ type: "Point", coordinates: [0, 0] }),
        parcelNotes: note || null,
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error saving map notes:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
