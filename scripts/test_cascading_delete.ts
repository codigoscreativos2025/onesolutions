import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Cleanup just in case
  await prisma.user.deleteMany({ where: { email: { in: ["test_setter_delete@onesolutions.com", "test_closer_delete@onesolutions.com"] } } });
  await prisma.parcel.deleteMany({ where: { id: "parcel_test_delete" } });

  console.log("Creando usuarios de prueba...");
  const setter = await prisma.user.create({
    data: {
      email: "test_setter_delete@onesolutions.com",
      name: "Test Setter",
      role: "SETTER",
      password: "password",
      encryptedPassword: "password",
      profile: {
        create: {
          address: "123 Test St",
        },
      },
    },
  });

  const closer = await prisma.user.create({
    data: {
      email: "test_closer_delete@onesolutions.com",
      name: "Test Closer",
      role: "CLOSER",
      password: "password",
      encryptedPassword: "password",
    },
  });

  console.log("Creando parcela (lead)...");
  const parcel = await prisma.parcel.create({
    data: {
      id: "parcel_test_delete",
      address: "123 Delete Me Ave",
      geometry: "{}",
      status: "LEAD",
      setterId: setter.id,
    },
  });

  console.log("Creando visita y dependencias...");
  const visit = await prisma.visit.create({
    data: {
      parcelId: parcel.id,
      setterId: setter.id,
      closerId: closer.id,
      stage: "EN_PROCESO",
      bill: {
        create: {
          clientName: "John Delete",
          phone: "555-5555",
        },
      },
      notes: {
        create: [
          { content: "Test note 1", userId: setter.id },
          { content: "Test note 2", userId: closer.id },
        ],
      },
    },
  });

  console.log("Usuarios y dependencias creadas. Setter ID:", setter.id, "Closer ID:", closer.id, "Visit ID:", visit.id);

  // Ahora simulamos el borrado del Setter utilizando el mismo código de la ruta
  console.log("=== INICIANDO BORRADO DEL SETTER ===");
  try {
    const userId = setter.id;
    await prisma.$transaction(async (tx) => {
      const visits = await tx.visit.findMany({
        where: { OR: [{ setterId: userId }, { closerId: userId }] },
        select: { id: true, parcelId: true },
      });
      const visitIds = visits.map((v) => v.id);
      const parcelIdsFromVisits = visits.map((v) => v.parcelId);

      const parcels = await tx.parcel.findMany({
        where: { OR: [{ setterId: userId }, { partnerId: userId }] },
        select: { id: true },
      });
      const allParcelIds = Array.from(
        new Set([...parcelIdsFromVisits, ...parcels.map((p) => p.id)])
      );

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

      if (allParcelIds.length > 0) {
        await tx.parcelVisitHistory.deleteMany({ where: { parcelId: { in: allParcelIds } } });
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
      await tx.visitProject.deleteMany({ where: { partnerId: userId } });

      await tx.user.updateMany({
        where: { closerId: userId },
        data: { closerId: null },
      });

      await tx.user.delete({ where: { id: userId } });
    });
    console.log("✅ Setter eliminado exitosamente con todos sus registros en cascada.");
  } catch (e) {
    console.error("❌ Falló el borrado del setter:", e);
  }

  // Ahora simulamos el borrado del Closer que quedó (ya no tiene la visita porque se borró por el parcel, pero igual validamos que su cuenta se borre)
  console.log("=== INICIANDO BORRADO DEL CLOSER ===");
  try {
    const userId = closer.id;
    await prisma.$transaction(async (tx) => {
      const visits = await tx.visit.findMany({
        where: { OR: [{ setterId: userId }, { closerId: userId }] },
        select: { id: true, parcelId: true },
      });
      const visitIds = visits.map((v) => v.id);
      const parcelIdsFromVisits = visits.map((v) => v.parcelId);

      const parcels = await tx.parcel.findMany({
        where: { OR: [{ setterId: userId }, { partnerId: userId }] },
        select: { id: true },
      });
      const allParcelIds = Array.from(
        new Set([...parcelIdsFromVisits, ...parcels.map((p) => p.id)])
      );

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

      if (allParcelIds.length > 0) {
        await tx.parcelVisitHistory.deleteMany({ where: { parcelId: { in: allParcelIds } } });
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
      await tx.visitProject.deleteMany({ where: { partnerId: userId } });

      await tx.user.updateMany({
        where: { closerId: userId },
        data: { closerId: null },
      });

      await tx.user.delete({ where: { id: userId } });
    });
    console.log("✅ Closer eliminado exitosamente.");
  } catch (e) {
    console.error("❌ Falló el borrado del closer:", e);
  }

}

main().catch(console.error).finally(() => prisma.$disconnect());
