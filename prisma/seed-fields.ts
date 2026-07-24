const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Create project types if missing
  const types = [
    { name: "Campos Comunes", description: "Campos obligatorios comunes a todos los proyectos" },
    { name: "Panel Solar", description: "Instalacion de paneles solares" },
    { name: "Techo", description: "Reparacion de techo" },
    { name: "Purificacion de agua", description: "Sistema de purificacion para agua" },
  ];
  for (const t of types) {
    await prisma.projectType.upsert({ where: { name: t.name }, update: {}, create: t });
  }
  console.log("Tipos de proyecto assegurados.");
  
  const commons = await prisma.projectType.findUnique({ where: { name: "Campos Comunes" } });
  const solar = await prisma.projectType.findUnique({ where: { name: "Panel Solar" } });
  const techo = await prisma.projectType.findUnique({ where: { name: "Techo" } });
  const purificador = await prisma.projectType.findUnique({ where: { name: "Purificacion de agua" } });

  const fields = [
    { projectTypeId: commons.id, fieldName: "clientName", fieldLabel: "Nombre y Apellido", fieldType: "text", isRequired: true, order: 1 },
    { projectTypeId: commons.id, fieldName: "address", fieldLabel: "Direccion del cliente", fieldType: "text", isRequired: true, order: 2 },
    { projectTypeId: commons.id, fieldName: "phone", fieldLabel: "Telefono del cliente", fieldType: "text", isRequired: true, order: 3 },
    { projectTypeId: commons.id, fieldName: "clientEmail", fieldLabel: "Email del cliente", fieldType: "text", isRequired: true, order: 4 },
    { projectTypeId: commons.id, fieldName: "closingDate", fieldLabel: "Fecha de cierre", fieldType: "date", isRequired: true, order: 5 },
    { projectTypeId: commons.id, fieldName: "paymentMethod", fieldLabel: "Metodo de pago", fieldType: "select", options: JSON.stringify(["Cash","Transferencia","Cheque","Tarjeta de credito","Foundation Finance","GoodLeap","Paneles solares"]), isRequired: true, order: 6 },
    { projectTypeId: commons.id, fieldName: "primaryRep", fieldLabel: "Representante principal", fieldType: "text", isRequired: true, order: 7 },
    { projectTypeId: commons.id, fieldName: "primaryRepCommPct", fieldLabel: "% Comision principal", fieldType: "number", isRequired: true, order: 8 },
    { projectTypeId: commons.id, fieldName: "secondaryRep", fieldLabel: "Representante secundario", fieldType: "text", isRequired: false, order: 9 },
    { projectTypeId: commons.id, fieldName: "secondaryRepCommPct", fieldLabel: "% Comision secundario", fieldType: "number", isRequired: false, order: 10 },
    { projectTypeId: commons.id, fieldName: "tertiaryRep", fieldLabel: "Representante terciario", fieldType: "text", isRequired: false, order: 11 },
    { projectTypeId: commons.id, fieldName: "tertiaryRepCommPct", fieldLabel: "% Comision terciario", fieldType: "number", isRequired: false, order: 12 },
    { projectTypeId: solar.id, fieldName: "solarFinancier", fieldLabel: "Financiadora", fieldType: "select", options: JSON.stringify(["LightReach","SkyLight","SunGage","Sunrise Capital"]), isRequired: true, order: 1 },
    { projectTypeId: solar.id, fieldName: "systemSize", fieldLabel: "Tamano de sistema (kW)", fieldType: "text", isRequired: true, order: 2 },
    { projectTypeId: solar.id, fieldName: "hoaInfo", fieldLabel: "HOA Informacion", fieldType: "text", isRequired: false, order: 3 },
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
    { projectTypeId: solar.id, fieldName: "solarCostPrice", fieldLabel: "Precio costo (solar)", fieldType: "number", isRequired: false, order: 14 },
    { projectTypeId: solar.id, fieldName: "solarSalePrice", fieldLabel: "Precio de venta (solar)", fieldType: "number", isRequired: false, order: 15 },
    { projectTypeId: solar.id, fieldName: "solarCommission", fieldLabel: "Comision (solar)", fieldType: "number", isRequired: false, order: 16 },
    { projectTypeId: solar.id, fieldName: "panelsPhotoUrl", fieldLabel: "Fotos de paneles y techo", fieldType: "photos", options: JSON.stringify({multiple: true, max: 10}), isRequired: false, order: 17 },
    { projectTypeId: techo.id, fieldName: "roofType", fieldLabel: "Trabajo a realizar", fieldType: "select", options: JSON.stringify(["Reemplazo de techo full","Reparacion de techo","Gutters","Skylights"]), isRequired: true, order: 1 },
    { projectTypeId: techo.id, fieldName: "hoaInfo", fieldLabel: "HOA Informacion", fieldType: "text", isRequired: false, order: 2 },
    { projectTypeId: techo.id, fieldName: "nocUrl", fieldLabel: "NOC firmado", fieldType: "file", isRequired: true, order: 3 },
    { projectTypeId: techo.id, fieldName: "exteriorScopeUrl", fieldLabel: "Exterior scope work", fieldType: "file", isRequired: true, order: 4 },
    { projectTypeId: techo.id, fieldName: "roofReportUrl", fieldLabel: "Reporte de techo", fieldType: "file", isRequired: true, order: 5 },
    { projectTypeId: techo.id, fieldName: "propertyPhotosJson", fieldLabel: "Fotos de la propiedad (min 20)", fieldType: "photos", options: JSON.stringify({multiple: true, max: 20}), isRequired: true, order: 6 },
    { projectTypeId: techo.id, fieldName: "roofCostPrice", fieldLabel: "Precio costo (techo)", fieldType: "number", isRequired: false, order: 7 },
    { projectTypeId: techo.id, fieldName: "roofSalePrice", fieldLabel: "Precio de venta (techo)", fieldType: "number", isRequired: false, order: 8 },
    { projectTypeId: techo.id, fieldName: "roofCommission", fieldLabel: "Comision (techo)", fieldType: "number", isRequired: false, order: 9 },
    { projectTypeId: purificador.id, fieldName: "waterSystemType", fieldLabel: "Tipo de tratamiento", fieldType: "select", options: JSON.stringify(["Sistema completo (softener & R.O)","Softener","R.O (Osmosis reverse)","Sistema de pozo"]), isRequired: true, order: 1 },
    { projectTypeId: purificador.id, fieldName: "waterCostPrice", fieldLabel: "Precio costo (agua)", fieldType: "number", isRequired: false, order: 2 },
    { projectTypeId: purificador.id, fieldName: "waterSalePrice", fieldLabel: "Precio de venta (agua)", fieldType: "number", isRequired: false, order: 3 },
    { projectTypeId: purificador.id, fieldName: "waterCommission", fieldLabel: "Comision (agua)", fieldType: "number", isRequired: false, order: 4 },
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

  console.log("Insertados/actualizados " + count + " campos de proyecto.");
  await prisma.$disconnect();
}

main().catch(console.error);
