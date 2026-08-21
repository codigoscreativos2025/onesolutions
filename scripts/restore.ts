import { PrismaClient, Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const backupPath = path.join(__dirname, '../data/backup.json');
  if (!fs.existsSync(backupPath)) {
    console.error('Backup file not found at', backupPath);
    process.exit(1);
  }
  
  const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
  const models = Prisma.dmmf.datamodel.models;
  
  // To avoid foreign key constraint errors during restore, we can delete all data first (optional)
  // Or we can just insert everything in the right order, but PRAGMA foreign_keys = OFF is easier for SQLite.
  
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF;');
  
  for (const model of models) {
    const modelName = model.name;
    const data = backupData[modelName];
    
    if (data && data.length > 0) {
      const delegate = (prisma as any)[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
      if (delegate && typeof delegate.createMany === 'function') {
        // Clear existing data before restoring to avoid conflicts
        await delegate.deleteMany();
        
        // Chunk inserts to avoid SQLite binding limits (usually 999 parameters)
        // With createMany in SQLite, we might hit limits if we have many columns and rows.
        const CHUNK_SIZE = 50; 
        for (let i = 0; i < data.length; i += CHUNK_SIZE) {
          const chunk = data.slice(i, i + CHUNK_SIZE);
          await delegate.createMany({
            data: chunk,
          });
        }
        console.log(`Restored ${data.length} records for ${modelName}`);
      }
    }
  }
  
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;');
  console.log('Restore completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
