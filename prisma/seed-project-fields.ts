import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PAYMENT_OPTIONS = JSON.stringify([
  "Cash",
  "Transferencia",
  "Cheques",
  "LightReach",
  "SkyLight",
  "SunGage",
  "Sunrise Capital",
  "Foundations Finance",
  "Tarjeta de Crédito TDC",
  "Otro",
]);

async function seedProjectFields() {
  const commons = await prisma.projectType.upsert({
    where: { name: "Campos Comunes" },
    update: {},
    create: { name: "Campos Comunes", description: "Campos obligatorios comunes a todos los proyectos" },
  });
  const solar = await prisma.projectType.upsert({
    where: { name: "Panel Solar" },
    update: {},
    create: { name: "Panel Solar", description: "Instalacion de paneles solares" },
  });
  const techo = await prisma.projectType.upsert({
    where: { name: "Techo" },
    update: {},
    create: { name: "Techo", description: "Reparacion de techo" },
  });
  const purificador = await prisma.projectType.upsert({
    where: { name: "Purificacion de agua" },
    update: {},
    create: { name: "Purificacion de agua", description: "Sistema de purificacion para agua" },
  });
  const fence = await prisma.projectType.upsert({
    where: { name: "Fence" },
    update: {},
    create: { name: "Fence", description: "Cercas y vallas" },
  });
  const gutters = await prisma.projectType.upsert({
    where: { name: "Gutters" },
    update: {},
    create: { name: "Gutters", description: "Canaletas y desagues" },
  });
  const remodelacion = await prisma.projectType.upsert({
    where: { name: "Remodelacion" },
    update: {},
    create: { name: "Remodelacion", description: "Remodelacion general" },
  });
  const otros = await prisma.projectType.upsert({
    where: { name: "Otros" },
    update: {},
    create: { name: "Otros", description: "Otro tipo de proyecto" },
  });

  // Limpiar campos obsoletos de versiones anteriores
  await prisma.projectTypeField.deleteMany({
    where: { fieldName: "paymentMethod" }
  });
  if (solar.id) {
    await prisma.projectTypeField.deleteMany({
      where: { projectTypeId: solar.id, fieldName: "hoaInfo" }
    });
  }

  const fields = [
    // Campos Comunes
    { projectTypeId: commons.id, fieldName: "clientName", fieldLabel: "Nombre y Apellido", fieldType: "text", isRequired: true, order: 1 },
    { projectTypeId: commons.id, fieldName: "address", fieldLabel: "Direccion del cliente", fieldType: "text", isRequired: true, order: 2 },
    { projectTypeId: commons.id, fieldName: "clientEmail", fieldLabel: "Email del cliente", fieldType: "text", isRequired: true, order: 3 },
    { projectTypeId: commons.id, fieldName: "closingDate", fieldLabel: "Fecha de cierre", fieldType: "date", isRequired: true, order: 4 },
    { projectTypeId: commons.id, fieldName: "hoaInfo", fieldLabel: "HOA Informacion", fieldType: "text", isRequired: true, order: 5 },
    { projectTypeId: commons.id, fieldName: "primaryRep", fieldLabel: "Representante principal", fieldType: "text", isRequired: true, order: 6 },
    { projectTypeId: commons.id, fieldName: "primaryRepCommPct", fieldLabel: "% Comision principal", fieldType: "number", isRequired: true, order: 7 },
    { projectTypeId: commons.id, fieldName: "secondaryRep", fieldLabel: "Representante secundario", fieldType: "text", isRequired: false, order: 8 },
    { projectTypeId: commons.id, fieldName: "secondaryRepCommPct", fieldLabel: "% Comision secundario", fieldType: "number", isRequired: false, order: 9 },
    { projectTypeId: commons.id, fieldName: "tertiaryRep", fieldLabel: "Representante terciario", fieldType: "text", isRequired: false, order: 10 },
    { projectTypeId: commons.id, fieldName: "tertiaryRepCommPct", fieldLabel: "% Comision terciario", fieldType: "number", isRequired: false, order: 11 },

    // Panel Solar
    { projectTypeId: solar.id, fieldName: "solarPaymentMethod", fieldLabel: "Método de Pago", fieldType: "select", options: PAYMENT_OPTIONS, isRequired: true, order: 1 },
    { projectTypeId: solar.id, fieldName: "solarFinancier", fieldLabel: "Financiadora", fieldType: "select", options: JSON.stringify(["LightReach","SkyLight","SunGage","Sunrise Capital"]), isRequired: true, order: 2 },
    { projectTypeId: solar.id, fieldName: "systemSize", fieldLabel: "Tamano de sistema (kW)", fieldType: "text", isRequired: true, order: 3 },
    { projectTypeId: solar.id, fieldName: "ppwSold", fieldLabel: "PPW o EPC sold", fieldType: "text", isRequired: false, order: 4 },
    { projectTypeId: solar.id, fieldName: "umbrella", fieldLabel: "Umbrella", fieldType: "select", options: JSON.stringify(["SI","NO"]), isRequired: false, order: 5 },
    { projectTypeId: solar.id, fieldName: "clientIncentive", fieldLabel: "Incentivo al cliente", fieldType: "text", isRequired: false, order: 6 },
    { projectTypeId: solar.id, fieldName: "siteSurveyDate", fieldLabel: "Site survey", fieldType: "date", isRequired: false, order: 7 },
    { projectTypeId: solar.id, fieldName: "idDocumentUrl", fieldLabel: "ID del cliente", fieldType: "file", isRequired: true, order: 8 },
    { projectTypeId: solar.id, fieldName: "electricBillUrl", fieldLabel: "Factura electrica", fieldType: "file", isRequired: true, order: 9 },
    { projectTypeId: solar.id, fieldName: "homeInsuranceUrl", fieldLabel: "Seguro de casa", fieldType: "file", isRequired: false, order: 10 },
    { projectTypeId: solar.id, fieldName: "homeTitleUrl", fieldLabel: "Titulo de casa", fieldType: "file", isRequired: false, order: 11 },
    { projectTypeId: solar.id, fieldName: "panelsDownCount", fieldLabel: "Bajar paneles (cuantos)", fieldType: "number", isRequired: false, order: 12 },
    { projectTypeId: solar.id, fieldName: "panelsUpCount", fieldLabel: "Subir paneles (cuantos)", fieldType: "number", isRequired: false, order: 13 },
    { projectTypeId: solar.id, fieldName: "solarCostPrice", fieldLabel: "Costo", fieldType: "number", isRequired: false, order: 14 },
    { projectTypeId: solar.id, fieldName: "solarSalePrice", fieldLabel: "Precio de Venta", fieldType: "number", isRequired: false, order: 15 },
    { projectTypeId: solar.id, fieldName: "solarCommission", fieldLabel: "Comisión", fieldType: "number", isRequired: false, order: 16 },
    { projectTypeId: solar.id, fieldName: "panelsPhotoUrl", fieldLabel: "Fotos de paneles y techo", fieldType: "photos", options: JSON.stringify({multiple: true, max: 10}), isRequired: false, order: 17 },

    // Techo
    { projectTypeId: techo.id, fieldName: "roofPaymentMethod", fieldLabel: "Método de Pago", fieldType: "select", options: PAYMENT_OPTIONS, isRequired: true, order: 1 },
    { projectTypeId: techo.id, fieldName: "roofType", fieldLabel: "Trabajo a realizar", fieldType: "select", options: JSON.stringify(["Reemplazo de techo full","Reparacion de techo","Gutters","Skylights"]), isRequired: true, order: 2 },
    { projectTypeId: techo.id, fieldName: "nocUrl", fieldLabel: "NOC firmado", fieldType: "file", isRequired: true, order: 3 },
    { projectTypeId: techo.id, fieldName: "exteriorScopeUrl", fieldLabel: "Exterior scope work", fieldType: "file", isRequired: true, order: 4 },
    { projectTypeId: techo.id, fieldName: "roofReportUrl", fieldLabel: "Reporte de techo", fieldType: "file", isRequired: true, order: 5 },
    { projectTypeId: techo.id, fieldName: "propertyPhotosJson", fieldLabel: "Fotos de la propiedad (min 20)", fieldType: "photos", options: JSON.stringify({multiple: true, max: 20}), isRequired: true, order: 6 },
    { projectTypeId: techo.id, fieldName: "roofCostPrice", fieldLabel: "Costo", fieldType: "number", isRequired: false, order: 7 },
    { projectTypeId: techo.id, fieldName: "roofSalePrice", fieldLabel: "Precio de Venta", fieldType: "number", isRequired: false, order: 8 },
    { projectTypeId: techo.id, fieldName: "roofCommission", fieldLabel: "Comisión", fieldType: "number", isRequired: false, order: 9 },

    // Purificador de Agua
    { projectTypeId: purificador.id, fieldName: "waterPaymentMethod", fieldLabel: "Método de Pago", fieldType: "select", options: PAYMENT_OPTIONS, isRequired: true, order: 1 },
    { projectTypeId: purificador.id, fieldName: "waterSystemType", fieldLabel: "Tipo de tratamiento", fieldType: "select", options: JSON.stringify(["Sistema completo (softener & R.O)","Softener","R.O (Osmosis reverse)","Sistema de pozo"]), isRequired: true, order: 2 },
    { projectTypeId: purificador.id, fieldName: "waterCostPrice", fieldLabel: "Costo", fieldType: "number", isRequired: false, order: 3 },
    { projectTypeId: purificador.id, fieldName: "waterSalePrice", fieldLabel: "Precio de Venta", fieldType: "number", isRequired: false, order: 4 },
    { projectTypeId: purificador.id, fieldName: "waterCommission", fieldLabel: "Comisión", fieldType: "number", isRequired: false, order: 5 },

    // Fence
    { projectTypeId: fence.id, fieldName: "fencePaymentMethod", fieldLabel: "Método de Pago", fieldType: "select", options: PAYMENT_OPTIONS, isRequired: true, order: 1 },
    { projectTypeId: fence.id, fieldName: "fenceCostPrice", fieldLabel: "Costo", fieldType: "number", isRequired: false, order: 2 },
    { projectTypeId: fence.id, fieldName: "fenceSalePrice", fieldLabel: "Precio de Venta", fieldType: "number", isRequired: false, order: 3 },
    { projectTypeId: fence.id, fieldName: "fenceCommission", fieldLabel: "Comisión", fieldType: "number", isRequired: false, order: 4 },

    // Gutters
    { projectTypeId: gutters.id, fieldName: "gutterPaymentMethod", fieldLabel: "Método de Pago", fieldType: "select", options: PAYMENT_OPTIONS, isRequired: true, order: 1 },
    { projectTypeId: gutters.id, fieldName: "gutterCostPrice", fieldLabel: "Costo", fieldType: "number", isRequired: false, order: 2 },
    { projectTypeId: gutters.id, fieldName: "gutterSalePrice", fieldLabel: "Precio de Venta", fieldType: "number", isRequired: false, order: 3 },
    { projectTypeId: gutters.id, fieldName: "gutterCommission", fieldLabel: "Comisión", fieldType: "number", isRequired: false, order: 4 },

    // Remodelacion
    { projectTypeId: remodelacion.id, fieldName: "remodelacionPaymentMethod", fieldLabel: "Método de Pago", fieldType: "select", options: PAYMENT_OPTIONS, isRequired: true, order: 1 },
    { projectTypeId: remodelacion.id, fieldName: "remodelacionCostPrice", fieldLabel: "Costo", fieldType: "number", isRequired: false, order: 2 },
    { projectTypeId: remodelacion.id, fieldName: "remodelacionSalePrice", fieldLabel: "Precio de Venta", fieldType: "number", isRequired: false, order: 3 },
    { projectTypeId: remodelacion.id, fieldName: "remodelacionCommission", fieldLabel: "Comisión", fieldType: "number", isRequired: false, order: 4 },

    // Otros
    { projectTypeId: otros.id, fieldName: "otroPaymentMethod", fieldLabel: "Método de Pago", fieldType: "select", options: PAYMENT_OPTIONS, isRequired: true, order: 1 },
    { projectTypeId: otros.id, fieldName: "otroDescripcion", fieldLabel: "Descripción", fieldType: "text", isRequired: true, order: 2 },
    { projectTypeId: otros.id, fieldName: "otherCostPrice", fieldLabel: "Costo", fieldType: "number", isRequired: true, order: 3 },
    { projectTypeId: otros.id, fieldName: "otherSalePrice", fieldLabel: "Precio de Venta", fieldType: "number", isRequired: true, order: 4 },
  ];

  let count = 0;
  for (const f of fields) {
    await prisma.projectTypeField.upsert({
      where: { projectTypeId_fieldName: { projectTypeId: f.projectTypeId, fieldName: f.fieldName } },
      update: { fieldLabel: f.fieldLabel, fieldType: f.fieldType, options: f.options, isRequired: f.isRequired, order: f.order },
      create: f,
    });
    count++;
  }

  console.log(`Project type fields: ${count} inserted/updated.`);
}

seedProjectFields()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Error seeding project fields:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
