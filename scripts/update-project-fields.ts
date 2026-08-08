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

async function main() {
  console.log("=== Iniciando actualización de tipos de proyecto ===");

  // 1. Crear proyecto "Otros"
  let otros = await prisma.projectType.findFirst({ where: { name: "Otros" } });
  if (!otros) {
    otros = await prisma.projectType.create({ data: { name: "Otros" } });
    console.log(`Creado proyecto: "${otros.name}" (id: ${otros.id})`);
  } else {
    console.log(`Proyecto "Otros" ya existe (id: ${otros.id})`);
  }

  // 2. Crear fieldMetas para "Otros"
  const otrosFields = [
    { fieldName: "otroDescripcion", fieldLabel: "Descripción", fieldType: "text", isRequired: true, order: 1 },
    { fieldName: "paymentMethod", fieldLabel: "Método de Pago", fieldType: "select", options: PAYMENT_OPTIONS, isRequired: true, order: 2 },
    { fieldName: "otherCostPrice", fieldLabel: "Costo", fieldType: "number", isRequired: true, order: 3 },
    { fieldName: "otherSalePrice", fieldLabel: "Precio de Venta", fieldType: "number", isRequired: true, order: 4 },
  ];

  for (const f of otrosFields) {
    const existing = await prisma.projectTypeField.findUnique({
      where: { projectTypeId_fieldName: { projectTypeId: otros.id, fieldName: f.fieldName } },
    });
    if (existing) {
      await prisma.projectTypeField.update({
        where: { id: existing.id },
        data: { isRequired: f.isRequired, order: f.order, options: f.options || null },
      });
      console.log(`  Actualizado campo "${f.fieldName}" para "Otros"`);
    } else {
      await prisma.projectTypeField.create({
        data: { projectTypeId: otros.id, ...f },
      });
      console.log(`  Creado campo "${f.fieldName}" para "Otros"`);
    }
  }

  // 3. Agregar paymentMethod a todos los tipos de proyecto existentes
  const allTypes = await prisma.projectType.findMany();
  for (const pt of allTypes) {
    if (pt.name === "Campos Comunes") continue;

    const existing = await prisma.projectTypeField.findUnique({
      where: { projectTypeId_fieldName: { projectTypeId: pt.id, fieldName: "paymentMethod" } },
    });
    if (existing) {
      await prisma.projectTypeField.update({
        where: { id: existing.id },
        data: { isRequired: true, options: PAYMENT_OPTIONS, fieldType: "select" },
      });
      console.log(`  Actualizado paymentMethod para "${pt.name}"`);
    } else {
      await prisma.projectTypeField.create({
        data: {
          projectTypeId: pt.id,
          fieldName: "paymentMethod",
          fieldLabel: "Método de Pago",
          fieldType: "select",
          options: PAYMENT_OPTIONS,
          isRequired: true,
          order: 99,
        },
      });
      console.log(`  Creado paymentMethod para "${pt.name}"`);
    }
  }

  // 4. Eliminar hoaInfo de Panel Solar
  const panelSolar = await prisma.projectType.findFirst({ where: { name: "Panel Solar" } });
  if (panelSolar) {
    const deleted = await prisma.projectTypeField.deleteMany({
      where: { projectTypeId: panelSolar.id, fieldName: "hoaInfo" },
    });
    if (deleted.count > 0) {
      console.log(`Eliminado hoaInfo de "Panel Solar" (${deleted.count} registro(s))`);
    } else {
      console.log('hoaInfo no existía en "Panel Solar", nada que eliminar');
    }
  } else {
    console.log('No se encontró "Panel Solar"');
  }

  console.log("=== Actualización completada ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
