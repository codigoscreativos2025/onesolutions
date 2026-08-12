import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("admin", 10);

  // 1. Crear 5 PARTNER users
  const partnerEmails = [
    "partner1@onesolutions.com",
    "partner2@onesolutions.com",
    "partner3@onesolutions.com",
    "partner4@onesolutions.com",
    "partner5@onesolutions.com",
  ];
  const partners: { id: number; name: string; email: string }[] = [];
  for (let i = 0; i < 5; i++) {
    const name = `Partner Test ${i + 1}`;
    const email = partnerEmails[i];
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      partners.push({ id: existing.id, name: existing.name, email });
    } else {
      const u = await prisma.user.create({
        data: { email, name, password: hash, role: "PARTNER" },
      });
      partners.push({ id: u.id, name, email });
    }
  }
  console.log("Partners listos:", partners.map((p) => `${p.name} (${p.email})`).join(", "));

  // 2. Buscar o crear una parcela + visita en PROJECT
  let visitId: number;
  let existingVisit = await prisma.visit.findFirst({ where: { stage: "PROJECT" } });

  if (!existingVisit) {
    const setter = await prisma.user.findFirst({ where: { role: "SETTER" } });
    const parcel = await prisma.parcel.create({
      data: {
        id: `test-partner-parcel-${Date.now()}`,
        address: "Calle Test Partners 123",
        ownerName: "Cliente Partner Test",
        geometry: JSON.stringify({ type: "Polygon", coordinates: [] }),
        status: "CUSTOMER",
      },
    });
    existingVisit = await prisma.visit.create({
      data: {
        parcelId: parcel.id,
        setterId: setter ? setter.id : 1,
        stage: "PROJECT",
      },
    });
  }
  visitId = existingVisit.id;

  console.log(`Visit de prueba: #${visitId}`);

  // 3. Asignar 5 contratos con 5 partners distintos
  const contractNames = ["Fence", "Purificacion de agua", "Otros", "Techo", "Panel Solar"];
  for (let i = 0; i < 5; i++) {
    const pt = await prisma.projectType.findFirst({ where: { name: contractNames[i] } });
    if (!pt) {
      console.log(`  Omitido: tipo de proyecto "${contractNames[i]}" no existe`);
      continue;
    }
    const partner = partners[i];
    await prisma.visitProject.upsert({
      where: { visitId_projectTypeId: { visitId: visitId, projectTypeId: pt.id } },
      update: { partnerId: partner.id },
      create: { visitId: visitId, projectTypeId: pt.id, partnerId: partner.id },
    });
    console.log(`  Contrato ${contractNames[i]} -> partner ${partner.name}`);
  }

  // 4. Crear chat GENERAL
  const existingGeneral = await prisma.chatRoom.findFirst({
    where: { visitId: visitId, type: "GENERAL" },
  });
  if (!existingGeneral) {
    await prisma.chatRoom.create({
      data: {
        visitId: visitId,
        type: "GENERAL",
        messages: { create: { userId: partners[0].id, body: "Chat interno de prueba" } },
      },
    });
  }
  console.log("Chat GENERAL creado");

  // 5. Crear chat PARTNER por cada partner
  for (const partner of partners) {
    const existingRoom = await prisma.chatRoom.findFirst({
      where: { visitId: visitId, type: "PARTNER", partnerId: partner.id },
    });
    if (!existingRoom) {
      await prisma.chatRoom.create({
        data: {
          visitId: visitId,
          type: "PARTNER",
          partnerId: partner.id,
          messages: { create: { userId: partner.id, body: `Chat partner de ${partner.name}` } },
        },
      });
    }
    console.log(`Chat PARTNER creado para ${partner.name}`);
  }

  console.log("\n=== LOGINS DE PRUEBA (password: admin) ===");
  partners.forEach((p) => console.log(`  ${p.email} / admin`));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
