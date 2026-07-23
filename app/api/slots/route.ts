import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { emailTemplates } from "@/lib/email-templates";
import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const closerIdParam = searchParams.get("closerId");

  const userId = parseInt(session.user.id);
  const role = session.user.role;

  // Si es setter, solo puede ver slots si proporciona un closerId específico
  if (role === "SETTER" && !closerIdParam) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Determinar qué closerId usar
  const closerId = closerIdParam ? parseInt(closerIdParam) : userId;

  const slots = await prisma.closerSlot.findMany({
    where: { closerId },
    orderBy: { startAt: "asc" },
    include: {
      visit: {
        include: {
          parcel: {
            select: { id: true, address: true },
          },
          setter: {
            select: { id: true, name: true },
          },
          projects: {
            include: {
              projectType: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json(slots);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.user.id);

  if (session.user.role === "SETTER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Validar que el usuario existe
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await request.json();
  const { date, hour, isWorkday } = body;

  if (!date || hour === undefined) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const startAt = new Date(`${date}T${hour}:00:00`);
  const endAt = new Date(startAt);
  endAt.setHours(startAt.getHours() + 1);

  const slotDateStr = startAt.toISOString().split("T")[0];
  const existingSlots = await prisma.closerSlot.findMany({
    where: {
      closerId: userId,
      startAt: {
        gte: new Date(`${slotDateStr}T00:00:00`),
        lt: new Date(`${slotDateStr}T23:59:59`),
      },
    },
  });

  const isOverlapping = existingSlots.some(
    (s) => startAt < s.endAt && s.startAt < endAt
  );
  if (isOverlapping) {
    return NextResponse.json(
      { error: "El horario se solapa con un slot existente" },
      { status: 400 }
    );
  }

  const slot = await prisma.closerSlot.create({
    data: {
      closerId: userId,
      startAt,
      endAt,
      isWorkday: isWorkday !== false,
    },
  });

  try {
    const { setterId, address } = body;
    if (setterId) {
      const setter = await prisma.user.findUnique({
        where: { id: parseInt(String(setterId)) },
        select: { email: true, name: true },
      });
      if (setter?.email) {
        const formattedDate = startAt.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
        const formattedTime = startAt.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
        await sendEmail({
          to: setter.email,
          subject: "Recordatorio de Visita - One Solutions",
          html: emailTemplates.reminderVisit(setter.name, address || "Visita agendada", formattedDate, formattedTime),
        });
      }
    }
  } catch (emailError) {
    console.error("Error sending slot reminder email:", emailError);
  }

  return NextResponse.json(slot, { status: 201 });
}
