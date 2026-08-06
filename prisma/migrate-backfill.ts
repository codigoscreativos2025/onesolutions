import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PREFIX_MAP: Record<string, string> = {
  "Panel Solar": "solar",
  "Techo": "roof",
  "Purificacion de agua": "water",
  "Fence": "fence",
  "Gutters": "gutter",
  "Remodelacion": "remodelacion",
};

async function main() {
  console.log("=== Iniciando migracion de campos de proyecto ===");

  // Paso 1: Agregar campos CostPrice y SalePrice para Fence, Gutters, Remodelacion
  console.log("\n--- Paso 1: Agregando campos de precio ---");

  const projectTypes = await prisma.projectType.findMany();

  let priceAdded = 0;
  for (const pt of projectTypes) {
    const prefix = PREFIX_MAP[pt.name];
    if (!prefix) continue;

    const costFieldName = `${prefix}CostPrice`;
    const saleFieldName = `${prefix}SalePrice`;

    const existingCost = await prisma.projectTypeField.findFirst({
      where: { projectTypeId: pt.id, fieldName: costFieldName },
    });
    if (!existingCost) {
      await prisma.projectTypeField.create({
        data: {
          projectTypeId: pt.id,
          fieldName: costFieldName,
          fieldLabel: "Precio Costo",
          fieldType: "number",
          isRequired: false,
          order: 90,
        },
      });
      console.log(`  + ${costFieldName} agregado a ${pt.name}`);
      priceAdded++;
    }

    const existingSale = await prisma.projectTypeField.findFirst({
      where: { projectTypeId: pt.id, fieldName: saleFieldName },
    });
    if (!existingSale) {
      await prisma.projectTypeField.create({
        data: {
          projectTypeId: pt.id,
          fieldName: saleFieldName,
          fieldLabel: "Precio de Venta",
          fieldType: "number",
          isRequired: false,
          order: 91,
        },
      });
      console.log(`  + ${saleFieldName} agregado a ${pt.name}`);
      priceAdded++;
    }
  }
  console.log(`  Total campos de precio agregados: ${priceAdded}`);

  // Paso 2: Backfill clientName, clientEmail, address en ProjectDetails
  console.log("\n--- Paso 2: Rellenando clientName/clientEmail/address ---");

  const emptyDetails = await prisma.projectDetails.findMany({
    where: {
      OR: [
        { clientName: null },
        { clientEmail: null },
        { address: null },
      ],
    },
    include: {
      visit: {
        include: {
          bill: { select: { clientName: true, clientEmail: true } },
          parcel: { select: { address: true } },
        },
      },
    },
  });

  let backfilled = 0;
  for (const pd of emptyDetails) {
    const updates: Record<string, string | null> = {};

    if (!pd.clientName && pd.visit?.bill?.clientName) {
      updates.clientName = pd.visit.bill.clientName;
    }
    if (!pd.clientEmail && pd.visit?.bill?.clientEmail) {
      updates.clientEmail = pd.visit.bill.clientEmail;
    }
    if (!pd.address && pd.visit?.parcel?.address) {
      updates.address = pd.visit.parcel.address;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.projectDetails.update({
        where: { id: pd.id },
        data: updates,
      });
      console.log(`  Backfill visitId=${pd.visitId}: ${Object.keys(updates).join(", ")}`);
      backfilled++;
    }
  }
  console.log(`  Total projectDetails backfilled: ${backfilled}`);

  console.log("\n=== Migracion completada ===");
}

main()
  .catch((e) => {
    console.error("Error en migracion:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
