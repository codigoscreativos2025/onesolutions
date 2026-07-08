import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = parseInt(params.userId);

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
    const visitsByMonth = await prisma.$queryRaw<Array<{ month: string; count: number }>>`
      SELECT 
        strftime('%Y-%m', "createdAt") as month,
        COUNT(*) as count
      FROM Visit
      WHERE setterId = ${userId} OR closerId = ${userId}
      GROUP BY month
      ORDER BY count DESC
      LIMIT 1
    `;

    return NextResponse.json({
      ...user,
      stats: {
        totalVisits: stats._count.id,
        doorsKnocked,
        leadsGenerated,
        projectsClosed,
      },
      bestMonth: visitsByMonth[0] || null,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
