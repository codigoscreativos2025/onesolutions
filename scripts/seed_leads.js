const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  const maria = users.find(u => u.name && u.name.toLowerCase().includes('maria lopez'));

  if (!maria) {
    console.error("No se encontro a Maria Lopez");
    process.exit(1);
  }
  
  console.log("Maria found:", maria.id);

  // We need 3 parcels, we can just create dummy parcels.
  for (let i = 1; i <= 3; i++) {
    const parcelId = `dummy-parcel-${Date.now()}-${i}`;
    const parcel = await prisma.parcel.create({
      data: {
        id: parcelId,
        address: `Calle Prueba Maria ${i}`,
        geometry: JSON.stringify({ type: "Point", coordinates: [-80.1918, 25.7617] }),
        territory: "Florida",
        status: "AVAILABLE",
        setterId: maria.id,
      }
    });

    const visit = await prisma.visit.create({
      data: {
        parcelId: parcel.id,
        setterId: maria.id,
        stage: "IN_PROGRESS",
      }
    });
    
    console.log(`Created lead ${visit.id} for parcel ${parcel.id}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
