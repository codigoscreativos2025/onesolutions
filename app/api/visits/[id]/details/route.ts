import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const visitId = searchParams.get('visitId');

  if (!visitId) {
    return NextResponse.json({ error: 'visitId is required' }, { status: 400 });
  }

  const userId = parseInt(session.user.id);
  const role = session.user.role;

  try {
    const visit = await prisma.visit.findUnique({
      where: { id: parseInt(visitId) },
      include: {
        parcel: {
          select: {
            id: true,
            address: true,
            ownerName: true,
            metadata: true,
          },
        },
        setter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        closer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bill: true,
        projectDetails: true,
        projects: {
          include: {
            projectType: true,
          },
        },
        objections: {
          include: {
            objection: true,
          },
        },
        closerObjections: {
          include: {
            closerObjection: true,
          },
        },
      },
    });

    if (!visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    // Verificar permisos
    const hasAccess =
      role === 'ADMIN' ||
      visit.setterId === userId ||
      visit.closerId === userId;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(visit);
  } catch (error) {
    console.error('Error fetching visit details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
