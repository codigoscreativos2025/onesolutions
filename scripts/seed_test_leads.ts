import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Creating test team...");
  const testCloser = await prisma.user.create({
    data: {
      name: "Test Closer",
      email: `testcloser_${Date.now()}@example.com`,
      password: "password123",
      role: "CLOSER",
    }
  });

  const testSetter = await prisma.user.create({
    data: {
      name: "Test Setter",
      email: `testsetter_${Date.now()}@example.com`,
      password: "password123",
      role: "SETTER",
      closerId: testCloser.id,
    }
  });

  const testTrainee = await prisma.user.create({
    data: {
      name: "Test Trainee",
      email: `testtrainee_${Date.now()}@example.com`,
      password: "password123",
      role: "TRAINEE",
      closerId: testCloser.id,
    }
  });

  console.log(`Team created: Closer(${testCloser.id}), Setter(${testSetter.id}), Trainee(${testTrainee.id})`);
  
  console.log("Finding some free parcels...");
  const parcels = await prisma.parcel.findMany({
    where: { status: "AVAILABLE" },
    take: 5
  });

  if (parcels.length < 5) {
    console.log("Not enough available parcels found! Found: " + parcels.length);
    // If we don't have enough parcels, let's create a few dummy ones
    for(let i=parcels.length; i<5; i++) {
        const dummyParcel = await prisma.parcel.create({
            data: {
                externalId: `DUMMY_PARCEL_${Date.now()}_${i}`,
                address: `Dummy Address ${i}`,
                status: "AVAILABLE",
                geometry: JSON.stringify({ type: "Polygon", coordinates: [] })
            }
        });
        parcels.push(dummyParcel);
    }
  }

  console.log("Creating 5 active leads (visits) on these parcels...");

  for (let i = 0; i < 5; i++) {
    const parcel = parcels[i];
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
        legacyNotes: `Test lead note ${i + 1} from team (Setter: ${creator.name})`,
      }
    });
    
    console.log(`Lead created on parcel ${parcel.address} (${parcel.id})`);
  }
  
  console.log("Done seeding test leads.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
