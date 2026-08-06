const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.projectTypeField.updateMany({
    where: { fieldName: 'solarCostPrice' },
    data: { fieldLabel: 'Costo' }
  });
  console.log("Updated solarCostPrice label to 'Costo'");
}

main().catch(console.error).finally(() => prisma.$disconnect());
