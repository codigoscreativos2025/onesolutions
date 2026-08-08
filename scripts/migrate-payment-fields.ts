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

const PREFIJO: Record<string, string> = {
  "Panel Solar": "solar",
  "Techo": "roof",
  "Purificacion de agua": "water",
  "Fence": "fence",
  "Gutters": "gutter",
  "Remodelacion": "remodelacion",
  "Otros": "otro",
};

async function main() {
  console.log("=== Migrando paymentMethod a campos prefijados ===");

  const allTypes = await prisma.projectType.findMany();

  for (const pt of allTypes) {
    const prefix = PREFIJO[pt.name];
    if (!prefix) continue;

    const genericFieldName = "paymentMethod";
    const prefixedFieldName = `${prefix}PaymentMethod`;

    // 1. Eliminar el paymentMethod genérico
    const deleted = await prisma.projectTypeField.deleteMany({
      where: { projectTypeId: pt.id, fieldName: genericFieldName },
    });
    if (deleted.count > 0) {
      console.log(`  Eliminado paymentMethod genérico de "${pt.name}"`);
    }

    // 2. Crear el campo prefijado si no existe
    const existing = await prisma.projectTypeField.findUnique({
      where: { projectTypeId_fieldName: { projectTypeId: pt.id, fieldName: prefixedFieldName } },
    });

    if (existing) {
      await prisma.projectTypeField.update({
        where: { id: existing.id },
        data: { isRequired: true, options: PAYMENT_OPTIONS, fieldType: "select", order: 2 },
      });
      console.log(`  Actualizado "${prefixedFieldName}" para "${pt.name}"`);
    } else {
      await prisma.projectTypeField.create({
        data: {
          projectTypeId: pt.id,
          fieldName: prefixedFieldName,
          fieldLabel: "Método de Pago",
          fieldType: "select",
          options: PAYMENT_OPTIONS,
          isRequired: true,
          order: 2,
        },
      });
      console.log(`  Creado "${prefixedFieldName}" para "${pt.name}"`);
    }
  }

  console.log("=== Migración completada ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
