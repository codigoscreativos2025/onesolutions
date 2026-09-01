import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Buscando el equipo de prueba existente...");
  const testCloser = await prisma.user.findFirst({ where: { role: 'CLOSER', email: { startsWith: 'testcloser' } } });
  const testSetter = await prisma.user.findFirst({ where: { role: 'SETTER', email: { startsWith: 'testsetter' } } });
  const testTrainee = await prisma.user.findFirst({ where: { role: 'TRAINEE', email: { startsWith: 'testtrainee' } } });

  if (!testCloser || !testSetter || !testTrainee) {
    console.error("No se encontró el equipo de prueba.");
    return;
  }

  console.log(`Equipo encontrado: Closer(${testCloser.id}), Setter(${testSetter.id}), Trainee(${testTrainee.id})`);
  
  console.log("Buscando parcelas libres en ORLANDO (zona visible en el mapa)...");
  // The user's screenshot is in Orlando, around Gore St. We can search for city 'ORLANDO'.
  const parcels = await prisma.parcel.findMany({
    where: { 
      status: "AVAILABLE",
      address: { contains: "ORLANDO" } 
    },
    take: 5
  });
  
  // If no parcels contain 'ORLANDO' in address, let's search by city or just random ones that might match the area.
  let targetParcels = parcels;
  if (targetParcels.length === 0) {
      console.log("No se encontraron por dirección, buscando por city = 'ORLANDO' o cercanos...");
      const orlandoParcels = await prisma.parcel.findMany({
          where: {
              status: "AVAILABLE",
              OR: [
                  { address: { contains: "LUCERNE" } },
                  { address: { contains: "GORE" } },
                  { address: { contains: "ORANGE" } }
              ]
          },
          take: 5
      });
      targetParcels = orlandoParcels;
  }

  if (targetParcels.length === 0) {
    console.log("No se encontraron parcelas disponibles en esa zona. Por favor, asegúrate de que la BD tenga parcelas disponibles en Orlando.");
    return;
  }

  console.log(`Creando leads en ${targetParcels.length} parcelas...`);

  for (let i = 0; i < targetParcels.length; i++) {
    const parcel = targetParcels[i];
    const creator = i % 2 === 0 ? testSetter : testTrainee;
    
    // Update parcel status to LEAD and assign setter
    await prisma.parcel.update({
      where: { id: parcel.id },
      data: { 
        status: "LEAD",
        setterId: creator.id,
      }
    });

    // Create Visit
    await prisma.visit.create({
      data: {
        parcelId: parcel.id,
        setterId: creator.id,
        closerId: testCloser.id,
        stage: "IN_PROGRESS",
        legacyNotes: `Test lead note ${i + 1} from team (Setter: ${creator.name}) in Orlando zone`,
      }
    });
    
    console.log(`Lead creado en la parcela: ${parcel.address} (${parcel.id})`);
  }
  
  console.log("Completado.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
