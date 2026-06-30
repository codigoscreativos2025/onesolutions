import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Limpiar datos existentes
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
  await prisma.parcel.deleteMany();
  await prisma.objection.deleteMany();
  await prisma.closerObjection.deleteMany();
  await prisma.projectType.deleteMany();
  await prisma.user.deleteMany();

  // Hash de contraseñas
  const adminHash = await bcrypt.hash("admin", 10);
  const closerHash = await bcrypt.hash("closer", 10);
  const setterHash = await bcrypt.hash("setter", 10);

  // ============================================
  // USUARIOS
  // ============================================
  
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

  // ============================================
  // TIPOS DE PROYECTOS
  // ============================================
  
  const projectTypes = [
    { name: "Panel Solar", description: "Instalación de paneles solares" },
    { name: "Techo", description: "Reemplazo o reparación de techo" },
    { name: "Purificador de Agua", description: "Sistemas de purificación" },
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

  // ============================================
  // OBJECIONES DE SETTER
  // ============================================
  
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

  // ============================================
  // OBJECIONES DE CLOSER
  // ============================================
  
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

  // ============================================
  // MEDALLAS / BADGES
  // ============================================
  
  // Medallas para Setters (combinan puertas + prospectos)
  const setterBadges = [
    { name: "Bronce Setter", description: "Primeros pasos", icon: "🥉", color: "#cd7f32", role: "SETTER", doorsThreshold: 50, prospectsThreshold: 5 },
    { name: "Plata Setter", description: "Vendedor consistente", icon: "🥈", color: "#c0c0c0", role: "SETTER", doorsThreshold: 200, prospectsThreshold: 20 },
    { name: "Oro Setter", description: "Top performer", icon: "🥇", color: "#ffd700", role: "SETTER", doorsThreshold: 500, prospectsThreshold: 50 },
    { name: "Diamante Setter", description: "Leyenda de ventas", icon: "💎", color: "#b9f2ff", role: "SETTER", doorsThreshold: 1000, prospectsThreshold: 100 },
  ];

  // Medallas para Closers (proyectos cerrados)
  const closerBadges = [
    { name: "Bronce Closer", description: "Primer cierre", icon: "🥉", color: "#cd7f32", role: "CLOSER", projectsThreshold: 5 },
    { name: "Plata Closer", description: "Closer confiable", icon: "🥈", color: "#c0c0c0", role: "CLOSER", projectsThreshold: 20 },
    { name: "Oro Closer", description: "Master closer", icon: "🥇", color: "#ffd700", role: "CLOSER", projectsThreshold: 50 },
    { name: "Diamante Closer", description: "Leyenda del cierre", icon: "💎", color: "#b9f2ff", role: "CLOSER", projectsThreshold: 100 },
  ];

  for (const badge of [...setterBadges, ...closerBadges]) {
    await prisma.badge.create({ data: badge });
  }

  // ============================================
  // METAS DEL NEGOCIO
  // ============================================
  
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

  // ============================================
  // PARCELAS
  // ============================================
  
  const parcels = [
    {
      id: "parcel-1",
      address: "2419 Lake Orange Dr, Orlando, FL 32837",
      ownerName: "Robert J. Wilson",
      status: "AVAILABLE",
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
      status: "LEAD",
      setterId: setter1.id,
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
      status: "CUSTOMER",
      setterId: setter1.id,
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
      status: "CUSTOMER",
      setterId: setter2.id,
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
      status: "CUSTOMER",
      setterId: setter3.id,
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
      status: "AVAILABLE",
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
      status: "AVAILABLE",
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

  // ============================================
  // VISITAS Y PROYECTOS
  // ============================================
  
  // Visita 1: Setter acepta propuesta con Panel Solar y Techo
  const visit1 = await prisma.visit.create({
    data: {
      parcelId: "parcel-3",
      setterId: setter1.id,
      closerId: closer1.id,
      stage: "CLOSED",
      outcome: "ACCEPTED",
      completedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 días atrás
    },
  });

  const solarProject = await prisma.projectType.findUnique({ where: { name: "Panel Solar" } });
  const roofProject = await prisma.projectType.findUnique({ where: { name: "Techo" } });

  if (solarProject && roofProject) {
    await prisma.visitProject.createMany({
      data: [
        { visitId: visit1.id, projectTypeId: solarProject.id },
        { visitId: visit1.id, projectTypeId: roofProject.id },
      ],
    });
  }

  // ProjectDetails para visita 1
  await prisma.projectDetails.create({
    data: {
      visitId: visit1.id,
      clientName: "John Smith",
      clientEmail: "john.smith@email.com",
      address: "2415 Lake Orange Dr, Orlando, FL 32837",
      closingDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      paymentMethod: "financiamiento",
      solarFinancier: "SunPower Financial",
      systemSize: "8.5 kW",
      hoaInfo: "Aprobado",
      ppwSold: "$0.12",
      umbrella: "Si",
      mpuPanels: "400W",
      siteSurveyDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      panelsUp: true,
      panelsDown: false,
      electricBillUrl: "/uploads/bill-1.jpg",
      closingFormUrl: "/uploads/closing-1.pdf",
      homeInsuranceUrl: "/uploads/insurance-1.pdf",
      homeTitleUrl: "/uploads/title-1.pdf",
      roofType: "reemplazo",
      roofCostPrice: 8500,
      roofSalePrice: 12000,
      roofCommission: 1200,
      primaryRep: "Alex Rivera",
      primaryRepCommPct: 10,
    },
  });

  // Bill para visita 1
  await prisma.bill.create({
    data: {
      visitId: visit1.id,
      imageUrl: "/uploads/bill-1.jpg",
      phone: "(407) 555-0101",
      clientName: "John Smith",
      clientEmail: "john.smith@email.com",
      notes: "Cliente muy interesado",
    },
  });

  // Visita 2: Otro proyecto cerrado
  const visit2 = await prisma.visit.create({
    data: {
      parcelId: "parcel-4",
      setterId: setter2.id,
      closerId: closer1.id,
      stage: "CLOSED",
      outcome: "ACCEPTED",
      completedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  const waterProject = await prisma.projectType.findUnique({ where: { name: "Purificador de Agua" } });
  if (waterProject) {
    await prisma.visitProject.create({
      data: { visitId: visit2.id, projectTypeId: waterProject.id },
    });
  }

  await prisma.projectDetails.create({
    data: {
      visitId: visit2.id,
      clientName: "Sarah Johnson",
      clientEmail: "sarah.j@email.com",
      address: "2423 Lake Orange Dr, Orlando, FL 32837",
      closingDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      paymentMethod: "efectivo",
      waterSystemType: "sistema completo",
      waterCostPrice: 2500,
      waterSalePrice: 4500,
      waterCommission: 450,
      primaryRep: "Maria Lopez",
      primaryRepCommPct: 10,
    },
  });

  await prisma.bill.create({
    data: {
      visitId: visit2.id,
      imageUrl: "/uploads/bill-2.jpg",
      phone: "(407) 555-0202",
      clientName: "Sarah Johnson",
      clientEmail: "sarah.j@email.com",
    },
  });

  // Visita 3: Tercer proyecto cerrado
  const visit3 = await prisma.visit.create({
    data: {
      parcelId: "parcel-5",
      setterId: setter3.id,
      closerId: closer2.id,
      stage: "CLOSED",
      outcome: "ACCEPTED",
      completedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  const fenceProject = await prisma.projectType.findUnique({ where: { name: "Fence" } });
  if (fenceProject) {
    await prisma.visitProject.create({
      data: { visitId: visit3.id, projectTypeId: fenceProject.id },
    });
  }

  await prisma.projectDetails.create({
    data: {
      visitId: visit3.id,
      clientName: "Michael Brown",
      clientEmail: "m.brown@email.com",
      address: "2425 Lake Orange Dr, Orlando, FL 32837",
      closingDate: new Date(),
      paymentMethod: "tarjeta de credito",
      otherCostPrice: 3000,
      otherSalePrice: 5500,
      otherCommission: 550,
      primaryRep: "Juan Perez",
      primaryRepCommPct: 10,
    },
  });

  await prisma.bill.create({
    data: {
      visitId: visit3.id,
      imageUrl: "/uploads/bill-3.jpg",
      phone: "(407) 555-0303",
      clientName: "Michael Brown",
      clientEmail: "m.brown@email.com",
    },
  });

  // Visita 4: En progreso (setter toca puerta)
  const visit4 = await prisma.visit.create({
    data: {
      parcelId: "parcel-2",
      setterId: setter1.id,
      stage: "IN_PROGRESS",
    },
  });

  // Objeciones para visitas
  const highPriceObj = await prisma.objection.findUnique({ where: { key: "high-price" } });
  const needThinkObj = await prisma.objection.findUnique({ where: { key: "need-think" } });
  
  if (highPriceObj) {
    await prisma.visitObjection.create({
      data: { visitId: visit4.id, objectionId: highPriceObj.id, notes: "Dice que es muy caro" },
    });
  }

  // Visita 5: Con objeción de closer
  const visit5 = await prisma.visit.create({
    data: {
      parcelId: "parcel-3",
      setterId: setter1.id,
      closerId: closer1.id,
      stage: "CLOSER_VISIT",
      outcome: "OBJECTION",
    },
  });

  const financingObj = await prisma.closerObjection.findUnique({ where: { key: "financing-issue" } });
  if (financingObj) {
    await prisma.visitCloserObjection.create({
      data: { visitId: visit5.id, closerObjectionId: financingObj.id, notes: "No calificó para financiamiento" },
    });
  }

  // ============================================
  // CHAT ROOMS Y MENSAJES
  // ============================================
  
  // Chat para visita 1 (proyecto cerrado)
  const chat1 = await prisma.chatRoom.create({
    data: { visitId: visit1.id },
  });

  await prisma.chatMessage.createMany({
    data: [
      { roomId: chat1.id, userId: setter1.id, body: "Proyecto cerrado exitosamente. Cliente muy satisfecho." },
      { roomId: chat1.id, userId: closer1.id, body: "Excelente trabajo Alex. Ya tengo los documentos del proyecto." },
      { roomId: chat1.id, userId: admin.id, body: "Felicidades al equipo! Primer proyecto del mes." },
      { roomId: chat1.id, userId: closer1.id, body: "La instalación de paneles queda programada para la próxima semana." },
      { roomId: chat1.id, userId: setter1.id, body: "Perfecto, el cliente está emocionado." },
    ],
  });

  // Chat para visita 2
  const chat2 = await prisma.chatRoom.create({
    data: { visitId: visit2.id },
  });

  await prisma.chatMessage.createMany({
    data: [
      { roomId: chat2.id, userId: setter2.id, body: "Cierre completado. Sistema de purificación instalado." },
      { roomId: chat2.id, userId: closer1.id, body: "Bien hecho Maria. Cliente firme." },
      { roomId: chat2.id, userId: admin.id, body: "Gran trabajo equipo!" },
    ],
  });

  // Chat para visita 3
  const chat3 = await prisma.chatRoom.create({
    data: { visitId: visit3.id },
  });

  await prisma.chatMessage.createMany({
    data: [
      { roomId: chat3.id, userId: setter3.id, body: "Fence instalado correctamente." },
      { roomId: chat3.id, userId: closer2.id, body: "Cliente feliz con el resultado." },
    ],
  });

  // ============================================
  // SLOTS DEL CLOSER Y PATRONES SEMANALES
  // ============================================
  
  // Patrón semanal para closer1
  await prisma.weeklyPattern.createMany({
    data: [
      { closerId: closer1.id, dayOfWeek: 1, startHour: 9, endHour: 17, slotDuration: 60, isWorkday: true }, // Lunes
      { closerId: closer1.id, dayOfWeek: 2, startHour: 9, endHour: 17, slotDuration: 60, isWorkday: true }, // Martes
      { closerId: closer1.id, dayOfWeek: 3, startHour: 9, endHour: 17, slotDuration: 60, isWorkday: true }, // Miércoles
      { closerId: closer1.id, dayOfWeek: 4, startHour: 9, endHour: 17, slotDuration: 60, isWorkday: true }, // Jueves
      { closerId: closer1.id, dayOfWeek: 5, startHour: 9, endHour: 14, slotDuration: 60, isWorkday: true }, // Viernes
    ],
  });

  // Slots generados para los próximos días
  const slots = [
    { dayOffset: 0, hour: 10, workday: true, closerId: closer1.id },
    { dayOffset: 0, hour: 14, workday: true, closerId: closer1.id },
    { dayOffset: 0, hour: 16, workday: true, closerId: closer1.id },
    { dayOffset: 1, hour: 9, workday: true, closerId: closer1.id },
    { dayOffset: 1, hour: 11, workday: true, closerId: closer1.id },
    { dayOffset: 1, hour: 15, workday: true, closerId: closer1.id },
    { dayOffset: 2, hour: 10, workday: true, closerId: closer1.id },
    { dayOffset: 0, hour: 10, workday: true, closerId: closer2.id },
    { dayOffset: 1, hour: 14, workday: true, closerId: closer2.id },
  ];

  for (const slot of slots) {
    const startAt = new Date(now);
    startAt.setDate(startAt.getDate() + slot.dayOffset);
    startAt.setHours(slot.hour, 0, 0, 0);
    const endAt = new Date(startAt);
    endAt.setHours(startAt.getHours() + 1);

    await prisma.closerSlot.create({
      data: {
        closerId: slot.closerId,
        startAt,
        endAt,
        isWorkday: slot.workday,
      },
    });
  }

  // ============================================
  // MEDALLAS OTORGADAS
  // ============================================
  
  const bronceSetter = await prisma.badge.findFirst({ where: { name: "Bronce Setter" } });
  const bronceCloser = await prisma.badge.findFirst({ where: { name: "Bronce Closer" } });
  
  if (bronceSetter) {
    await prisma.userBadge.createMany({
      data: [
        { userId: setter1.id, badgeId: bronceSetter.id },
        { userId: setter2.id, badgeId: bronceSetter.id },
        { userId: setter3.id, badgeId: bronceSetter.id },
      ],
    });
  }

  if (bronceCloser) {
    await prisma.userBadge.createMany({
      data: [
        { userId: closer1.id, badgeId: bronceCloser.id },
        { userId: closer2.id, badgeId: bronceCloser.id },
      ],
    });
  }

  // ============================================
  // NOTIFICACIONES
  // ============================================
  
  await prisma.notification.createMany({
    data: [
      { userId: closer1.id, title: "Nueva cita asignada", body: "Alex Rivera agendó una visita para mañana a las 10am", link: "/calendar" },
      { userId: admin.id, title: "Proyecto cerrado", body: "Carlos Mendoza cerró un proyecto de Panel Solar", link: "/admin/metrics" },
      { userId: setter1.id, title: "Medalla obtenida", body: "Felicidades! Obtuviste la medalla Bronce Setter", link: "/ranking" },
      { userId: closer1.id, title: "Reasignación pendiente", body: "Juan Perez no puede asistir a la cita. Revisa para reasignar.", link: "/calendar" },
    ],
  });

  console.log("Seed completado con datos de prueba completos");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
