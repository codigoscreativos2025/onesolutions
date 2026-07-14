import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
export const dynamic = 'force-dynamic';

interface HistoryEntry {
  date: string;
  action: string;
  userName: string;
  details: string;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const visitId = parseInt(params.id);

    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      select: {
        id: true,
        stage: true,
        createdAt: true,
        completedAt: true,
        cancelledAt: true,
        parcelId: true,
        setter: { select: { id: true, name: true } },
        closer: { select: { id: true, name: true } },
        bill: { select: { id: true } },
        projectDetails: { select: { createdAt: true } },
        projects: {
          include: {
            projectType: { select: { name: true } },
          },
        },
      },
    });

    if (!visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    const visitHistory = await prisma.parcelVisitHistory.findMany({
      where: { parcelId: visit.parcelId },
      include: {
        setter: { select: { name: true } },
      },
      orderBy: { visitedAt: 'asc' },
    });

    const history: HistoryEntry[] = [];

    for (const h of visitHistory) {
      let action = 'Visita';
      if (h.status === 'MANUAL_LEAD') action = 'Lead manual';
      else if (h.status === 'NOT_AVAILABLE') action = 'No disponible';
      else if (h.status === 'OBJECTION') action = 'Objeción';

      history.push({
        date: h.visitedAt.toISOString(),
        action,
        userName: h.setter.name,
        details: h.notes || '',
      });
    }

    history.push({
      date: visit.createdAt.toISOString(),
      action: 'Lead creado',
      userName: visit.setter.name,
      details: visit.projects.length > 0
        ? visit.projects.map((p) => p.projectType.name).join(', ')
        : '',
    });

    if (visit.bill) {
      const projectNames = visit.projects.map((p) => p.projectType.name).join(', ');
      history.push({
        date: visit.createdAt.toISOString(),
        action: 'Propuesta aceptada',
        userName: visit.setter.name,
        details: projectNames ? `Seleccionó ${projectNames}` : '',
      });
    }

    if (visit.projectDetails) {
      history.push({
        date: visit.projectDetails.createdAt.toISOString(),
        action: 'Proyecto iniciado',
        userName: visit.closer?.name || visit.setter.name,
        details: 'Inició elaboración',
      });
    }

    if (visit.completedAt) {
      history.push({
        date: visit.completedAt.toISOString(),
        action: 'Cerrado',
        userName: visit.closer?.name || visit.setter.name,
        details: 'Proyecto completado',
      });
    }

    if (visit.cancelledAt) {
      history.push({
        date: visit.cancelledAt.toISOString(),
        action: 'Cancelado',
        userName: visit.closer?.name || visit.setter.name,
        details: 'Proyecto cancelado',
      });
    }

    history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching visit history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
