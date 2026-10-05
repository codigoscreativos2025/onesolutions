import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function checkAndAwardBadges() {
  const badges = await prisma.badge.findMany();

  const doorsBadges = badges.filter(b => b.doorsThreshold !== null).sort((a, b) => b.doorsThreshold! - a.doorsThreshold!);
  const prospectsBadges = badges.filter(b => b.prospectsThreshold !== null).sort((a, b) => b.prospectsThreshold! - a.prospectsThreshold!);
  const projectsBadges = badges.filter(b => b.projectsThreshold !== null).sort((a, b) => b.projectsThreshold! - a.projectsThreshold!);

  const setters = await prisma.user.findMany({
    where: { role: { in: ["SETTER", "SETTER_JR", "TRAINEE", "CLOSER"] } },
    select: { id: true, role: true, userBadges: true },
  });

  const closers = await prisma.user.findMany({
    where: { role: { in: ["CLOSER", "TRAINEE"] } },
    include: { userBadges: true },
  });

  async function updateCategoryBadges(userId: number, currentBadges: any[], categoryBadges: any[], highestBadge: any | undefined, showNotification: boolean) {
    if (!highestBadge) return;

    const hasHighest = currentBadges.some((ub: any) => ub.badgeId === highestBadge.id);

    if (!hasHighest) {
      await prisma.userBadge.upsert({
        where: {
          userId_badgeId: { userId, badgeId: highestBadge.id },
        },
        create: { userId, badgeId: highestBadge.id },
        update: {},
      });

      if (showNotification) {
        await prisma.notification.create({
          data: {
            userId,
            title: "¡Nueva medalla obtenida!",
            body: `Felicidades, has obtenido la medalla ${highestBadge.icon} ${highestBadge.name}`,
            link: "/ranking",
          },
        });
      }
    }

    const lowerBadgeIds = categoryBadges
      .filter(b => b.id !== highestBadge.id)
      .map(b => b.id);

    if (lowerBadgeIds.length > 0) {
      await prisma.userBadge.deleteMany({
        where: {
          userId,
          badgeId: { in: lowerBadgeIds },
        },
      });
    }
  }

  for (const setter of setters) {
    const doorsKnocked = await prisma.visit.count({
      where: { setterId: setter.id },
    });

    const prospectsGenerated = await prisma.visit.count({
      where: { setterId: setter.id, stage: "PROPOSAL_ACCEPTED" },
    });

    const highestDoorsBadge = doorsBadges.find(b => doorsKnocked >= b.doorsThreshold!);
    const highestProspectsBadge = prospectsBadges.find(b => prospectsGenerated >= b.prospectsThreshold!);

    // Solo notificar si no es solo SETTER (manteniendo la logica original)
    const showNotif = setter.role !== "SETTER";

    await updateCategoryBadges(setter.id, setter.userBadges, doorsBadges, highestDoorsBadge, showNotif);
    await updateCategoryBadges(setter.id, setter.userBadges, prospectsBadges, highestProspectsBadge, showNotif);
  }

  for (const closer of closers) {
    const projectsClosed = await prisma.visit.count({
      where: { closerId: closer.id, stage: "CLOSED" },
    });

    const highestProjectsBadge = projectsBadges.find(b => projectsClosed >= b.projectsThreshold!);

    await updateCategoryBadges(closer.id, closer.userBadges, projectsBadges, highestProjectsBadge, true);
  }
}

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await checkAndAwardBadges();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error checking badges" },
      { status: 500 },
    );
  }
}

export async function POST() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await checkAndAwardBadges();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error checking badges" },
      { status: 500 },
    );
  }
}
