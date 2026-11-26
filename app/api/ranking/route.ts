import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const authRes = await verifyApiAuth();
  if (authRes.error) {
    return NextResponse.json({ error: authRes.error }, { status: authRes.status });
  }

  const type = request.nextUrl.searchParams.get("type") || "closers";
  const period = request.nextUrl.searchParams.get("period") || "quarter";

  const now = new Date();
  const nowStr = now.toLocaleString("en-US", { timeZone: "America/New_York" });
  const localNow = new Date(nowStr);

  function startOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }
  function endOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  }
  function startOfWeek(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay(), 0, 0, 0, 0);
  }
  function endOfWeek(d: Date) {
    const s = startOfWeek(d);
    return new Date(s.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
  }
  function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  }
  function endOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  let rangeStart: Date | null = null;
  let rangeEnd: Date | null = null;

  if (period === "day") {
    rangeStart = startOfDay(localNow);
    rangeEnd = endOfDay(localNow);
  } else if (period === "week") {
    rangeStart = startOfWeek(localNow);
    rangeEnd = endOfWeek(localNow);
  } else if (period === "month") {
    rangeStart = startOfMonth(localNow);
    rangeEnd = endOfMonth(localNow);
  } else if (period === "quarter") {
    // 4 trimestres del año: Q1 (0-2), Q2 (3-5), Q3 (6-8), Q4 (9-11)
    const quarterMonth = Math.floor(localNow.getMonth() / 3) * 3;
    rangeStart = new Date(localNow.getFullYear(), quarterMonth, 1, 0, 0, 0, 0);
    rangeEnd = new Date(localNow.getFullYear(), quarterMonth + 3, 0, 23, 59, 59, 999);
  } else if (period === "custom") {
    const startParam = request.nextUrl.searchParams.get("startDate");
    const endParam = request.nextUrl.searchParams.get("endDate");
    if (startParam) {
      const s = new Date(startParam + "T00:00:00");
      if (!isNaN(s.getTime())) {
        rangeStart = s;
      }
    }
    if (endParam) {
      const e = new Date(endParam + "T23:59:59.999");
      if (!isNaN(e.getTime())) {
        rangeEnd = e;
      }
    }
  }

  const historyDateFilter = (rangeStart || rangeEnd)
    ? {
        OR: [
          {
            visitedAt: {
              ...(rangeStart ? { gte: rangeStart } : {}),
              ...(rangeEnd ? { lte: rangeEnd } : {}),
            },
          },
          {
            createdAt: {
              ...(rangeStart ? { gte: rangeStart } : {}),
              ...(rangeEnd ? { lte: rangeEnd } : {}),
            },
          },
        ],
      }
    : {};

  const visitsDateFilter = (rangeStart || rangeEnd)
    ? {
        createdAt: {
          ...(rangeStart ? { gte: rangeStart } : {}),
          ...(rangeEnd ? { lte: rangeEnd } : {}),
        },
      }
    : {};

  // Clasificación de tabs:
  // - "setters": SETTER_JR (Junior Setters)
  // - "closers" | "trainers": CLOSER
  // - "trainees": SETTER, TRAINEE
  let roleCondition: { in: string[] };
  if (type === "setters") {
    roleCondition = { in: ["SETTER_JR"] };
  } else if (type === "trainees") {
    roleCondition = { in: ["SETTER", "TRAINEE"] };
  } else {
    roleCondition = { in: ["CLOSER"] };
  }

  const rawUsers = await prisma.user.findMany({
    where: { 
      role: roleCondition,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      role: true,
      phone: true,
      userBadges: {
        include: { badge: { select: { id: true, name: true, icon: true } } },
      },
      parcelHistory: {
        where: historyDateFilter,
        select: { id: true },
      },
      visitsAsSetter: {
        where: { ...visitsDateFilter, stage: { not: "CANCELLED" } },
        select: { id: true, closerId: true },
      },
      visitsAsCloser: {
        where: {
          stage: { in: ["CLOSED", "PROJECT"] },
        },
        select: {
          id: true,
          completedAt: true,
          stage: true,
          createdAt: true,
          closerId: true,
          setterId: true,
          projectDetails: {
            select: { closingDate: true },
          },
        },
      },
      commissions: {
        select: {
          visitId: true,
          role: true,
          visit: {
            select: {
              id: true,
              completedAt: true,
              stage: true,
              createdAt: true,
              closerId: true,
              setterId: true,
              projectDetails: {
                select: { closingDate: true },
              },
            },
          },
        },
      },
    },
  });

  let data = rawUsers
    .filter((user) => {
      const name = user.name?.toLowerCase().trim() || "";
      return name && !name.includes("leads one solution");
    })
    .map((user) => {
      // Setter Metrics
      const doors = user.parcelHistory.length;
      const leadsCreated = user.visitsAsSetter.length;
      const appointmentsScheduled = user.visitsAsSetter.filter((v) => v.closerId !== null).length;

      // Closer Metrics
      // Recopilar todas las visitas cerradas atribuidas al usuario
      const closedVisitsMap = new Map<number, {
        id: number;
        completedAt: Date | null;
        stage: string;
        createdAt: Date;
        projectDetails: { closingDate: Date | null } | null;
      }>();

      // 1. Como closer directo de la visita
      for (const v of user.visitsAsCloser) {
        closedVisitsMap.set(v.id, v);
      }

      // 2. Por comisión asignada en el cierre
      for (const comm of user.commissions) {
        if (comm.visit && (comm.visit.stage === "CLOSED" || comm.visit.stage === "PROJECT")) {
          closedVisitsMap.set(comm.visit.id, comm.visit);
        }
      }

      // Filtrar por fecha real de cierre:
      // Prioridad: closingDate (fecha oficial del contrato/venta) -> completedAt -> createdAt
      const projectsClosed = Array.from(closedVisitsMap.values()).filter((v) => {
        const rawClose = v.projectDetails?.closingDate || v.completedAt || v.createdAt;
        if (!rawClose) return false;
        const closeDate = new Date(rawClose);
        if (rangeStart && closeDate < rangeStart) return false;
        if (rangeEnd && closeDate > rangeEnd) return false;
        return true;
      }).length;

      return {
        id: user.id,
        name: user.name,
        role: user.role,
        phone: user.phone,
        badgeCount: user.userBadges.length,
        badges: user.userBadges.map((ub) => ({ icon: ub.badge.icon, name: ub.badge.name })),
        
        doors,
        leadsCreated,
        appointmentsScheduled,
        projectsClosed,
      };
    });

  if (type === "setters") {
    // Para Setters: Citas Agendadas, luego Leads, luego Puertas
    data.sort(
      (a, b) =>
        b.appointmentsScheduled - a.appointmentsScheduled ||
        b.leadsCreated - a.leadsCreated ||
        b.doors - a.doors
    );
  } else if (type === "trainees") {
    // Para Trainees: Proyectos Cerrados, luego Citas, luego Leads, luego Puertas
    data.sort(
      (a, b) =>
        b.projectsClosed - a.projectsClosed ||
        b.appointmentsScheduled - a.appointmentsScheduled ||
        b.leadsCreated - a.leadsCreated ||
        b.doors - a.doors
    );
  } else {
    // Para Closers: Proyectos Cerrados, luego Puertas, luego Leads
    data.sort(
      (a, b) =>
        b.projectsClosed - a.projectsClosed ||
        b.doors - a.doors ||
        b.leadsCreated - a.leadsCreated
    );
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
