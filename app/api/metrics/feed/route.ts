import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Get recent visits with significant stages
  const recentVisits = await prisma.visit.findMany({
    where: {
      stage: {
        in: ["MANUAL_LEAD", "POTENTIAL", "PROJECT_IN_PROGRESS", "CLOSED"]
      }
    },
    include: {
      parcel: { select: { address: true, ownerName: true } },
      setter: { select: { name: true } },
      closer: { select: { name: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  // 2. Get recent reassignments (Traspasos)
  const recentReassignments = await prisma.slotReassignment.findMany({
    include: {
      slot: { include: { visit: { include: { parcel: { select: { address: true } } } } } },
      fromCloser: { select: { name: true } },
      toCloser: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  // 3. Get recent request close notifications
  const recentRequests = await prisma.notification.findMany({
    where: { title: "Solicitud de Cierre" },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  // Format and combine
  const feedItems: any[] = [];

  // Map Visits
  recentVisits.forEach(v => {
    const address = v.parcel?.address || "Dirección desconocida";
    const setterName = v.setter?.name ? v.setter.name.split(" ")[0] : "Un Trainee";
    const closerName = v.closer?.name ? v.closer.name.split(" ")[0] : "Un Closer";

    let title = "";
    let body = "";
    let borderColor = "";
    let bgColor = "";
    let iconBgColor = "";
    let iconColor = "";

    if (v.stage === "MANUAL_LEAD") {
      title = "🔥 Nuevo Lead Manual";
      body = `${setterName} ha creado un nuevo lead manual en ${address}.`;
      borderColor = "border-l-blue-400"; bgColor = "bg-blue-500/5"; iconBgColor = "bg-blue-100 dark:bg-blue-500/20"; iconColor = "text-blue-500";
    } else if (v.stage === "POTENTIAL") {
      title = "⭐ Lead a Potencial";
      body = `¡El lead en ${address} pasó a Potencial! (Captado por ${setterName}).`;
      borderColor = "border-l-orange-400"; bgColor = "bg-orange-500/5"; iconBgColor = "bg-orange-100 dark:bg-orange-500/20"; iconColor = "text-orange-500";
    } else if (v.stage === "PROJECT_IN_PROGRESS") {
      title = "🔨 Lead en Proyecto";
      body = `¡El lead en ${address} se ha convertido en proyecto! A cargo de ${closerName}.`;
      borderColor = "border-l-purple-400"; bgColor = "bg-purple-500/5"; iconBgColor = "bg-purple-100 dark:bg-purple-500/20"; iconColor = "text-purple-500";
    } else if (v.stage === "CLOSED") {
      title = "💰 ¡Lead Cerrado!";
      const closedBy = (v.closer?.role === "ADMIN") ? "El Administrador" : closerName;
      body = `¡Boom! ${closedBy} acaba de cerrar exitosamente el proyecto en ${address}.`;
      borderColor = "border-l-green-400"; bgColor = "bg-green-500/5"; iconBgColor = "bg-green-100 dark:bg-green-500/20"; iconColor = "text-green-500";
    }

    feedItems.push({
      id: `v_${v.id}`,
      title,
      body,
      link: `/lead/${v.id}`,
      createdAt: v.createdAt,
      isRead: true,
      borderColor, bgColor, iconBgColor, iconColor
    });
  });

  // Map Reassignments (Traspaso)
  recentReassignments.forEach(r => {
    const fromName = r.fromCloser?.name ? r.fromCloser.name.split(" ")[0] : "Alguien";
    const toName = r.toCloser?.name ? r.toCloser.name.split(" ")[0] : "otro";
    const address = r.slot?.visit?.parcel?.address || "un lead";

    feedItems.push({
      id: `r_${r.id}`,
      title: "🔄 Traspaso de Lead",
      body: `El lead en ${address} ha sido traspasado de ${fromName} a ${toName}.`,
      link: r.slot?.visitId ? `/lead/${r.slot.visitId}` : null,
      createdAt: r.createdAt,
      isRead: true,
      borderColor: "border-l-yellow-400",
      bgColor: "bg-yellow-500/5",
      iconBgColor: "bg-yellow-100 dark:bg-yellow-500/20",
      iconColor: "text-yellow-500"
    });
  });

  // Map Request Closes
  recentRequests.forEach(r => {
    feedItems.push({
      id: `req_${r.id}`,
      title: "🔔 Solicitud de Cierre",
      body: r.body,
      link: r.link,
      createdAt: r.createdAt,
      isRead: true,
      borderColor: "border-l-red-400",
      bgColor: "bg-red-500/5",
      iconBgColor: "bg-red-100 dark:bg-red-500/20",
      iconColor: "text-red-500"
    });
  });

  // Sort by date descending and take top 20
  feedItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const finalFeed = feedItems.slice(0, 20);

  return NextResponse.json(finalFeed);
}
