const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const fields = ['roofCommission', 'solarCommission', 'waterCommission'];
  const updates = fields.map(field => 
    prisma.projectTypeField.updateMany({
      where: { fieldName: field },
      data: { fieldLabel: 'Comision' }
    })
  );

  await Promise.all(updates);
  console.log("Updated commission labels.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
