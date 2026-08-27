import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: ["SETTER", "SETTER_JR", "CLOSER", "PARTNER"] },
    },
    select: {
      id: true,
      name: true,
      role: true,
    },
  });

  // Find active projects for these users
  const activeVisits = await prisma.visit.findMany({
    where: {
      stage: { in: ["PROPOSAL_ACCEPTED", "PROJECT"] },
    },
    include: {
      parcel: { select: { address: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const usersWithProjects = users.map((u) => {
    // Find the first active project where this user is setter or closer
    const activeProject = activeVisits.find(
      (v) => v.setterId === u.id || v.closerId === u.id
    );

    return {
      id: u.id,
      name: u.name,
      role: u.role,
      activeProject: activeProject
        ? {
            visitId: activeProject.id,
            address: activeProject.parcel?.address || "Proyecto sin dirección",
            stage: activeProject.stage,
          }
        : null,
    };
  });

  return NextResponse.json(usersWithProjects);
}
