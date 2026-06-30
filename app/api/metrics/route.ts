import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const role = session.user.role;

  let whereClause: Record<string, unknown> = {};
  if (role !== "ADMIN") {
    whereClause = { setterId: userId };
  }

  // Métricas básicas
  const [
    doorsKnocked,
    prospectsGenerated,
    projectsClosed,
    objectionsCount,
    appointments,
  ] = await Promise.all([
    prisma.visit.count({ where: whereClause }),
    prisma.visit.count({
      where: {
        ...whereClause,
        stage: "PROPOSAL_ACCEPTED",
      },
    }),
    prisma.visit.count({
      where: {
        ...whereClause,
        stage: "CLOSED",
      },
    }),
    prisma.visitObjection.count({
      where: {
        visit: whereClause,
      },
    }),
    prisma.visit.count({
      where: {
        ...whereClause,
        stage: {
          in: ["PROPOSAL_ACCEPTED", "CLOSED"],
        },
      },
    }),
  ]);

  // Obtener metas actuales
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

  // Top personas por métrica (solo admin)
  const topDoorsKnocked: { id: number; name: string; count: number }[] = [];
  const topProspects: { id: number; name: string; count: number }[] = [];
  const topProjectsClosed: { id: number; name: string; count: number }[] = [];

  if (role === "ADMIN") {
    // Top puertas tocadas
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

    // Top prospectos
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

    // Top proyectos cerrados (closers)
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

  // Objeciones más comunes
  const topObjections = await prisma.visitObjection.groupBy({
    by: ["objectionId"],
    _count: { objectionId: true },
    orderBy: { _count: { objectionId: "desc" } },
    take: 10,
  });

  const objectionsWithNames = [];
  for (const item of topObjections) {
    const objection = await prisma.objection.findUnique({
      where: { id: item.objectionId },
      select: { name: true, color: true },
    });
    if (objection) {
      objectionsWithNames.push({
        id: item.objectionId,
        name: objection.name,
        color: objection.color,
        count: item._count.objectionId,
      });
    }
  }

  // Métricas por tipo de proyecto
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
    prospectsGenerated,
    projectsClosed,
    objectionsCount,
    appointments,
    weeklyGoal,
    monthlyGoal,
    topDoorsKnocked,
    topProspects,
    topProjectsClosed,
    topObjections: objectionsWithNames,
    projectMetrics,
  });
}
