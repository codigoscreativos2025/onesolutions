import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const visitId = parseInt(id);

  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    include: { slot: true, parcel: { select: { address: true } } },
  });

  if (!visit) {
    return NextResponse.json({ error: "Visit not found" }, { status: 404 });
  }

  const body = await request.json();
  const { contractSignatures, contractFields, contractType, commissions, rejectionReason, setterId, closerId, bill, partnerId, projectTypeIds, ...updateData } = body;

  // Handle project type updates
  if (projectTypeIds !== undefined && Array.isArray(projectTypeIds)) {
    await prisma.visitProject.deleteMany({ where: { visitId } });
    if (projectTypeIds.length > 0) {
      await prisma.visitProject.createMany({
        data: projectTypeIds.map((ptId: number) => ({ visitId, projectTypeId: ptId })),
      });
    }
  }

  // Handle bill upsert separately (Prisma doesn't support nested upsert in visit.update for SQLite)
  if (bill) {
    const existingBill = await prisma.bill.findUnique({ where: { visitId } });
    if (existingBill) {
      await prisma.bill.update({ where: { visitId }, data: bill.upsert?.update || bill.upsert?.create || bill });
    } else {
      await prisma.bill.create({ data: { ...bill.upsert?.create, visitId } });
    }
  }

  if (partnerId !== undefined && visit.parcelId) {
    await prisma.parcel.update({
      where: { id: visit.parcelId },
      data: { partnerId: partnerId || null, lastUpdatedAt: new Date() },
    });

    if (partnerId) {
      const existingPartnerRoom = await prisma.chatRoom.findFirst({
        where: { visitId: visit.id, type: "PARTNER" },
      });
      if (!existingPartnerRoom) {
        await prisma.chatRoom.create({
          data: {
            visitId: visit.id,
            type: "PARTNER",
            messages: {
              create: {
                userId: parseInt(session.user.id),
                body: "Chat de proyecto con Partner iniciado",
              },
            },
          },
        });
      }
    }
  }


  if (commissions && session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only admins can update commissions" },
      { status: 403 }
    );
  }

  if (commissions && Array.isArray(commissions)) {
    await prisma.closerCommission.deleteMany({
      where: { visitId },
    });

    const validCommissions = commissions.filter(
      (c: { userId: number; percentage: number }) =>
        c.userId && c.percentage !== undefined
    );

    if (validCommissions.length > 0) {
      const roleType = (c: { role?: string }) => c.role || "TRAINEE";
      await prisma.closerCommission.createMany({
        data: validCommissions.map((c: { userId: number; percentage: number; role?: string }) => ({
          visitId,
          userId: c.userId,
          percentage: c.percentage,
          role: roleType(c),
        })),
      });
    }

    return NextResponse.json({ success: true });
  }

  if (contractSignatures && contractType) {
    let existing: Record<string, Record<string, string>> = {};
    if (visit.contractSignatures) {
      try {
        existing = JSON.parse(visit.contractSignatures);
      } catch {}
    }
    existing[contractType] = contractSignatures;

    await prisma.visit.update({
      where: { id: visitId },
      data: { contractSignatures: JSON.stringify(existing) },
    });

    return NextResponse.json({ success: true });
  }

  if (contractFields && contractType) {
    let existing: Record<string, Record<string, string>> = {};
    if (visit.contractFields) {
      try {
        existing = JSON.parse(visit.contractFields);
      } catch {}
    }
    existing[contractType] = contractFields;

    await prisma.visit.update({
      where: { id: visitId },
      data: { contractFields: JSON.stringify(existing) },
    });

    return NextResponse.json({ success: true });
  }

  if (setterId !== undefined || closerId !== undefined) {
    // Allow non-admin to set closerId for the first time (scheduling) or self-assign
    const isFirstTimeCloser = closerId !== undefined && !visit.closerId;
    const isSelfAssign = closerId !== undefined && String(closerId) === session.user.id;
    const isSetToSelf = setterId !== undefined && String(setterId) === session.user.id;
    const isScheduling = updateData.stage === "PROPOSAL_ACCEPTED" || updateData.scheduledAt !== undefined;
    if (session.user.role !== "ADMIN" && !isFirstTimeCloser && !isSelfAssign && !isSetToSelf && !isScheduling) {
      return NextResponse.json({ error: "Only admins can transfer leads" }, { status: 403 });
    }

    const transferData: Record<string, unknown> = { ...updateData };
    if (setterId !== undefined) {
      transferData.setterId = setterId;
      if (visit.parcelId) {
        await prisma.parcel.update({
          where: { id: visit.parcelId },
          data: { setterId, lastUpdatedAt: new Date() },
        });
      }
    }
    if (closerId !== undefined) transferData.closerId = closerId;
    if (updateData.scheduledAt !== undefined) transferData.scheduledAt = new Date(updateData.scheduledAt as string);

    await prisma.visit.update({
      where: { id: visitId },
      data: transferData,
    });

    if (transferData.stage === "PROPOSAL_ACCEPTED" && visit.parcelId) {
      await prisma.parcel.update({
        where: { id: visit.parcelId },
        data: { parcelTags: null },
      });
    }

    if (setterId !== undefined) {
      const targetUser = await prisma.user.findUnique({ where: { id: setterId }, select: { role: true } });
      if (targetUser && targetUser.role !== "SETTER") {
        await prisma.notification.create({
          data: {
            userId: setterId,
            title: 'Lead Transferido',
            body: `Se te ha asignado un nuevo lead.`,
            link: `/lead/${visitId}`,
          },
        });
      }
    }
    if (closerId !== undefined && closerId !== setterId) {
      let isPanelSolarAssignment = false;
      if (session.user.role === "SETTER" || session.user.role === "SETTER_JR") {
        const visitProjects = await prisma.visitProject.findMany({
          where: { visitId },
          include: { projectType: true }
        });
        isPanelSolarAssignment = visitProjects.some(vp => vp.projectType.name.toLowerCase().includes("panel solar"));
      }

      if (isPanelSolarAssignment) {
        const address = visit.parcel?.address || "el lead";
        await prisma.notification.create({
          data: {
            userId: closerId,
            title: "Asignado a Panel Solar",
            body: `El Trainee ${session.user.name} te ha seleccionado para el proyecto Panel Solar en ${address}.`,
            link: `/lead/${visitId}`,
          },
        });
      } else {
        await prisma.notification.create({
          data: {
            userId: closerId,
            title: 'Lead Transferido',
            body: `Se te ha asignado un nuevo lead como closer.`,
            link: `/lead/${visitId}`,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  }

  const hasRejection = visit.scheduledAt !== null && updateData.scheduledAt === null && rejectionReason;
  if (hasRejection) {
    await prisma.visit.update({
      where: { id: visitId },
      data: { scheduledAt: null, legacyNotes: rejectionReason ? `[RECHAZO] ${rejectionReason}` : (visit.legacyNotes || null) },
    });

    if (visit.slot?.id) {
      await prisma.closerSlot.update({
        where: { id: visit.slot.id },
        data: { isBooked: false, visitId: null },
      });
    }

    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    const setterName = (await prisma.user.findUnique({ where: { id: visit.setterId }, select: { name: true } }))?.name || "Usuario";

    for (const admin of adminUsers) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: "Cita rechazada",
          body: `${setterName} rechazó una cita. Motivo: ${rejectionReason}`,
          link: "/calendar",
        },
      });
    }

    return NextResponse.json({ success: true });
  }

  if (contractFields && !contractType) {
    updateData.contractFields = contractFields;
  }

  if (Object.keys(updateData).length > 0) {
    if (updateData.stage === "PROJECT") {
      const projectCount = await prisma.visitProject.count({ where: { visitId } });
      if (projectCount === 0) {
        return NextResponse.json({ error: "Debes seleccionar al menos un tipo de proyecto" }, { status: 400 });
      }
    }

    if (updateData.scheduledAt !== undefined && typeof updateData.scheduledAt === 'string') {
      updateData.scheduledAt = new Date(updateData.scheduledAt);
    }

    await prisma.visit.update({
      where: { id: visitId },
      data: updateData,
    });

    if (updateData.stage === "PROPOSAL_ACCEPTED" && visit.parcelId) {
      await prisma.parcel.update({
        where: { id: visit.parcelId },
        data: { parcelTags: null },
      });
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const visitId = parseInt(id);

  try {
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
    });

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    await prisma.chatMessage.deleteMany({ where: { room: { visitId } } });
    await prisma.chatRoom.deleteMany({ where: { visitId } });
    await prisma.visitObjection.deleteMany({ where: { visitId } });
    await prisma.visitCloserObjection.deleteMany({ where: { visitId } });
    await prisma.visitNotAvailableTag.deleteMany({ where: { visitId } });
    await prisma.closerCommission.deleteMany({ where: { visitId } });
    await prisma.visitProject.deleteMany({ where: { visitId } });
    await prisma.projectDetails.deleteMany({ where: { visitId } });
    await prisma.bill.deleteMany({ where: { visitId } });
    await prisma.visitLocation.deleteMany({ where: { visitId } });
    await prisma.closerSlot.updateMany({
      where: { visitId },
      data: { isBooked: false, visitId: null },
    });

    await prisma.visit.delete({
      where: { id: visitId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting visit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
