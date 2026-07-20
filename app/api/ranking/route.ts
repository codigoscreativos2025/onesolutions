import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") || "trainers";

  if (type === "setters") {
    const raw = await prisma.user.findMany({
      where: { role: "SETTER_JR" },
      select: {
        id: true,
        name: true,
        role: true,
        phone: true,
        visitsAsSetter: {
          select: { id: true, stage: true },
        },
      },
    });

    const data = raw.map((user) => {
      const leadsGenerated = user.visitsAsSetter.filter(
        (v) => v.stage === "PROPOSAL_ACCEPTED"
      ).length;
      const doors = user.visitsAsSetter.filter(
        (v) => v.stage === "IN_PROGRESS"
      ).length;
      return {
        id: user.id,
        name: user.name,
        role: user.role,
        phone: user.phone,
        leadsGenerated,
        doors,
      };
    });

    data.sort((a, b) => b.leadsGenerated - a.leadsGenerated);

    return NextResponse.json(data);
  }

  const raw = await prisma.user.findMany({
    where: { role: { in: ["SETTER", "CLOSER"] } },
    select: {
      id: true,
      name: true,
      role: true,
      phone: true,
      visitsAsCloser: {
        select: { id: true, completedAt: true, stage: true },
      },
      visitsAsSetter: {
        where: { stage: "IN_PROGRESS" },
        select: { id: true },
      },
    },
  });

  const data = raw.map((user) => {
    const projectsClosed = user.visitsAsCloser.filter(
      (v) => v.completedAt !== null
    ).length;
    const leads = user.visitsAsCloser.filter(
      (v) => v.stage === "PROPOSAL_ACCEPTED"
    ).length;
    const doors = user.visitsAsSetter.length;
    return {
      id: user.id,
      name: user.name,
      role: user.role,
      phone: user.phone,
      projectsClosed,
      leads,
      doors,
    };
  });

  data.sort((a, b) => b.projectsClosed - a.projectsClosed);

  return NextResponse.json(data);
}
