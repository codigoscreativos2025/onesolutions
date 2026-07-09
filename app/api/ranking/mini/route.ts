import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Obtener todos los usuarios con sus métricas
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['SETTER', 'CLOSER'],
        },
      },
      include: {
        visitsAsSetter: {
          select: {
            id: true,
            stage: true,
            outcome: true,
          },
        },
        visitsAsCloser: {
          where: {
            stage: 'CLOSED',
          },
          select: {
            id: true,
          },
        },
        userBadges: {
          include: {
            badge: {
              select: {
                id: true,
                name: true,
                icon: true,
              },
            },
          },
        },
      },
    });

    // Calcular métricas y score para cada usuario
    const ranking = users.map((user) => {
      const doorsKnocked = user.visitsAsSetter.length;
      const leadsGenerated = user.visitsAsSetter.filter(
        (v) => v.stage === 'PROPOSAL_ACCEPTED' || v.stage === 'CLOSED'
      ).length;
      const projectsClosed = user.visitsAsCloser.length;

      // Calcular score combinado (pesos ajustables)
      const score = doorsKnocked * 1 + leadsGenerated * 3 + projectsClosed * 5;

      return {
        id: user.id,
        name: user.name,
        role: user.role,
        doorsKnocked,
        leadsGenerated,
        projectsClosed,
        score,
        badges: user.userBadges.map((ub) => ub.badge),
      };
    });

    // Ordenar por score descendente
    ranking.sort((a, b) => b.score - a.score);

    return NextResponse.json(ranking);
  } catch (error) {
    console.error('Error fetching mini ranking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
