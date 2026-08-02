import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PREFIX_MAP: Record<string, string> = {
  "Panel Solar": "solar",
  "Techo": "roof",
  "Purificacion de agua": "water",
};

async function main() {
  const projectTypes = await prisma.projectType.findMany({
    where: { name: { not: "Campos Comunes" } },
  });

  let added = 0;

  for (const pt of projectTypes) {
    const prefix = PREFIX_MAP[pt.name] || pt.name.toLowerCase().replace(/\s+/g, "").slice(0, 15);

    const existingFields = await prisma.projectTypeField.findMany({
      where: {
        projectTypeId: pt.id,
        fieldName: { contains: "CostPrice" },
      },
    });

    const hasCost = existingFields.some((f) =>
      f.fieldName.toLowerCase().endsWith("costprice")
    );
    if (!hasCost) {
      await prisma.projectTypeField.upsert({
        where: {
          projectTypeId_fieldName: {
            projectTypeId: pt.id,
            fieldName: `${prefix}CostPrice`,
          },
        },
        update: {},
        create: {
          projectTypeId: pt.id,
          fieldName: `${prefix}CostPrice`,
          fieldLabel: "Precio Costo",
          fieldType: "number",
          isRequired: false,
          order: 90,
        },
      });
      console.log(`Added ${prefix}CostPrice to ${pt.name}`);
      added++;
    }

    const existingSale = await prisma.projectTypeField.findMany({
      where: {
        projectTypeId: pt.id,
        fieldName: { contains: "SalePrice" },
      },
    });

    const hasSale = existingSale.some((f) =>
      f.fieldName.toLowerCase().endsWith("saleprice")
    );
    if (!hasSale) {
      await prisma.projectTypeField.upsert({
        where: {
          projectTypeId_fieldName: {
            projectTypeId: pt.id,
            fieldName: `${prefix}SalePrice`,
          },
        },
        update: {},
        create: {
          projectTypeId: pt.id,
          fieldName: `${prefix}SalePrice`,
          fieldLabel: "Precio de Venta",
          fieldType: "number",
          isRequired: false,
          order: 91,
        },
      });
      console.log(`Added ${prefix}SalePrice to ${pt.name}`);
      added++;
    }
  }

  console.log(`Done. ${added} fields added.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
