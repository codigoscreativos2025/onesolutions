import { PrismaClient, Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const models = Prisma.dmmf.datamodel.models;
  const backupData: Record<string, any[]> = {};
  
  for (const model of models) {
    const modelName = model.name;
    const dbName = model.dbName || modelName;
    try {
      const data = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "${dbName}"`);
      backupData[modelName] = data;
      console.log(`Backed up ${data.length} records for ${modelName}`);
    } catch (e: any) {
      console.error(`Failed to backup ${modelName}:`, e.message);
    }
  }
  
  const backupPath = path.join(__dirname, '../data/backup.json');
  if (!fs.existsSync(path.dirname(backupPath))) {
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  }
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
  console.log(`Backup completed successfully at ${backupPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
