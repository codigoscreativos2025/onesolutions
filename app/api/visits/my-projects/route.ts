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
  const filter = searchParams.get('filter');

  const userId = parseInt(session.user.id);
  const role = session.user.role;

  if (role !== 'CLOSER' && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const whereClause: Record<string, unknown> = role === 'ADMIN' ? {} : { closerId: userId };

    if (filter && filter !== 'all') {
      if (filter === 'leads') {
        whereClause.stage = 'PROPOSAL_ACCEPTED';
      } else if (filter === 'project') {
        whereClause.stage = 'PROJECT';
      } else if (filter === 'closed') {
        whereClause.stage = 'CLOSED';
      } else if (filter === 'cancelled') {
        whereClause.stage = 'CANCELLED';
      } else if (filter === 'objections') {
        whereClause.closerObjections = { some: {} };
      }
    } else {
      whereClause.stage = { in: ['PROPOSAL_ACCEPTED', 'PROJECT', 'CLOSED', 'CANCELLED'] };
    }

    const visits = await prisma.visit.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        parcel: {
          select: {
            id: true,
            address: true,
            ownerName: true,
          },
        },
        setter: {
          select: { id: true, name: true },
        },
        closer: {
          select: { id: true, name: true },
        },
        projects: {
          include: {
            projectType: {
              select: { name: true },
            },
          },
        },
        projectDetails: true,
        objections: {
          include: {
            objection: {
              select: { name: true, color: true },
            },
          },
        },
        closerObjections: {
          include: {
            closerObjection: {
              select: { name: true, color: true },
            },
          },
        },
        chatRoom: {
          select: { id: true },
        },
        bill: {
          select: {
            imageUrl: true,
            clientName: true,
            phone: true,
            clientEmail: true,
            additionalFileUrl: true,
            additionalFileName: true,
          },
        },
      },
    });

    return NextResponse.json(visits);
  } catch (error) {
    console.error('Error fetching my projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
