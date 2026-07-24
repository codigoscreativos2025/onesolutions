import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
export const dynamic = 'force-dynamic';

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
  const filter = searchParams.get('filter');

  const currentUserId = parseInt(session.user.id);
  const role = session.user.role;

  try {
    const whereClause: Record<string, unknown> = {};

    if (filter === 'scheduled') {
      whereClause.scheduledAt = { not: null };
      whereClause.completedAt = null;
    }

    if (userId) {
      const uid = parseInt(userId);
      if (filter === 'scheduled') {
        whereClause.OR = [{ setterId: uid }, { closerId: uid }];
      } else if (role === 'CLOSER' && userId === session.user.id) {
        whereClause.OR = [{ closerId: uid }, { setterId: uid }];
      } else {
        whereClause.setterId = uid;
      }
    } else if (role === 'SETTER') {
      if (!filter) {
        whereClause.setterId = currentUserId;
      }
    } else if (role === 'CLOSER') {
      if (!filter) {
        whereClause.OR = [{ closerId: currentUserId }, { setterId: currentUserId }];
      }
    }

    if (startDate || endDate) {
      if (filter === 'scheduled') {
        whereClause.scheduledAt = {
          ...(whereClause.scheduledAt as Record<string, unknown> || {}),
        };
        if (startDate) {
          (whereClause.scheduledAt as Record<string, unknown>).gte = new Date(startDate);
        }
        if (endDate) {
          (whereClause.scheduledAt as Record<string, unknown>).lte = new Date(endDate + 'T23:59:59.999Z');
        }
      } else {
        whereClause.createdAt = {};
        if (startDate) {
          (whereClause.createdAt as Record<string, unknown>).gte = new Date(startDate);
        }
        if (endDate) {
          (whereClause.createdAt as Record<string, unknown>).lte = new Date(endDate + 'T23:59:59.999Z');
        }
      }
    }

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
      orderBy: filter === 'scheduled' ? { scheduledAt: 'asc' } : { createdAt: 'desc' },
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
