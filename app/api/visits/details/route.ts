import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const userId = searchParams.get('userId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const currentUserId = parseInt(session.user.id);
  const role = session.user.role;

  try {
    const whereClause: Record<string, unknown> = {};

    // Filtrar por usuario si se proporciona
    if (userId) {
      whereClause.setterId = parseInt(userId);
    } else if (role === 'SETTER') {
      whereClause.setterId = currentUserId;
    } else if (role === 'CLOSER') {
      whereClause.closerId = currentUserId;
    }

    // Filtrar por fecha si se proporciona
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        (whereClause.createdAt as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        (whereClause.createdAt as Record<string, unknown>).lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    // Filtrar según el tipo de métrica
    if (type === 'doors') {
      // Todas las visitas (puertas tocadas)
    } else if (type === 'leads') {
      // Solo visitas que generaron leads (PROPOSAL_ACCEPTED o CLOSED)
      whereClause.stage = { in: ['PROPOSAL_ACCEPTED', 'CLOSED'] };
    } else if (type === 'projects') {
      // Solo proyectos cerrados
      whereClause.stage = 'CLOSED';
    } else if (type === 'objections') {
      // Solo visitas con objeciones
      whereClause.outcome = 'OBJECTION';
    }

    const visits = await prisma.visit.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        parcel: {
          select: {
            id: true,
            address: true,
          },
        },
        setter: {
          select: {
            id: true,
            name: true,
          },
        },
        closer: {
          select: {
            id: true,
            name: true,
          },
        },
        objections: {
          include: {
            objection: {
              select: {
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(visits);
  } catch (error) {
    console.error('Error fetching visit details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
