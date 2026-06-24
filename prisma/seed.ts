import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin", 10);
  const closerPasswordHash = await bcrypt.hash("closer", 10);
  const setterPasswordHash = await bcrypt.hash("setter", 10);

  // Admin
  await prisma.user.upsert({
    where: { email: "admin@onesolutions.com" },
    update: {},
    create: {
      email: "admin@onesolutions.com",
      name: "Admin",
      password: passwordHash,
      role: "ADMIN",
    },
  });

  // Closer
  const closer = await prisma.user.upsert({
    where: { email: "closer@onesolutions.com" },
    update: {},
    create: {
      email: "closer@onesolutions.com",
      name: "Carlos Mendoza",
      password: closerPasswordHash,
      role: "CLOSER",
    },
  });

  // Setter asignado al closer
  await prisma.user.upsert({
    where: { email: "setter@onesolutions.com" },
    update: {},
    create: {
      email: "setter@onesolutions.com",
      name: "Alex Rivera",
      password: setterPasswordHash,
      role: "SETTER",
      closerId: closer.id,
    },
  });

  // Slots de prueba para el closer
  await prisma.closerSlot.deleteMany({
    where: { closerId: closer.id },
  });

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const slots = [
    { dayOffset: 0, hour: 10, workday: true },
    { dayOffset: 0, hour: 14, workday: true },
    { dayOffset: 0, hour: 16, workday: true },
    { dayOffset: 1, hour: 9, workday: true },
    { dayOffset: 1, hour: 11, workday: true },
    { dayOffset: 1, hour: 15, workday: true },
    { dayOffset: 2, hour: 10, workday: true },
  ];

  for (const slot of slots) {
    const startAt = new Date(now);
    startAt.setDate(startAt.getDate() + slot.dayOffset);
    startAt.setHours(slot.hour, 0, 0, 0);
    const endAt = new Date(startAt);
    endAt.setHours(startAt.getHours() + 1);

    await prisma.closerSlot.create({
      data: {
        closerId: closer.id,
        startAt,
        endAt,
        isWorkday: slot.workday,
      },
    });
  }

  // Objeciones de ejemplo
  const objections = [
    { key: "high-price", name: "Precio elevado", nameEn: "High price", color: "#fb7800" },
    { key: "not-interested", name: "No le interesa", nameEn: "Not interested", color: "#ba1a1a" },
    { key: "has-panels", name: "Ya tiene paneles", nameEn: "Already has panels", color: "#006e00" },
    { key: "bad-experience", name: "Mala experiencia previa", nameEn: "Bad previous experience", color: "#994700" },
    { key: "bad-roof", name: "Techo en mal estado", nameEn: "Roof in bad condition", color: "#545f64" },
    { key: "tenant", name: "Arrendatario, no dueño", nameEn: "Tenant, not owner", color: "#6d787d" },
  ];

  for (const obj of objections) {
    await prisma.objection.upsert({
      where: { key: obj.key },
      update: {},
      create: obj,
    });
  }

  // Parcelas de muestra en Orlando, FL
  const parcels = [
    {
      id: "parcel-1",
      address: "2419 Lake Orange Dr, Orlando, FL 32837",
      ownerName: "Robert J. Wilson",
      status: "AVAILABLE",
      geometry: JSON.stringify({
        type: "Polygon",
        coordinates: [[
          [-81.365, 28.385],
          [-81.364, 28.385],
          [-81.364, 28.384],
          [-81.365, 28.384],
          [-81.365, 28.385],
        ]],
      }),
      metadata: JSON.stringify({
        roofAge: "4 Years (Good)",
        utility: "$185 - $210/mo",
        solarPotential: "High",
      }),
    },
    {
      id: "parcel-2",
      address: "2421 Lake Orange Dr, Orlando, FL 32837",
      ownerName: "Maria Garcia",
      status: "LEAD",
      geometry: JSON.stringify({
        type: "Polygon",
        coordinates: [[
          [-81.363, 28.386],
          [-81.362, 28.386],
          [-81.362, 28.385],
          [-81.363, 28.385],
          [-81.363, 28.386],
        ]],
      }),
      metadata: JSON.stringify({
        roofAge: "8 Years (Good)",
        utility: "$210 - $240/mo",
        solarPotential: "Medium",
      }),
    },
    {
      id: "parcel-3",
      address: "2415 Lake Orange Dr, Orlando, FL 32837",
      ownerName: "John Smith",
      status: "CUSTOMER",
      geometry: JSON.stringify({
        type: "Polygon",
        coordinates: [[
          [-81.367, 28.384],
          [-81.366, 28.384],
          [-81.366, 28.383],
          [-81.367, 28.383],
          [-81.367, 28.384],
        ]],
      }),
      metadata: JSON.stringify({
        roofAge: "2 Years (Excellent)",
        utility: "$150 - $180/mo",
        solarPotential: "High",
      }),
    },
  ];

  for (const parcel of parcels) {
    await prisma.parcel.upsert({
      where: { id: parcel.id },
      update: {},
      create: parcel,
    });
  }

  console.log("Seed completado");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
