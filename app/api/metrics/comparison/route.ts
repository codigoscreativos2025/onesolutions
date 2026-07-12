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

  try {
    // Obtener estadísticas del usuario actual
    const myDoorsKnocked = await prisma.visit.count({
      where: { setterId: currentUserId },
    });

    const myLeadsGenerated = await prisma.visit.count({
      where: {
        setterId: currentUserId,
        stage: { in: ['PROPOSAL_ACCEPTED', 'CLOSED'] },
      },
    });

    const myProjectsClosed = await prisma.visit.count({
      where: {
        closerId: currentUserId,
        stage: 'CLOSED',
      },
    });

    // Obtener rankings de puertas tocadas (setters)
    const setters = await prisma.user.findMany({
      where: { role: 'SETTER' },
      select: { id: true, name: true },
    });

    const doorsRanking = await Promise.all(
      setters.map(async (setter) => {
        const doorsKnocked = await prisma.visit.count({
          where: { setterId: setter.id },
        });
        const leadsGenerated = await prisma.visit.count({
          where: {
            setterId: setter.id,
            stage: { in: ['PROPOSAL_ACCEPTED', 'CLOSED'] },
          },
        });
        return {
          id: setter.id,
          name: setter.name,
          doorsKnocked,
          leadsGenerated,
          projectsClosed: 0,
        };
      })
    );

    doorsRanking.sort((a, b) => b.doorsKnocked - a.doorsKnocked);

    // Obtener rankings de leads generados (setters)
    const leadsRanking = [...doorsRanking].sort((a, b) => b.leadsGenerated - a.leadsGenerated);

    // Obtener rankings de proyectos cerrados (closers)
    const closers = await prisma.user.findMany({
      where: { role: 'CLOSER' },
      select: { id: true, name: true },
    });

    const projectsRanking = await Promise.all(
      closers.map(async (closer) => {
        const projectsClosed = await prisma.visit.count({
          where: {
            closerId: closer.id,
            stage: 'CLOSED',
          },
        });
        return {
          id: closer.id,
          name: closer.name,
          doorsKnocked: 0,
          leadsGenerated: 0,
          projectsClosed,
        };
      })
    );

    projectsRanking.sort((a, b) => b.projectsClosed - a.projectsClosed);

    return NextResponse.json({
      myStats: {
        doorsKnocked: myDoorsKnocked,
        leadsGenerated: myLeadsGenerated,
        projectsClosed: myProjectsClosed,
      },
      rankings: {
        doorsKnocked: doorsRanking,
        leadsGenerated: leadsRanking,
        projectsClosed: projectsRanking,
      },
    });
  } catch (error) {
    console.error('Error fetching comparison data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
