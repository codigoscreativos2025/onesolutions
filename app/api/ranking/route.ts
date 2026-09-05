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

  const now = new Date();
  const nowStr = now.toLocaleString("en-US", { timeZone: "America/New_York" });
  const localNow = new Date(nowStr);

  function startOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  function startOfWeek(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
  }
  function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  let doorsStart: Date | null = null;
  let leadsStart: Date | null = null;
  let closedStart: Date | null = null;

  if (period !== "all") {
    if (period === "day") {
      doorsStart = startOfDay(localNow);
    } else if (period === "week") {
      doorsStart = startOfWeek(localNow);
    } else {
      doorsStart = startOfMonth(localNow);
    }
    leadsStart = doorsStart;
    closedStart = doorsStart;
  }

  const doorsFilter = doorsStart
    ? { createdAt: { gte: doorsStart } }
    : {};

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
          where: { ...doorsFilter, stage: { not: "CANCELLED" } },
          select: { id: true, stage: true, leadGeneratedAt: true },
        },
      },
    });

    const data = raw.map((user) => {
      const leadsGenerated = user.visitsAsSetter.filter(
        (v) =>
          (v.stage === "PROPOSAL_ACCEPTED" ||
            v.stage === "PROJECT" ||
            v.stage === "CLOSED") &&
          (!leadsStart || (v.leadGeneratedAt && v.leadGeneratedAt >= leadsStart))
      ).length;
      const doors = user.visitsAsSetter.length;
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
        where: { ...doorsFilter },
        select: { id: true, completedAt: true, stage: true, leadGeneratedAt: true },
      },
      visitsAsSetter: {
        where: doorsFilter,
        select: { id: true },
      },
    },
  });

  const data = raw.map((user) => {
    const projectsClosed = user.visitsAsCloser.filter(
      (v) =>
        (v.stage === "CLOSED" || v.stage === "PROJECT") &&
        (!closedStart || (v.completedAt && v.completedAt >= closedStart))
    ).length;
    const leads = user.visitsAsCloser.filter(
      (v) =>
        v.stage === "PROPOSAL_ACCEPTED" &&
        (!leadsStart || (v.leadGeneratedAt && v.leadGeneratedAt >= leadsStart))
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
