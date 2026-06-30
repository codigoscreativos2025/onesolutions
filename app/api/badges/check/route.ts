import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// Verifica y otorga medallas a todos los usuarios
export async function POST() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Obtener todos los badges
    const badges = await prisma.badge.findMany();

    // Obtener estadísticas de setters
    const setters = await prisma.user.findMany({
      where: { role: "SETTER" },
      include: { userBadges: true },
    });

    // Obtener estadísticas de closers
    const closers = await prisma.user.findMany({
      where: { role: "CLOSER" },
      include: { userBadges: true },
    });

    // Verificar setters
    for (const setter of setters) {
      const doorsKnocked = await prisma.visit.count({
        where: { setterId: setter.id },
      });

      const prospectsGenerated = await prisma.visit.count({
        where: { setterId: setter.id, stage: "PROPOSAL_ACCEPTED" },
      });

      // Verificar cada badge de setter
      const setterBadges = badges.filter((b) => b.role === "SETTER");
      for (const badge of setterBadges) {
        const hasBadge = setter.userBadges.some((ub) => ub.badgeId === badge.id);
        if (!hasBadge) {
          const doorsMet = badge.doorsThreshold ? doorsKnocked >= badge.doorsThreshold : true;
          const prospectsMet = badge.prospectsThreshold ? prospectsGenerated >= badge.prospectsThreshold : true;

          if (doorsMet && prospectsMet) {
            await prisma.userBadge.create({
              data: {
                userId: setter.id,
                badgeId: badge.id,
              },
            });

            // Notificar al usuario
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

    // Verificar closers
    for (const closer of closers) {
      const projectsClosed = await prisma.visit.count({
        where: { closerId: closer.id, stage: "CLOSED" },
      });

      // Verificar cada badge de closer
      const closerBadges = badges.filter((b) => b.role === "CLOSER");
      for (const badge of closerBadges) {
        const hasBadge = closer.userBadges.some((ub) => ub.badgeId === badge.id);
        if (!hasBadge) {
          const projectsMet = badge.projectsThreshold ? projectsClosed >= badge.projectsThreshold : true;

          if (projectsMet) {
            await prisma.userBadge.create({
              data: {
                userId: closer.id,
                badgeId: badge.id,
              },
            });

            // Notificar al usuario
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error checking badges" }, { status: 500 });
  }
}
