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

  const isSetters = type === "setters";

  // En la nueva lógica de ranking:
  // Mundo Setter (Setter, Trainee, Closer - métricas de setter)
  // - Puertas Tocadas = count de ParcelVisitHistory
  // - Leads Creados = count de Visits (cualquier stage excepto CANCELLED)
  // - Citas Agendadas = count de Visits donde closerId != null
  
  // Mundo Closer (Closer, Trainee - métricas de closer)
  // - Proyectos Cerrados = count de Visits como closer en stage CLOSED/PROJECT

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
        where: doorsFilter,
        select: { id: true },
      },
      visitsAsSetter: {
        where: { ...doorsFilter, stage: { not: "CANCELLED" } },
        select: { id: true, closerId: true },
      },
      visitsAsCloser: {
        where: { ...doorsFilter },
        select: { id: true, completedAt: true, stage: true },
      },
    },
  });

  const data = rawUsers.map((user) => {
    // Setter Metrics
    const doors = user.parcelHistory.length;
    const leadsCreated = user.visitsAsSetter.length;
    const appointmentsScheduled = user.visitsAsSetter.filter((v) => v.closerId !== null).length;

    // Closer Metrics
    const projectsClosed = user.visitsAsCloser.filter(
      (v) =>
        (v.stage === "CLOSED" || v.stage === "PROJECT") &&
        (!closedStart || (v.completedAt && v.completedAt >= closedStart))
    ).length;

    return {
      id: user.id,
      name: user.name,
      role: user.role,
      phone: user.phone,
      badgeCount: user.userBadges.length,
      badges: user.userBadges.map((ub) => ({ icon: ub.badge.icon, name: ub.badge.name })),
      
      // We send all metrics, the frontend will decide what to show based on the tab
      doors,
      leadsCreated,
      appointmentsScheduled,
      projectsClosed,
    };
  });

  if (isSetters) {
    // Para el tab de Setters, ordenamos por Citas Agendadas, luego Leads, luego Puertas
    data.sort((a, b) => b.appointmentsScheduled - a.appointmentsScheduled || b.leadsCreated - a.leadsCreated || b.doors - a.doors);
  } else {
    // Para el tab de Closers, ordenamos por Proyectos Cerrados
    data.sort((a, b) => b.projectsClosed - a.projectsClosed);
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
