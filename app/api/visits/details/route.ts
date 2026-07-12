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

    if (userId) {
      const uid = parseInt(userId);
      if (role === 'CLOSER' && userId === session.user.id) {
        whereClause.OR = [{ closerId: uid }, { setterId: uid }];
      } else {
        whereClause.setterId = uid;
      }
    } else if (role === 'SETTER') {
      whereClause.setterId = currentUserId;
    } else if (role === 'CLOSER') {
      whereClause.OR = [{ closerId: currentUserId }, { setterId: currentUserId }];
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
    if (type === 'doors' || type === 'parcels') {
      whereClause.stage = 'IN_PROGRESS';
    } else if (type === 'leads') {
      whereClause.stage = 'PROPOSAL_ACCEPTED';
    } else if (type === 'projects') {
      whereClause.stage = 'PROJECT';
    } else if (type === 'closed') {
      whereClause.stage = 'CLOSED';
    } else if (type === 'cancelled') {
      whereClause.stage = 'CANCELLED';
    } else if (type === 'objections') {
      whereClause.OR = [
        { outcome: 'OBJECTION' },
        { closerObjections: { some: {} } },
      ];
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
        closerObjections: {
          include: {
            closerObjection: {
              select: {
                name: true,
                color: true,
              },
            },
          },
        },
        bill: {
          select: {
            imageUrl: true,
            phone: true,
            clientName: true,
            clientEmail: true,
            notes: true,
            additionalFileUrl: true,
            additionalFileName: true,
          },
        },
        projects: {
          include: {
            projectType: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        projectDetails: true,
        slot: {
          select: {
            startAt: true,
            endAt: true,
          },
        },
        chatRoom: {
          select: { id: true },
        },
      },
    });

    return NextResponse.json(visits);
  } catch (error) {
    console.error('Error fetching visit details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
