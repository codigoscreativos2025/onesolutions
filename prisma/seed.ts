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
    { name: "Purificacion de agua", description: "sistema de purificacion para agua" },
    { name: "Techo", description: "Reparacion de techo" }
        
  ];

  for (const pt of projectTypes) {
    await prisma.projectType.create({ data: pt });
  }

  // Project Type Fields - Campos de proyecto precargados
  console.log("Insertando campos de proyecto...");

  const commons = await prisma.projectType.findUnique({ where: { name: "Campos Comunes" } });
  const solar = await prisma.projectType.findUnique({ where: { name: "Panel Solar" } });
  const techo = await prisma.projectType.findUnique({ where: { name: "Techo" } });
  const purificador = await prisma.projectType.findUnique({ where: { name: "Purificacion de agua" } });

  const fields = [
    // CAMPOS COMUNES
    { projectTypeId: commons!.id, fieldName: "clientName", fieldLabel: "Nombre y Apellido", fieldType: "text", isRequired: true, order: 1 },
    { projectTypeId: commons!.id, fieldName: "address", fieldLabel: "Direccion del cliente", fieldType: "text", isRequired: true, order: 2 },
    { projectTypeId: commons!.id, fieldName: "phone", fieldLabel: "Telefono del cliente", fieldType: "text", isRequired: true, order: 3 },
    { projectTypeId: commons!.id, fieldName: "clientEmail", fieldLabel: "Email del cliente", fieldType: "text", isRequired: true, order: 4 },
    { projectTypeId: commons!.id, fieldName: "closingDate", fieldLabel: "Fecha de cierre", fieldType: "date", isRequired: true, order: 5 },
    { projectTypeId: commons!.id, fieldName: "paymentMethod", fieldLabel: "Metodo de pago", fieldType: "select", options: JSON.stringify(["Cash","Transferencia","Cheque","Tarjeta de credito","Foundation Finance","GoodLeap","Paneles solares"]), isRequired: true, order: 6 },
    { projectTypeId: commons!.id, fieldName: "primaryRep", fieldLabel: "Representante principal", fieldType: "text", isRequired: true, order: 7 },
    { projectTypeId: commons!.id, fieldName: "primaryRepCommPct", fieldLabel: "% Comision principal", fieldType: "number", isRequired: true, order: 8 },
    { projectTypeId: commons!.id, fieldName: "secondaryRep", fieldLabel: "Representante secundario", fieldType: "text", isRequired: false, order: 9 },
    { projectTypeId: commons!.id, fieldName: "secondaryRepCommPct", fieldLabel: "% Comision secundario", fieldType: "number", isRequired: false, order: 10 },
    { projectTypeId: commons!.id, fieldName: "tertiaryRep", fieldLabel: "Representante terciario", fieldType: "text", isRequired: false, order: 11 },
    { projectTypeId: commons!.id, fieldName: "tertiaryRepCommPct", fieldLabel: "% Comision terciario", fieldType: "number", isRequired: false, order: 12 },

    // PANEL SOLAR
    { projectTypeId: solar!.id, fieldName: "solarFinancier", fieldLabel: "Financiadora", fieldType: "select", options: JSON.stringify(["LightReach","SkyLight","SunGage","Sunrise Capital"]), isRequired: true, order: 1 },
    { projectTypeId: solar!.id, fieldName: "systemSize", fieldLabel: "Tamano de sistema (kW)", fieldType: "text", isRequired: true, order: 2 },
    { projectTypeId: solar!.id, fieldName: "hoaInfo", fieldLabel: "HOA Informacion (nombre, usuario, password)", fieldType: "text", isRequired: false, order: 3 },
    { projectTypeId: solar!.id, fieldName: "ppwSold", fieldLabel: "PPW o EPC sold", fieldType: "text", isRequired: false, order: 4 },
    { projectTypeId: solar!.id, fieldName: "umbrella", fieldLabel: "Umbrella", fieldType: "select", options: JSON.stringify(["SI","NO"]), isRequired: false, order: 5 },
    { projectTypeId: solar!.id, fieldName: "clientIncentive", fieldLabel: "Incentivo al cliente", fieldType: "text", isRequired: false, order: 6 },
    { projectTypeId: solar!.id, fieldName: "siteSurveyDate", fieldLabel: "Site survey (fecha y hora)", fieldType: "date", isRequired: false, order: 7 },
    { projectTypeId: solar!.id, fieldName: "idDocumentUrl", fieldLabel: "ID del cliente", fieldType: "file", isRequired: true, order: 8 },
    { projectTypeId: solar!.id, fieldName: "electricBillUrl", fieldLabel: "Factura electrica", fieldType: "file", isRequired: true, order: 9 },
    { projectTypeId: solar!.id, fieldName: "homeInsuranceUrl", fieldLabel: "Seguro de casa (opcional si lleva umbrella)", fieldType: "file", isRequired: false, order: 10 },
    { projectTypeId: solar!.id, fieldName: "homeTitleUrl", fieldLabel: "Titulo de casa (si es nueva)", fieldType: "file", isRequired: false, order: 11 },
    { projectTypeId: solar!.id, fieldName: "panelsDownCount", fieldLabel: "Bajar paneles (cuantos)", fieldType: "number", isRequired: false, order: 12 },
    { projectTypeId: solar!.id, fieldName: "panelsUpCount", fieldLabel: "Subir paneles (cuantos)", fieldType: "number", isRequired: false, order: 13 },
    { projectTypeId: solar!.id, fieldName: "solarCostPrice", fieldLabel: "Precio costo (solar)", fieldType: "number", isRequired: false, order: 14 },
    { projectTypeId: solar!.id, fieldName: "solarSalePrice", fieldLabel: "Precio de venta (solar)", fieldType: "number", isRequired: false, order: 15 },
    { projectTypeId: solar!.id, fieldName: "solarCommission", fieldLabel: "Comision (solar)", fieldType: "number", isRequired: false, order: 16 },
    { projectTypeId: solar!.id, fieldName: "panelsPhotoUrl", fieldLabel: "Fotos de paneles y techo", fieldType: "photos", options: JSON.stringify({multiple: true, max: 10}), isRequired: false, order: 17 },

    // TECHOS
    { projectTypeId: techo!.id, fieldName: "roofType", fieldLabel: "Trabajo a realizar", fieldType: "select", options: JSON.stringify(["Reemplazo de techo full","Reparacion de techo","Gutters","Skylights"]), isRequired: true, order: 1 },
    { projectTypeId: techo!.id, fieldName: "hoaInfo", fieldLabel: "HOA Informacion (nombre, usuario, password)", fieldType: "text", isRequired: false, order: 2 },
    { projectTypeId: techo!.id, fieldName: "nocUrl", fieldLabel: "NOC firmado", fieldType: "file", isRequired: true, order: 3 },
    { projectTypeId: techo!.id, fieldName: "exteriorScopeUrl", fieldLabel: "Exterior scope work", fieldType: "file", isRequired: true, order: 4 },
    { projectTypeId: techo!.id, fieldName: "roofReportUrl", fieldLabel: "Reporte de techo", fieldType: "file", isRequired: true, order: 5 },
    { projectTypeId: techo!.id, fieldName: "propertyPhotosJson", fieldLabel: "Fotos de la propiedad (min 20)", fieldType: "photos", options: JSON.stringify({multiple: true, max: 20}), isRequired: true, order: 6 },
    { projectTypeId: techo!.id, fieldName: "roofCostPrice", fieldLabel: "Precio costo (techo)", fieldType: "number", isRequired: false, order: 7 },
    { projectTypeId: techo!.id, fieldName: "roofSalePrice", fieldLabel: "Precio de venta (techo)", fieldType: "number", isRequired: false, order: 8 },
    { projectTypeId: techo!.id, fieldName: "roofCommission", fieldLabel: "Comision (techo)", fieldType: "number", isRequired: false, order: 9 },

    // PURIFICADOR DE AGUA
    { projectTypeId: purificador!.id, fieldName: "waterSystemType", fieldLabel: "Tipo de tratamiento de agua", fieldType: "select", options: JSON.stringify(["Sistema completo (softener & R.O)","Softener","R.O (Osmosis reverse)","Sistema de pozo"]), isRequired: true, order: 1 },
    { projectTypeId: purificador!.id, fieldName: "waterCostPrice", fieldLabel: "Precio costo (agua)", fieldType: "number", isRequired: false, order: 2 },
    { projectTypeId: purificador!.id, fieldName: "waterSalePrice", fieldLabel: "Precio de venta (agua)", fieldType: "number", isRequired: false, order: 3 },
    { projectTypeId: purificador!.id, fieldName: "waterCommission", fieldLabel: "Comision (agua)", fieldType: "number", isRequired: false, order: 4 },
  ];

  for (const f of fields) {
    await prisma.projectTypeField.upsert({
      where: { projectTypeId_fieldName: { projectTypeId: f.projectTypeId, fieldName: f.fieldName } },
      update: { fieldLabel: f.fieldLabel, fieldType: f.fieldType, options: f.options, isRequired: f.isRequired, order: f.order },
      create: f,
    });
  }

  console.log(`Insertados/actualizados ${fields.length} campos de proyecto.`);

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
