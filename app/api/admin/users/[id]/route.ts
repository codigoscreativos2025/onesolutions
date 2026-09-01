import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const {
    name,
    email,
    role,
    closerId,
    phone,
    isActive,
    locationValidationEnabled,
    password,
    ssn,
    dateOfBirth,
    bankName,
    routingNumber,
    zelle,
    accountNumber,
    address,
    profilePhoto,
  } = body;

  const data: Record<string, unknown> = {
    name,
    email,
    role,
    phone,
    isActive,
  };

  if (locationValidationEnabled !== undefined) {
    data.locationValidationEnabled = locationValidationEnabled;
  }

  if (password) {
    data.password = await bcrypt.hash(password, 10);
    data.encryptedPassword = encrypt(password);
  }

  if (role === "SETTER" || role === "SETTER_JR") {
    data.closerId = closerId ? parseInt(closerId) : null;
  } else {
    data.closerId = null;
  }

  try {
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data,
    });

    if (
      ssn !== undefined ||
      dateOfBirth !== undefined ||
      bankName !== undefined ||
      routingNumber !== undefined ||
      zelle !== undefined ||
      accountNumber !== undefined ||
      address !== undefined ||
      profilePhoto !== undefined
    ) {
      const profileData: Record<string, unknown> = {};
      if (ssn !== undefined) profileData.ssn = ssn ? encrypt(ssn) : null;
      if (dateOfBirth !== undefined)
        profileData.dateOfBirth = dateOfBirth
          ? new Date(dateOfBirth + "T12:00:00")
          : null;
      if (bankName !== undefined) profileData.bankName = bankName;
      if (routingNumber !== undefined)
        profileData.routingNumber = routingNumber
          ? encrypt(routingNumber)
          : null;
      if (zelle !== undefined) profileData.zelle = zelle;
      if (accountNumber !== undefined)
        profileData.accountNumber = accountNumber;
      if (address !== undefined) profileData.address = address;
      if (profilePhoto !== undefined) profileData.profilePhoto = profilePhoto;

      await prisma.userProfile.upsert({
        where: { userId: parseInt(id) },
        create: { userId: parseInt(id), ...profileData },
        update: profileData,
      });
    }

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const userId = parseInt(id);

    await prisma.$transaction(async (tx) => {
      // Obtener visitas relacionadas
      const visits = await tx.visit.findMany({
        where: { OR: [{ setterId: userId }, { closerId: userId }] },
        select: { id: true, parcelId: true },
      });
      const visitIds = visits.map((v) => v.id);
      const parcelIdsFromVisits = visits.map((v) => v.parcelId);

      // Obtener parcelas relacionadas directamente
      const parcels = await tx.parcel.findMany({
        where: { OR: [{ setterId: userId }, { partnerId: userId }] },
        select: { id: true },
      });
      const allParcelIds = Array.from(
        new Set([...parcelIdsFromVisits, ...parcels.map((p) => p.id)])
      );

      // Eliminar dependencias de visitas (Bills, Projects, etc)
      if (visitIds.length > 0) {
        await tx.bill.deleteMany({ where: { visitId: { in: visitIds } } });
        await tx.projectDetails.deleteMany({ where: { visitId: { in: visitIds } } });
        await tx.visitProject.deleteMany({ where: { visitId: { in: visitIds } } });
        await tx.visitNote.deleteMany({ where: { visitId: { in: visitIds } } });
        await tx.closerCommission.deleteMany({ where: { visitId: { in: visitIds } } });
        await tx.chatRoom.deleteMany({ where: { visitId: { in: visitIds } } });
        await tx.visitObjection.deleteMany({ where: { visitId: { in: visitIds } } });
        await tx.visitCloserObjection.deleteMany({ where: { visitId: { in: visitIds } } });
        await tx.visitNotAvailableTag.deleteMany({ where: { visitId: { in: visitIds } } });
      }

      // Eliminar dependencias de parcelas y luego las parcelas
      if (allParcelIds.length > 0) {
        await tx.parcelVisitHistory.deleteMany({ where: { parcelId: { in: allParcelIds } } });
        // Eliminar las visitas restantes que pertenezcan a estas parcelas
        const remainingVisits = await tx.visit.findMany({
          where: { parcelId: { in: allParcelIds } },
          select: { id: true }
        });
        const remainingVisitIds = remainingVisits.map(v => v.id);
        if (remainingVisitIds.length > 0) {
          await tx.bill.deleteMany({ where: { visitId: { in: remainingVisitIds } } });
          await tx.projectDetails.deleteMany({ where: { visitId: { in: remainingVisitIds } } });
          await tx.visitProject.deleteMany({ where: { visitId: { in: remainingVisitIds } } });
          await tx.visitNote.deleteMany({ where: { visitId: { in: remainingVisitIds } } });
          await tx.closerCommission.deleteMany({ where: { visitId: { in: remainingVisitIds } } });
          await tx.chatRoom.deleteMany({ where: { visitId: { in: remainingVisitIds } } });
          await tx.visitObjection.deleteMany({ where: { visitId: { in: remainingVisitIds } } });
          await tx.visitCloserObjection.deleteMany({ where: { visitId: { in: remainingVisitIds } } });
          await tx.visitNotAvailableTag.deleteMany({ where: { visitId: { in: remainingVisitIds } } });
          await tx.visit.deleteMany({ where: { id: { in: remainingVisitIds } } });
        }
        await tx.parcel.deleteMany({ where: { id: { in: allParcelIds } } });
      }

      // Eliminar dependencias directas del usuario
      await tx.chatMessage.deleteMany({ where: { userId } });
      await tx.chatRoom.deleteMany({ where: { personalUserId: userId } });
      await tx.auditLog.deleteMany({ where: { userId } });
      await tx.visitNote.deleteMany({ where: { userId } });
      await tx.closerCommission.deleteMany({ where: { userId } });
      await tx.slotReassignment.deleteMany({
        where: { OR: [{ fromCloserId: userId }, { toCloserId: userId }] },
      });
      await tx.closerSlot.deleteMany({ where: { closerId: userId } });
      await tx.userProfile.deleteMany({ where: { userId } });
      await tx.userBadge.deleteMany({ where: { userId } });
      await tx.weeklyPattern.deleteMany({ where: { closerId: userId } });
      await tx.visitProject.deleteMany({ where: { partnerId: userId } }); // Si es partner

      // Remover referencia a closers
      await tx.user.updateMany({
        where: { closerId: userId },
        data: { closerId: null },
      });

      // Finalmente eliminar el usuario
      await tx.user.delete({ where: { id: userId } });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error al eliminar usuario:", error);
    return NextResponse.json(
      { error: "No se pudo eliminar el usuario y sus datos asociados." },
      { status: 500 }
    );
  }
}
