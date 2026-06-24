import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.user.id);

  // Ranking por puertas tocadas
  const doorsKnockedRanking = await prisma.user.findMany({
    where: { role: { in: ["SETTER", "CLOSER"] } },
    select: {
      id: true,
      name: true,
      role: true,
      _count: {
        select: { visitsAsSetter: true },
      },
    },
    orderBy: {
      visitsAsSetter: { _count: "desc" },
    },
    take: 10,
  });

  // Ranking por proyectos cerrados
  const projectsClosedRanking = await prisma.user.findMany({
    where: { role: { in: ["SETTER", "CLOSER"] } },
    select: {
      id: true,
      name: true,
      role: true,
      visitsAsSetter: {
        where: { stage: "CLOSED" },
        select: { id: true },
      },
    },
  });

  const projectsClosedSorted = projectsClosedRanking
    .map((user) => ({
      id: user.id,
      name: user.name,
      role: user.role,
      count: user.visitsAsSetter.length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Posición propia
  const allDoors = await prisma.user.findMany({
    where: { role: { in: ["SETTER", "CLOSER"] } },
    select: {
      id: true,
      _count: {
        select: { visitsAsSetter: true },
      },
    },
    orderBy: {
      visitsAsSetter: { _count: "desc" },
    },
  });

  const allProjects = await prisma.user.findMany({
    where: { role: { in: ["SETTER", "CLOSER"] } },
    select: {
      id: true,
      visitsAsSetter: {
        where: { stage: "CLOSED" },
        select: { id: true },
      },
    },
  });

  const doorsPosition =
    allDoors.findIndex((u) => u.id === userId) + 1 || allDoors.length + 1;
  const projectsSorted = allProjects
    .map((u) => ({
      id: u.id,
      count: u.visitsAsSetter.length,
    }))
    .sort((a, b) => b.count - a.count);
  const projectsPosition =
    projectsSorted.findIndex((u) => u.id === userId) + 1 ||
    projectsSorted.length + 1;

  return NextResponse.json({
    doorsKnocked: doorsKnockedRanking.map((u, index) => ({
      position: index + 1,
      id: u.id,
      name: u.name,
      role: u.role,
      count: u._count.visitsAsSetter,
    })),
    projectsClosed: projectsClosedSorted.map((u, index) => ({
      position: index + 1,
      ...u,
    })),
    myPosition: {
      doorsKnocked: doorsPosition,
      projectsClosed: projectsPosition,
    },
  });
}
