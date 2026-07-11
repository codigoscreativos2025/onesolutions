import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = parseInt(params.userId);

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        phone: true,
        avatarUrl: true,
        closer: {
          select: { id: true, name: true },
        },
        setters: {
          select: { id: true, name: true },
        },
        userBadges: {
          include: {
            badge: {
              select: {
                id: true,
                name: true,
                icon: true,
                color: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Obtener estadísticas del usuario
    const stats = await prisma.visit.aggregate({
      where: {
        OR: [
          { setterId: userId },
          { closerId: userId },
        ],
      },
      _count: {
        id: true,
      },
    });

    const doorsKnocked = await prisma.visit.count({
      where: { setterId: userId },
    });

    const leadsGenerated = await prisma.visit.count({
      where: {
        setterId: userId,
        stage: { in: ['PROPOSAL_ACCEPTED', 'CLOSED'] },
      },
    });

    const projectsClosed = await prisma.visit.count({
      where: {
        closerId: userId,
        stage: 'CLOSED',
      },
    });

    // Obtener mejor mes
    const visitsByMonth = await prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
      SELECT 
        strftime('%Y-%m', createdAt) as month,
        COUNT(*) as count
      FROM Visit
      WHERE setterId = ${userId} OR closerId = ${userId}
      GROUP BY month
      ORDER BY count DESC
      LIMIT 1
    `;

    const bestMonth = visitsByMonth[0] 
      ? { month: visitsByMonth[0].month, count: Number(visitsByMonth[0].count) }
      : null;

    return NextResponse.json({
      ...user,
      stats: {
        totalVisits: stats._count.id,
        doorsKnocked,
        leadsGenerated,
        projectsClosed,
      },
      bestMonth,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
