import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get recent visits with significant stages
  const recentVisits = await prisma.visit.findMany({
    where: {
      stage: {
        in: ["MANUAL_LEAD", "POTENTIAL", "PROJECT_IN_PROGRESS", "CLOSED"]
      }
    },
    include: {
      parcel: { select: { address: true, ownerName: true } },
      setter: { select: { name: true } },
      closer: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 20
  });

  const feed = recentVisits.map(v => {
    let title = "";
    let body = "";
    
    const address = v.parcel?.address || "Dirección desconocida";
    const setterName = v.setter?.name ? v.setter.name.split(" ")[0] : "Un Trainee";
    const closerName = v.closer?.name ? v.closer.name.split(" ")[0] : "Un Closer";

    if (v.stage === "MANUAL_LEAD") {
      title = "🔥 Nuevo Lead Manual";
      body = `${setterName} ha creado un nuevo lead manual en ${address}.`;
    } else if (v.stage === "POTENTIAL") {
      title = "⭐ Cambio a Potencial";
      body = `¡El lead en ${address} pasó a Potencial! (Captado por ${setterName}).`;
    } else if (v.stage === "PROJECT_IN_PROGRESS") {
      title = "🔨 Proyecto Iniciado";
      body = `¡El proyecto en ${address} está en progreso! A cargo de ${closerName}.`;
    } else if (v.stage === "CLOSED") {
      title = "💰 ¡Proyecto Cerrado!";
      body = `¡Boom! ${closerName} acaba de cerrar el proyecto en ${address}.`;
    }

    return {
      id: v.id,
      title,
      body,
      link: `/lead/${v.id}`,
      createdAt: v.updatedAt, // use updatedAt as the event time
      isRead: true, // it's a global feed, so unread status doesn't apply per-user here
    };
  });

  return NextResponse.json(feed);
}
