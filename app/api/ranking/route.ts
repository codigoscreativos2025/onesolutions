import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const myRole = session.user.role;

  const setterRole = myRole === "SETTER_JR" ? "SETTER_JR" : "SETTER";

  // Ranking de setters por puertas tocadas
  const settersDoors = await prisma.user.findMany({
    where: { role: setterRole },
    select: {
      id: true,
      name: true,
      role: true,
      userBadges: {
        include: { badge: true },
      },
      _count: {
        select: { visitsAsSetter: true },
      },
    },
    orderBy: {
      visitsAsSetter: { _count: "desc" },
    },
    take: 10,
  });

  // Ranking de setters por prospectos generados
  const settersProspects = await prisma.user.findMany({
    where: { role: setterRole },
    select: {
      id: true,
      name: true,
      role: true,
      userBadges: {
        include: { badge: true },
      },
      visitsAsSetter: {
        where: { stage: "PROPOSAL_ACCEPTED" },
        select: { id: true },
      },
    },
  });

  const settersProspectsSorted = settersProspects
    .map((user) => ({
      id: user.id,
      name: user.name,
      role: user.role,
      badges: user.userBadges.map((ub) => ub.badge),
      count: user.visitsAsSetter.length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Ranking de closers por proyectos cerrados
  const closersProjects = await prisma.user.findMany({
    where: { role: "CLOSER" },
    select: {
      id: true,
      name: true,
      role: true,
      userBadges: {
        include: { badge: true },
      },
      visitsAsCloser: {
        where: { stage: "CLOSED" },
        select: { id: true },
      },
    },
  });

  const closersProjectsSorted = closersProjects
    .map((user) => ({
      id: user.id,
      name: user.name,
      role: user.role,
      badges: user.userBadges.map((ub) => ub.badge),
      count: user.visitsAsCloser.length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Posición propia del usuario
  const allSettersDoors = await prisma.user.findMany({
    where: { role: setterRole },
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

  const allClosersProjects = await prisma.user.findMany({
    where: { role: "CLOSER" },
    select: {
      id: true,
      visitsAsCloser: {
        where: { stage: "CLOSED" },
        select: { id: true },
      },
    },
  });

  const myRoleInRanking = session.user.role;
  let myDoorsPosition = 0;
  let myProspectsPosition = 0;
  let myProjectsPosition = 0;

  if (myRoleInRanking === "SETTER" || myRoleInRanking === "SETTER_JR") {
    myDoorsPosition = allSettersDoors.findIndex((u) => u.id === userId) + 1 || allSettersDoors.length + 1;
    
    const allSettersProspects = await prisma.user.findMany({
      where: { role: setterRole },
      select: {
        id: true,
        visitsAsSetter: {
          where: { stage: "PROPOSAL_ACCEPTED" },
          select: { id: true },
        },
      },
    });
    
    const sorted = allSettersProspects
      .map((u) => ({ id: u.id, count: u.visitsAsSetter.length }))
      .sort((a, b) => b.count - a.count);
    myProspectsPosition = sorted.findIndex((u) => u.id === userId) + 1 || sorted.length + 1;
  }

  if (myRoleInRanking === "CLOSER") {
    const sorted = allClosersProjects
      .map((u) => ({ id: u.id, count: u.visitsAsCloser.length }))
      .sort((a, b) => b.count - a.count);
    myProjectsPosition = sorted.findIndex((u) => u.id === userId) + 1 || sorted.length + 1;
  }

  // Mis medallas
  const myBadges = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
  });

  return NextResponse.json({
    settersDoors: settersDoors.map((u, index) => ({
      position: index + 1,
      id: u.id,
      name: u.name,
      role: u.role,
      badges: u.userBadges.map((ub) => ub.badge),
      count: u._count.visitsAsSetter,
    })),
    settersProspects: settersProspectsSorted.map((u, index) => ({
      position: index + 1,
      ...u,
    })),
    closersProjects: closersProjectsSorted.map((u, index) => ({
      position: index + 1,
      ...u,
    })),
    myPosition: {
      doorsKnocked: myDoorsPosition,
      prospectsGenerated: myProspectsPosition,
      projectsClosed: myProjectsPosition,
    },
    myBadges: myBadges.map((ub) => ub.badge),
  });
}
