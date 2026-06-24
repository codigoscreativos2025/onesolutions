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

  let whereClause = {};
  if (role !== "ADMIN") {
    whereClause = { setterId: userId };
  }

  const [
    doorsKnocked,
    leadsGenerated,
    projectsClosed,
    objectionsCount,
    appointments,
    teamGoal,
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
    prisma.visit.count({
      where: {
        stage: "CLOSED",
      },
    }),
  ]);

  return NextResponse.json({
    doorsKnocked,
    leadsGenerated,
    projectsClosed,
    objectionsCount,
    appointments,
    teamGoal,
  });
}
