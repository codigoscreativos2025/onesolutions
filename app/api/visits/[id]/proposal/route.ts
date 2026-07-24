import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { emailTemplates } from "@/lib/email-templates";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { phone, clientName, clientEmail, billImageUrl, notes, slotId, closerId, projectTypeIds, directSale } = body;

  if (!phone) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  if (!directSale && (!slotId || !closerId)) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // billImageUrl es opcional (recibo de luz no obligatorio)

  try {
    const existingBill = await prisma.bill.findUnique({
      where: { visitId: parseInt(id) },
    });

    if (existingBill) {
      await prisma.bill.update({
        where: { visitId: parseInt(id) },
        data: {
          imageUrl: billImageUrl,
          phone,
          clientName,
          clientEmail,
          notes,
        },
      });
    } else {
      await prisma.bill.create({
        data: {
          visitId: parseInt(id),
          imageUrl: billImageUrl,
          phone,
          clientName,
          clientEmail,
          notes,
        },
      });
    }

    if (!directSale && slotId) {
      await prisma.closerSlot.update({
        where: { id: parseInt(slotId) },
        data: { isBooked: true },
      });
    }

    const effectiveCloserId = directSale ? parseInt(session.user.id) : parseInt(closerId);

    const visitUpdateData: Record<string, unknown> = {
      stage: "PROPOSAL_ACCEPTED",
      outcome: "PROPOSAL_ACCEPTED",
      closerId: effectiveCloserId,
      notes,
    };

    if (!directSale && slotId) {
      visitUpdateData.slot = { connect: { id: parseInt(slotId) } };
    }

    const visit = await prisma.visit.update({
      where: { id: parseInt(id) },
      data: visitUpdateData,
      include: {
        parcel: { select: { address: true } },
      },
    });

    // Guardar proyectos seleccionados
    if (projectTypeIds && Array.isArray(projectTypeIds) && projectTypeIds.length > 0) {
      // Eliminar proyectos existentes
      await prisma.visitProject.deleteMany({
        where: { visitId: parseInt(id) },
      });

      // Crear nuevos proyectos
      await prisma.visitProject.createMany({
        data: projectTypeIds.map((projectTypeId: number) => ({
          visitId: parseInt(id),
          projectTypeId,
        })),
      });
    }

    // Crear notificación para el closer
    if (!directSale) {
      await prisma.notification.create({
        data: {
          userId: effectiveCloserId,
          title: "Nueva cita asignada",
          body: `Te han asignado una nueva cita de un Trainee.`,
          link: `/calendar?highlight=${visit.id}`,
        },
      });
    }

    try {
      const closer = await prisma.user.findUnique({
        where: { id: effectiveCloserId },
        select: { email: true, name: true },
      });
      if (closer?.email) {
        await sendEmail({
          to: closer.email,
          subject: "Propuesta Aceptada - One Solutions",
          html: emailTemplates.projectProgress(closer.name, visit.parcel.address, "Propuesta Aceptada"),
        });
      }
    } catch (emailError) {
      console.error("Error sending proposal notification:", emailError);
    }

    return NextResponse.json(visit);
  } catch (error) {
    console.error("Error submitting proposal:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
