import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const visit = await prisma.visit.findUnique({
      where: { id: parseInt(id) },
      include: {
        parcel: { select: { address: true, ownerName: true } },
        bill: { select: { clientName: true } },
      },
    });

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    const userName = session.user.name || "Usuario";
    const clientName = visit.bill?.clientName || visit.parcel.ownerName || "cliente";

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (admins.length === 0) {
      return NextResponse.json({ message: "No admins to notify" });
    }

    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        title: "Solicitud de Cierre",
        body: `${userName} solicita cerrar el proyecto de ${clientName}`,
        link: `/admin/crm`,
      })),
    });

    return NextResponse.json({ message: "Close request sent" });
  } catch (error) {
    console.error("Error requesting close:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
