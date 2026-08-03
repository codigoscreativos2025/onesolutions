import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PREFIX_MAP: Record<string, string> = {
  "Panel Solar": "solar",
  "Techo": "roof",
  "Purificacion de agua": "water",
  "Fence": "other",
  "Gutters": "other",
  "Remodelacion": "other",
};

const VALID_PREFIXES = ["solar", "roof", "water", "other", "general"];

function isValidFieldName(fieldName: string): boolean {
  return VALID_PREFIXES.some((p) =>
    fieldName.toLowerCase().startsWith(p.toLowerCase())
  );
}

async function main() {
  const projectTypes = await prisma.projectType.findMany({
    where: { name: { not: "Campos Comunes" } },
  });

  let added = 0;
  let cleaned = 0;

  for (const pt of projectTypes) {
    const prefix = PREFIX_MAP[pt.name] || "general";

    const existingCostFields = await prisma.projectTypeField.findMany({
      where: {
        projectTypeId: pt.id,
        fieldName: { contains: "CostPrice" },
      },
    });

    for (const f of existingCostFields) {
      if (!isValidFieldName(f.fieldName)) {
        await prisma.projectTypeField.delete({ where: { id: f.id } });
        console.log(`Removed invalid field ${f.fieldName} from ${pt.name}`);
        cleaned++;
      }
    }

    if (prefix === "other") {
      for (const f of existingCostFields) {
        if (f.fieldName.toLowerCase() === "generalcostprice") {
          await prisma.projectTypeField.delete({ where: { id: f.id } });
          console.log(`Replaced generalCostPrice with otherCostPrice in ${pt.name}`);
          cleaned++;
        }
      }
    }

    const hasValidCost = existingCostFields.some(
      (f) => f.fieldName.toLowerCase() === `${prefix.toLowerCase()}costprice`
    );

    if (!hasValidCost) {
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

    const existingSaleFields = await prisma.projectTypeField.findMany({
      where: {
        projectTypeId: pt.id,
        fieldName: { contains: "SalePrice" },
      },
    });

    for (const f of existingSaleFields) {
      if (!isValidFieldName(f.fieldName)) {
        await prisma.projectTypeField.delete({ where: { id: f.id } });
        console.log(`Removed invalid field ${f.fieldName} from ${pt.name}`);
        cleaned++;
      }
    }

    if (prefix === "other") {
      for (const f of existingSaleFields) {
        if (f.fieldName.toLowerCase() === "generalsaleprice") {
          await prisma.projectTypeField.delete({ where: { id: f.id } });
          console.log(`Replaced generalSalePrice with otherSalePrice in ${pt.name}`);
          cleaned++;
        }
      }
    }

    const hasValidSale = existingSaleFields.some(
      (f) => f.fieldName.toLowerCase() === `${prefix.toLowerCase()}saleprice`
    );

    if (!hasValidSale) {
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

  console.log(`Done. ${added} fields added, ${cleaned} invalid fields removed.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
