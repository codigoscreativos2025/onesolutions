import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.notification.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatRoom.deleteMany();
  await prisma.visitCloserObjection.deleteMany();
  await prisma.visitObjection.deleteMany();
  await prisma.projectDetails.deleteMany();
  await prisma.visitProject.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.closerSlot.deleteMany();
  await prisma.weeklyPattern.deleteMany();
  await prisma.slotReassignment.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.businessGoal.deleteMany();
  await prisma.parcelVisitHistory.deleteMany();
  await prisma.parcel.deleteMany();
  await prisma.objection.deleteMany();
  await prisma.closerObjection.deleteMany();
  await prisma.projectType.deleteMany();
  await prisma.user.deleteMany();

  const adminHash = await bcrypt.hash("admin", 10);
  const closerHash = await bcrypt.hash("closer", 10);
  const setterHash = await bcrypt.hash("setter", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@onesolutions.com",
      name: "Admin Principal",
      password: adminHash,
      role: "ADMIN",
    },
  });

  const closer1 = await prisma.user.create({
    data: {
      email: "closer@onesolutions.com",
      name: "Carlos Mendoza",
      password: closerHash,
      role: "CLOSER",
    },
  });

  const closer2 = await prisma.user.create({
    data: {
      email: "closer2@onesolutions.com",
      name: "Ana Torres",
      password: closerHash,
      role: "CLOSER",
    },
  });

  const setter1 = await prisma.user.create({
    data: {
      email: "setter@onesolutions.com",
      name: "Alex Rivera",
      password: setterHash,
      role: "SETTER",
      closerId: closer1.id,
    },
  });

  const setter2 = await prisma.user.create({
    data: {
      email: "setter2@onesolutions.com",
      name: "Maria Lopez",
      password: setterHash,
      role: "SETTER",
      closerId: closer1.id,
    },
  });

  const setter3 = await prisma.user.create({
    data: {
      email: "setter3@onesolutions.com",
      name: "Juan Perez",
      password: setterHash,
      role: "SETTER",
      closerId: closer2.id,
    },
  });

  const projectTypes = [
    { name: "Campos Comunes", description: "Campos obligatorios comunes a todos los proyectos. Configúralos desde Admin > Campos de Proyectos" },
    { name: "Panel Solar", description: "Instalación de paneles solares" },
    { name: "Fence", description: "Cercas y vallas" },
    { name: "Aires Acondicionados", description: "Instalación y mantenimiento AC" },
    { name: "Screens", description: "Pantallas y mallas" },
    { name: "Screens in Closer", description: "Pantallas para cerramientos" },
    { name: "Gutters", description: "Canaletas y desagües" },
    { name: "Jardines", description: "Diseño y mantenimiento de jardines" },
    { name: "Corte de Árbol", description: "Poda y remoción de árboles" },
    { name: "Remodelación", description: "Remodelación general" },
  ];

  for (const pt of projectTypes) {
    await prisma.projectType.create({ data: pt });
  }

  const setterObjections = [
    { key: "high-price", name: "Precio elevado", nameEn: "High price", color: "#fb7800" },
    { key: "not-interested", name: "No le interesa", nameEn: "Not interested", color: "#ba1a1a" },
    { key: "has-panels", name: "Ya tiene paneles", nameEn: "Already has panels", color: "#006e00" },
    { key: "bad-experience", name: "Mala experiencia previa", nameEn: "Bad previous experience", color: "#994700" },
    { key: "bad-roof", name: "Techo en mal estado", nameEn: "Roof in bad condition", color: "#545f64" },
    { key: "tenant", name: "Arrendatario, no dueño", nameEn: "Tenant, not owner", color: "#6d787d" },
    { key: "need-think", name: "Necesita pensarlo", nameEn: "Needs to think about it", color: "#545f64" },
    { key: "spouse-absent", name: "Cónyuge no presente", nameEn: "Spouse not present", color: "#994700" },
  ];

  for (const obj of setterObjections) {
    await prisma.objection.create({ data: obj });
  }

  const closerObjections = [
    { key: "financing-issue", name: "Problema con financiamiento", nameEn: "Financing issue", color: "#ba1a1a" },
    { key: "hoa-denied", name: "HOA no aprobó", nameEn: "HOA denied", color: "#fb7800" },
    { key: "inspection-fail", name: "Inspección fallida", nameEn: "Inspection failed", color: "#545f64" },
    { key: "client-backout", name: "Cliente se retractó", nameEn: "Client backed out", color: "#994700" },
    { key: "schedule-conflict", name: "Conflicto de agenda", nameEn: "Schedule conflict", color: "#6d787d" },
    { key: "permit-delay", name: "Retraso en permisos", nameEn: "Permit delay", color: "#545f64" },
  ];

  for (const obj of closerObjections) {
    await prisma.closerObjection.create({ data: obj });
  }

  const setterBadges = [
    { name: "Bronce Setter", description: "Primeros pasos", icon: "🥉", color: "#cd7f32", role: "SETTER", doorsThreshold: 50, prospectsThreshold: 5 },
    { name: "Plata Setter", description: "Vendedor consistente", icon: "🥈", color: "#c0c0c0", role: "SETTER", doorsThreshold: 200, prospectsThreshold: 20 },
    { name: "Oro Setter", description: "Top performer", icon: "🥇", color: "#ffd700", role: "SETTER", doorsThreshold: 500, prospectsThreshold: 50 },
    { name: "Diamante Setter", description: "Leyenda de ventas", icon: "💎", color: "#b9f2ff", role: "SETTER", doorsThreshold: 1000, prospectsThreshold: 100 },
  ];

  const closerBadges = [
    { name: "Bronce Closer", description: "Primer cierre", icon: "🥉", color: "#cd7f32", role: "CLOSER", projectsThreshold: 5 },
    { name: "Plata Closer", description: "Closer confiable", icon: "🥈", color: "#c0c0c0", role: "CLOSER", projectsThreshold: 20 },
    { name: "Oro Closer", description: "Master closer", icon: "🥇", color: "#ffd700", role: "CLOSER", projectsThreshold: 50 },
    { name: "Diamante Closer", description: "Leyenda del cierre", icon: "💎", color: "#b9f2ff", role: "CLOSER", projectsThreshold: 100 },
  ];

  for (const badge of [...setterBadges, ...closerBadges]) {
    await prisma.badge.create({ data: badge });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  await prisma.businessGoal.create({
    data: {
      period: "monthly",
      doorsGoal: 1000,
      prospectsGoal: 100,
      projectsGoal: 30,
      startDate: startOfMonth,
      endDate: endOfMonth,
    },
  });

  await prisma.businessGoal.create({
    data: {
      period: "weekly",
      doorsGoal: 250,
      prospectsGoal: 25,
      projectsGoal: 8,
      startDate: startOfWeek,
      endDate: endOfWeek,
    },
  });

  const parcels = [
    {
      id: "parcel-1",
      address: "2419 Lake Orange Dr, Orlando, FL 32837",
      ownerName: "Robert J. Wilson",
      geometry: JSON.stringify({
        type: "Polygon",
        coordinates: [[
          [-81.365, 28.385], [-81.364, 28.385], [-81.364, 28.384],
          [-81.365, 28.384], [-81.365, 28.385],
        ]],
      }),
      metadata: JSON.stringify({ roofAge: "4 Years (Good)", utility: "$185 - $210/mo", solarPotential: "High" }),
    },
    {
      id: "parcel-2",
      address: "2421 Lake Orange Dr, Orlando, FL 32837",
      ownerName: "Maria Garcia",
      geometry: JSON.stringify({
        type: "Polygon",
        coordinates: [[
          [-81.363, 28.386], [-81.362, 28.386], [-81.362, 28.385],
          [-81.363, 28.385], [-81.363, 28.386],
        ]],
      }),
      metadata: JSON.stringify({ roofAge: "8 Years (Good)", utility: "$210 - $240/mo", solarPotential: "Medium" }),
    },
    {
      id: "parcel-3",
      address: "2415 Lake Orange Dr, Orlando, FL 32837",
      ownerName: "John Smith",
      geometry: JSON.stringify({
        type: "Polygon",
        coordinates: [[
          [-81.367, 28.384], [-81.366, 28.384], [-81.366, 28.383],
          [-81.367, 28.383], [-81.367, 28.384],
        ]],
      }),
      metadata: JSON.stringify({ roofAge: "2 Years (Excellent)", utility: "$150 - $180/mo", solarPotential: "High" }),
    },
    {
      id: "parcel-4",
      address: "2423 Lake Orange Dr, Orlando, FL 32837",
      ownerName: "Sarah Johnson",
      geometry: JSON.stringify({
        type: "Polygon",
        coordinates: [[
          [-81.361, 28.387], [-81.360, 28.387], [-81.360, 28.386],
          [-81.361, 28.386], [-81.361, 28.387],
        ]],
      }),
      metadata: JSON.stringify({ roofAge: "6 Years (Good)", utility: "$195 - $220/mo", solarPotential: "High" }),
    },
    {
      id: "parcel-5",
      address: "2425 Lake Orange Dr, Orlando, FL 32837",
      ownerName: "Michael Brown",
      geometry: JSON.stringify({
        type: "Polygon",
        coordinates: [[
          [-81.359, 28.388], [-81.358, 28.388], [-81.358, 28.387],
          [-81.359, 28.387], [-81.359, 28.388],
        ]],
      }),
      metadata: JSON.stringify({ roofAge: "3 Years (Excellent)", utility: "$175 - $200/mo", solarPotential: "Medium" }),
    },
    {
      id: "parcel-6",
      address: "2427 Lake Orange Dr, Orlando, FL 32837",
      ownerName: "Emily Davis",
      geometry: JSON.stringify({
        type: "Polygon",
        coordinates: [[
          [-81.357, 28.389], [-81.356, 28.389], [-81.356, 28.388],
          [-81.357, 28.388], [-81.357, 28.389],
        ]],
      }),
      metadata: JSON.stringify({ roofAge: "5 Years (Good)", utility: "$200 - $225/mo", solarPotential: "High" }),
    },
    {
      id: "parcel-7",
      address: "2429 Lake Orange Dr, Orlando, FL 32837",
      ownerName: "David Martinez",
      geometry: JSON.stringify({
        type: "Polygon",
        coordinates: [[
          [-81.355, 28.390], [-81.354, 28.390], [-81.354, 28.389],
          [-81.355, 28.389], [-81.355, 28.390],
        ]],
      }),
      metadata: JSON.stringify({ roofAge: "7 Years (Fair)", utility: "$220 - $250/mo", solarPotential: "Medium" }),
    },
  ];

  for (const parcel of parcels) {
    await prisma.parcel.create({ data: parcel });
  }

  console.log("Seed completado - datos limpios listos para empezar");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
