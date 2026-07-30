import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const currentUserId = parseInt(session.user.id);
  const role = session.user.role;

  try {
    const whereClause: Record<string, unknown> = {};

    if (role === 'SETTER' || role === 'SETTER_JR') {
      whereClause.setterId = currentUserId;
    } else if (role === 'CLOSER') {
      const setterIds = await prisma.user.findMany({
        where: { closerId: currentUserId },
        select: { id: true },
      });
      const ids = setterIds.map((s) => s.id);
      whereClause.OR = [
        { closerId: currentUserId },
        { setterId: { in: [currentUserId, ...ids] } },
      ];
    } else if (role === 'PARTNER') {
      whereClause.parcel = { partnerId: currentUserId };
    } else if (role === 'PARTNER') {
      whereClause.parcel = { partnerId: currentUserId };
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
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    const grouped: Record<string, typeof visits> = {
      IN_PROGRESS: [],
      PROPOSAL_ACCEPTED: [],
      PROJECT: [],
      CLOSED: [],
      CANCELLED: [],
    };

    for (const v of visits) {
      if (v.stage in grouped) {
        grouped[v.stage].push(v);
      }
    }

    return NextResponse.json(grouped);
  } catch (error) {
    console.error('Error fetching kanban data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
