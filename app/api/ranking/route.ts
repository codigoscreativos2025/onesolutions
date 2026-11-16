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

  const dateFilter = (rangeStart || rangeEnd)
    ? {
        createdAt: {
          ...(rangeStart ? { gte: rangeStart } : {}),
          ...(rangeEnd ? { lte: rangeEnd } : {}),
        },
      }
    : {};

  const isSetters = type === "setters";

  // En la nueva lógica de ranking:
  // Mundo Setter (Setter, Trainee, Closer - métricas de setter)
  // - Puertas Tocadas = count de ParcelVisitHistory en el rango
  // - Leads Creados = count de Visits (cualquier stage excepto CANCELLED) en el rango
  // - Citas Agendadas = count de Visits donde closerId != null en el rango
  
  // Mundo Closer (Closer, Trainee - métricas de closer)
  // - Proyectos Cerrados = count de Visits como closer en stage CLOSED/PROJECT según la fecha real de cierre (completedAt / closingDate)

  const rawUsers = await prisma.user.findMany({
    where: { 
      role: isSetters ? { in: ["SETTER_JR", "SETTER", "TRAINEE", "CLOSER"] } : { in: ["CLOSER", "TRAINEE"] },
      isActive: true
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
        where: dateFilter,
        select: { id: true },
      },
      visitsAsSetter: {
        where: { ...dateFilter, stage: { not: "CANCELLED" } },
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
          projectDetails: {
            select: { closingDate: true },
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
      // Determinar la fecha real del cierre (completedAt -> closingDate -> createdAt)
      const projectsClosed = user.visitsAsCloser.filter((v) => {
        const rawClose = v.completedAt || v.projectDetails?.closingDate || v.createdAt;
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

  if (isSetters) {
    // Para el tab de Setters, ordenamos por Citas Agendadas, luego Leads, luego Puertas
    data.sort(
      (a, b) =>
        b.appointmentsScheduled - a.appointmentsScheduled ||
        b.leadsCreated - a.leadsCreated ||
        b.doors - a.doors
    );
  } else {
    // Para el tab de Closers, lo que define su posición sigue siendo Proyectos Cerrados
    data.sort(
      (a, b) =>
        b.projectsClosed - a.projectsClosed ||
        b.doors - a.doors ||
        b.leadsCreated - a.leadsCreated
    );
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
