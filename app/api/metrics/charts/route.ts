import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '7d';
  const userId = searchParams.get('userId');
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');

  const currentUserId = parseInt(session.user.id);
  const role = session.user.role;

  try {
    // Calcular fechas según período
    const now = new Date();
    let startDate: Date;
    let endDate: Date | undefined;
    let groupBy: 'day' | 'week' | 'month';

    if (period === 'custom') {
      startDate = startDateParam ? new Date(startDateParam) : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = endDateParam ? new Date(endDateParam + 'T23:59:59.999Z') : undefined;
      groupBy = 'day';
    } else {
      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      groupBy = 'day';
    }

    // Obtener visitas en el período
    const dateFilter: Record<string, unknown> = { gte: startDate };
    if (endDate) {
      dateFilter.lte = endDate;
    }
    const whereClause: Record<string, unknown> = {
      createdAt: dateFilter,
    };

    if (userId) {
      whereClause.setterId = parseInt(userId);
    } else if (role === 'SETTER') {
      whereClause.setterId = currentUserId;
    }

    const visits = await prisma.visit.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
      include: {
        projects: {
          include: {
            projectType: true,
          },
        },
      },
    });

    // Agrupar datos por período
    const groupedData: { [key: string]: { doors: number; leads: number; closed: number; objections: number } } = {};

    visits.forEach((visit) => {
      const date = new Date(visit.createdAt);
      let key: string;

      if (groupBy === 'day') {
        key = `${date.getMonth() + 1}/${date.getDate()}`;
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
      } else {
        key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      }

      if (!groupedData[key]) {
        groupedData[key] = { doors: 0, leads: 0, closed: 0, objections: 0 };
      }

      groupedData[key].doors++;

      if (visit.stage === 'PROPOSAL_ACCEPTED' || visit.stage === 'CLOSED') {
        groupedData[key].leads++;
      }

      if (visit.stage === 'CLOSED') {
        groupedData[key].closed++;
      }

      if (visit.outcome === 'OBJECTION') {
        groupedData[key].objections++;
      }
    });

    // Convertir a arrays para Chart.js
    const labels = Object.keys(groupedData);
    const doorsKnocked = labels.map((label) => groupedData[label].doors);
    const leadsGenerated = labels.map((label) => groupedData[label].leads);
    const projectsClosed = labels.map((label) => groupedData[label].closed);
    const objections = labels.map((label) => groupedData[label].objections);

    // Obtener proyectos por tipo
    const visitDateFilter: Record<string, unknown> = { gte: startDate };
    if (endDate) {
      visitDateFilter.lte = endDate;
    }
    const projectTypesWhere: Record<string, unknown> = {
      visit: {
        createdAt: visitDateFilter,
      },
    };

    if (userId) {
      (projectTypesWhere.visit as Record<string, unknown>).setterId = parseInt(userId);
    } else if (role === 'SETTER') {
      (projectTypesWhere.visit as Record<string, unknown>).setterId = currentUserId;
    }

    const visitProjects = await prisma.visitProject.findMany({
      where: projectTypesWhere,
      include: {
        projectType: true,
      },
    });

    const projectTypeCounts: { [key: string]: number } = {};
    visitProjects.forEach((vp) => {
      const name = vp.projectType.name;
      projectTypeCounts[name] = (projectTypeCounts[name] || 0) + 1;
    });

    const projectTypes = Object.entries(projectTypeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      labels,
      doorsKnocked,
      leadsGenerated,
      projectsClosed,
      objections,
      projectTypes,
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
