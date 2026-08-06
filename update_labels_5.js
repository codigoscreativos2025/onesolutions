const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updates = [];
  
  // Cost fields
  const costFields = ['roofCostPrice', 'waterCostPrice', 'fenceCostPrice', 'gutterCostPrice', 'remodelacionCostPrice'];
  for (const field of costFields) {
    updates.push(
      prisma.projectTypeField.updateMany({
        where: { fieldName: field },
        data: { fieldLabel: 'Costo' }
      })
    );
  }

  // Sale fields
  const saleFields = ['solarSalePrice', 'roofSalePrice', 'waterSalePrice', 'fenceSalePrice', 'gutterSalePrice', 'remodelacionSalePrice'];
  for (const field of saleFields) {
    updates.push(
      prisma.projectTypeField.updateMany({
        where: { fieldName: field },
        data: { fieldLabel: 'Precio de Venta' }
      })
    );
  }

  await Promise.all(updates);
  console.log("Updated all 5 sections' cost and sale price labels.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
