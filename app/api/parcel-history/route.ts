import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);

  try {
    const body = await request.json();
    const { parcelId, status, notes } = body;

    if (!parcelId || !status) {
      return NextResponse.json({ error: 'parcelId and status are required' }, { status: 400 });
    }

    // Registrar en el historial
    const history = await prisma.parcelVisitHistory.create({
      data: {
        parcelId,
        setterId: userId,
        visitedAt: new Date(),
        status,
        notes: notes || null,
      },
    });

    // Actualizar lastActivityAt de la parcela
    await prisma.parcel.update({
      where: { id: parcelId },
      data: {
        lastActivityAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, history });
  } catch (error) {
    console.error('Error creating parcel visit history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parcelId = searchParams.get('parcelId');

  if (!parcelId) {
    return NextResponse.json({ error: 'parcelId is required' }, { status: 400 });
  }

  try {
    const history = await prisma.parcelVisitHistory.findMany({
      where: { parcelId },
      orderBy: { visitedAt: 'desc' },
      include: {
        setter: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching parcel visit history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
