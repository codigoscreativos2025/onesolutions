import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");

  const userId = parseInt(session.user.id);
  const role = session.user.role;

  let whereClause: Record<string, unknown> = {};
  if (role === "SETTER") {
    whereClause = { setterId: userId };
  } else if (role === "CLOSER") {
    if (mode === "own") {
      whereClause = { closerId: userId };
    } else {
      whereClause = { OR: [{ closerId: userId }, { setterId: userId }] };
    }
  }

  const [
    doorsKnocked,
    parcels,
    setterObjections,
    leadsGenerated,
    closerLeads,
    projectsInProgress,
    projectsClosed,
    projectsCancelled,
    closerObjectionsCount,
    appointments,
  ] = await Promise.all([
    // Todas las visitas (stats)
    prisma.visit.count({ where: whereClause }),
    // Parcelas activas (IN_PROGRESS)
    prisma.visit.count({
      where: { ...whereClause, stage: "IN_PROGRESS" },
    }),
    // Objeciones de setter
    prisma.visitObjection.count({
      where: { visit: whereClause },
    }),
    // Leads generados (PROPOSAL_ACCEPTED para setter)
    prisma.visit.count({
      where: { ...whereClause, stage: "PROPOSAL_ACCEPTED" },
    }),
    // Leads del closer (PROPOSAL_ACCEPTED asignados como closer)
    prisma.visit.count({
      where: role === "CLOSER"
        ? { closerId: userId, stage: "PROPOSAL_ACCEPTED" }
        : { ...whereClause, stage: "PROPOSAL_ACCEPTED" },
    }),
    // Proyectos en elaboración (PROJECT)
    prisma.visit.count({
      where: { ...whereClause, stage: "PROJECT" },
    }),
    // Proyectos cerrados
    prisma.visit.count({
      where: { ...whereClause, stage: "CLOSED" },
    }),
    // Proyectos cancelados
    prisma.visit.count({
      where: { ...whereClause, stage: "CANCELLED" },
    }),
    // Objeciones de closer
    prisma.visitCloserObjection.count({
      where: { visit: whereClause },
    }),
    // Citas agendadas
    prisma.visit.count({
      where: {
        ...whereClause,
        stage: { in: ["PROPOSAL_ACCEPTED", "PROJECT", "CLOSED"] },
      },
    }),
  ]);

  const now = new Date();
  const [weeklyGoal, monthlyGoal] = await Promise.all([
    prisma.businessGoal.findFirst({
      where: {
        period: "weekly",
        startDate: { lte: now },
        endDate: { gte: now },
      },
    }),
    prisma.businessGoal.findFirst({
      where: {
        period: "monthly",
        startDate: { lte: now },
        endDate: { gte: now },
      },
    }),
  ]);

  const topDoorsKnocked: { id: number; name: string; count: number }[] = [];
  const topProspects: { id: number; name: string; count: number }[] = [];
  const topProjectsClosed: { id: number; name: string; count: number }[] = [];

  if (role === "ADMIN") {
    const doorsData = await prisma.visit.groupBy({
      by: ["setterId"],
      _count: { setterId: true },
      orderBy: { _count: { setterId: "desc" } },
      take: 10,
    });

    for (const item of doorsData) {
      const user = await prisma.user.findUnique({
        where: { id: item.setterId },
        select: { name: true },
      });
      if (user) {
        topDoorsKnocked.push({ id: item.setterId, name: user.name, count: item._count.setterId });
      }
    }

    const prospectsData = await prisma.visit.groupBy({
      by: ["setterId"],
      _count: { setterId: true },
      where: { stage: "PROPOSAL_ACCEPTED" },
      orderBy: { _count: { setterId: "desc" } },
      take: 10,
    });

    for (const item of prospectsData) {
      const user = await prisma.user.findUnique({
        where: { id: item.setterId },
        select: { name: true },
      });
      if (user) {
        topProspects.push({ id: item.setterId, name: user.name, count: item._count.setterId });
      }
    }

    const projectsData = await prisma.visit.groupBy({
      by: ["closerId"],
      _count: { closerId: true },
      where: { stage: "CLOSED", closerId: { not: null } },
      orderBy: { _count: { closerId: "desc" } },
      take: 10,
    });

    for (const item of projectsData) {
      if (item.closerId) {
        const user = await prisma.user.findUnique({
          where: { id: item.closerId },
          select: { name: true },
        });
        if (user) {
          topProjectsClosed.push({ id: item.closerId, name: user.name, count: item._count.closerId });
        }
      }
    }
  }

  const topSetterObjections = await prisma.visitObjection.groupBy({
    by: ["objectionId"],
    _count: { objectionId: true },
    orderBy: { _count: { objectionId: "desc" } },
    take: 10,
  });

  const setterObjectionsWithNames = [];
  for (const item of topSetterObjections) {
    const objection = await prisma.objection.findUnique({
      where: { id: item.objectionId },
      select: { name: true, color: true },
    });
    if (objection) {
      setterObjectionsWithNames.push({
        id: item.objectionId,
        name: objection.name,
        color: objection.color,
        count: item._count.objectionId,
      });
    }
  }

  const topCloserObjections = await prisma.visitCloserObjection.groupBy({
    by: ["closerObjectionId"],
    _count: { closerObjectionId: true },
    orderBy: { _count: { closerObjectionId: "desc" } },
    take: 10,
  });

  const closerObjectionsWithNames = [];
  for (const item of topCloserObjections) {
    const objection = await prisma.closerObjection.findUnique({
      where: { id: item.closerObjectionId },
      select: { name: true, color: true },
    });
    if (objection) {
      closerObjectionsWithNames.push({
        id: item.closerObjectionId,
        name: objection.name,
        color: objection.color,
        count: item._count.closerObjectionId,
      });
    }
  }

  const topSetterObjectionsByUser: { id: number; name: string; count: number }[] = [];
  if (role === "ADMIN") {
    const setterObjectionsData = await prisma.visitObjection.groupBy({
      by: ["visitId"],
      _count: { visitId: true },
    });

    const userObjections: Record<number, number> = {};
    for (const item of setterObjectionsData) {
      const visit = await prisma.visit.findUnique({
        where: { id: item.visitId },
        select: { setterId: true },
      });
      if (visit?.setterId) {
        userObjections[visit.setterId] = (userObjections[visit.setterId] || 0) + item._count.visitId;
      }
    }

    const sortedUsers = Object.entries(userObjections)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    for (const [userId, count] of sortedUsers) {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: { name: true },
      });
      if (user) {
        topSetterObjectionsByUser.push({ id: parseInt(userId), name: user.name, count });
      }
    }
  }

  const topCloserObjectionsByUser: { id: number; name: string; count: number }[] = [];
  if (role === "ADMIN") {
    const closerObjectionsData = await prisma.visitCloserObjection.groupBy({
      by: ["visitId"],
      _count: { visitId: true },
    });

    const userObjections: Record<number, number> = {};
    for (const item of closerObjectionsData) {
      const visit = await prisma.visit.findUnique({
        where: { id: item.visitId },
        select: { closerId: true },
      });
      if (visit?.closerId) {
        userObjections[visit.closerId] = (userObjections[visit.closerId] || 0) + item._count.visitId;
      }
    }

    const sortedUsers = Object.entries(userObjections)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    for (const [userId, count] of sortedUsers) {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: { name: true },
      });
      if (user) {
        topCloserObjectionsByUser.push({ id: parseInt(userId), name: user.name, count });
      }
    }
  }

  const conversionDoorToProspect = doorsKnocked > 0 ? (leadsGenerated / doorsKnocked) * 100 : 0;
  const conversionProspectToClosed = leadsGenerated > 0 ? (projectsClosed / leadsGenerated) * 100 : 0;

  const topConversionBySetter: { id: number; name: string; doors: number; prospects: number; rate: number }[] = [];
  if (role === "ADMIN") {
    const setters = await prisma.user.findMany({
      where: { role: "SETTER" },
      select: { id: true, name: true },
    });

    for (const setter of setters) {
      const doors = await prisma.visit.count({ where: { setterId: setter.id } });
      const prospects = await prisma.visit.count({
        where: { setterId: setter.id, stage: "PROPOSAL_ACCEPTED" },
      });
      const rate = doors > 0 ? (prospects / doors) * 100 : 0;
      topConversionBySetter.push({
        id: setter.id,
        name: setter.name,
        doors,
        prospects,
        rate,
      });
    }

    topConversionBySetter.sort((a, b) => b.rate - a.rate);
  }

  const topConversionByCloser: { id: number; name: string; prospects: number; closed: number; rate: number }[] = [];
  if (role === "ADMIN") {
    const closers = await prisma.user.findMany({
      where: { role: "CLOSER" },
      select: { id: true, name: true },
    });

    for (const closer of closers) {
      const prospects = await prisma.visit.count({
        where: { closerId: closer.id, stage: { in: ["PROPOSAL_ACCEPTED", "PROJECT"] } },
      });
      const closed = await prisma.visit.count({
        where: { closerId: closer.id, stage: "CLOSED" },
      });
      const rate = prospects > 0 ? (closed / prospects) * 100 : 0;
      topConversionByCloser.push({
        id: closer.id,
        name: closer.name,
        prospects,
        closed,
        rate,
      });
    }

    topConversionByCloser.sort((a, b) => b.rate - a.rate);
  }

  const projectTypes = await prisma.projectType.findMany({
    include: {
      visits: {
        select: { visitId: true },
      },
    },
  });

  const projectMetrics = projectTypes.map((pt) => ({
    id: pt.id,
    name: pt.name,
    count: pt.visits.length,
  })).sort((a, b) => b.count - a.count);

  return NextResponse.json({
    doorsKnocked,
    parcels,
    setterObjections,
    leadsGenerated,
    closerLeads,
    projectsInProgress,
    projectsClosed,
    projectsCancelled,
    closerObjectionsCount,
    appointments,
    weeklyGoal,
    monthlyGoal,
    topDoorsKnocked,
    topProspects,
    topProjectsClosed,
    topSetterObjections: setterObjectionsWithNames,
    topCloserObjections: closerObjectionsWithNames,
    topSetterObjectionsByUser,
    topCloserObjectionsByUser,
    projectMetrics,
    conversionDoorToProspect,
    conversionProspectToClosed,
    topConversionBySetter,
    topConversionByCloser,
  });
}
