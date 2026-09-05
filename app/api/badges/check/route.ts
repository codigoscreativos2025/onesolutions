import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function checkAndAwardBadges() {
  const badges = await prisma.badge.findMany();

  const setters = await prisma.user.findMany({
    where: { role: { in: ["SETTER", "SETTER_JR"] } },
    select: { id: true, role: true, userBadges: true },
  });

  const closers = await prisma.user.findMany({
    where: { role: "CLOSER" },
    include: { userBadges: true },
  });

  for (const setter of setters) {
    const doorsKnocked = await prisma.visit.count({
      where: { setterId: setter.id },
    });

    const prospectsGenerated = await prisma.visit.count({
      where: { setterId: setter.id, stage: "PROPOSAL_ACCEPTED" },
    });

    const applicableBadges = badges.filter((b) => b.role === setter.role);
    for (const badge of applicableBadges) {
      const hasBadge = setter.userBadges.some(
        (ub) => ub.badgeId === badge.id,
      );
      if (!hasBadge) {
        const doorsMet = badge.doorsThreshold
          ? doorsKnocked >= badge.doorsThreshold
          : true;
        const prospectsMet = badge.prospectsThreshold
          ? prospectsGenerated >= badge.prospectsThreshold
          : true;

        if (doorsMet && prospectsMet) {
          await prisma.userBadge.upsert({
            where: {
              userId_badgeId: { userId: setter.id, badgeId: badge.id },
            },
            create: { userId: setter.id, badgeId: badge.id },
            update: {},
          });

          if (setter.role !== "SETTER") {
            await prisma.notification.create({
              data: {
                userId: setter.id,
                title: "¡Nueva medalla obtenida!",
                body: `Felicidades, has obtenido la medalla ${badge.icon} ${badge.name}`,
                link: "/ranking",
              },
            });
          }
        }
      }
    }
  }

  for (const closer of closers) {
    const projectsClosed = await prisma.visit.count({
      where: { closerId: closer.id, stage: "CLOSED" },
    });

    const closerBadges = badges.filter((b) => b.role === "CLOSER");
    for (const badge of closerBadges) {
      const hasBadge = closer.userBadges.some(
        (ub) => ub.badgeId === badge.id,
      );
      if (!hasBadge) {
        const projectsMet = badge.projectsThreshold
          ? projectsClosed >= badge.projectsThreshold
          : true;

        if (projectsMet) {
          await prisma.userBadge.upsert({
            where: {
              userId_badgeId: { userId: closer.id, badgeId: badge.id },
            },
            create: { userId: closer.id, badgeId: badge.id },
            update: {},
          });

          await prisma.notification.create({
            data: {
              userId: closer.id,
              title: "¡Nueva medalla obtenida!",
              body: `Felicidades, has obtenido la medalla ${badge.icon} ${badge.name}`,
              link: "/ranking",
            },
          });
        }
      }
    }
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
