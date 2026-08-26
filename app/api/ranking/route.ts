import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authRes = await verifyApiAuth();
  if (authRes.error) {
    return NextResponse.json({ error: authRes.error }, { status: authRes.status });
  }

  const type = request.nextUrl.searchParams.get("type") || "trainers";
  const period = request.nextUrl.searchParams.get("period") || "all";

  let dateFilter: Record<string, unknown> = {};
  if (period !== "all") {
    const now = new Date();
    let startDate: Date;
    if (period === "day") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "week") {
      const day = now.getDay();
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    dateFilter = { createdAt: { gte: startDate } };
  }

  if (type === "setters") {
    const raw = await prisma.user.findMany({
      where: { role: "SETTER_JR" },
      select: {
        id: true,
        name: true,
        role: true,
        phone: true,
        userBadges: {
          include: {
            badge: { select: { id: true, name: true, icon: true } },
          },
        },
        visitsAsSetter: {
          where: dateFilter,
          select: { id: true, stage: true },
        },
      },
    });

    const data = raw.map((user) => {
      const leadsGenerated = user.visitsAsSetter.filter(
        (v) => v.stage === "PROPOSAL_ACCEPTED" || v.stage === "PROJECT" || v.stage === "CLOSED"
      ).length;
      const doors = user.visitsAsSetter.filter(
        (v) => v.stage !== "CANCELLED"
      ).length;
      return {
        id: user.id,
        name: user.name,
        role: user.role,
        phone: user.phone,
        leadsGenerated,
        doors,
        badgeCount: user.userBadges.length,
        badges: user.userBadges.map((ub) => ({ icon: ub.badge.icon, name: ub.badge.name })),
      };
    });

    data.sort((a, b) => b.leadsGenerated - a.leadsGenerated);

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  }

  const raw = await prisma.user.findMany({
    where: { role: { in: ["SETTER", "CLOSER"] } },
    select: {
      id: true,
      name: true,
      role: true,
      phone: true,
      userBadges: {
        include: {
          badge: { select: { id: true, name: true, icon: true } },
        },
      },
      visitsAsCloser: {
        where: dateFilter,
        select: { id: true, completedAt: true, stage: true },
      },
      visitsAsSetter: {
        where: dateFilter,
        select: { id: true },
      },
    },
  });

  const data = raw.map((user) => {
    const projectsClosed = user.visitsAsCloser.filter(
      (v) => v.stage === "CLOSED" || v.stage === "PROJECT"
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
      badgeCount: user.userBadges.length,
      badges: user.userBadges.map((ub) => ({ icon: ub.badge.icon, name: ub.badge.name })),
    };
  });

  data.sort((a, b) => b.projectsClosed - a.projectsClosed);

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
