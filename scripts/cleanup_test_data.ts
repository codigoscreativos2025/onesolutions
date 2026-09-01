import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Fetching fake users...");
  const fakeUsers = await prisma.user.findMany({
    where: { 
      email: { startsWith: 'test' }
    }
  });

  if (fakeUsers.length === 0) {
    console.log("No fake users found. Might have already been deleted or used a different email string.");
    // Fallback: search by name
    const fallbackUsers = await prisma.user.findMany({
        where: { name: { in: ['Test Closer', 'Test Setter', 'Test Trainee'] } }
    });
    fakeUsers.push(...fallbackUsers);
  }

  const userIds = fakeUsers.map(u => u.id);
  
  if (userIds.length > 0) {
    console.log(`Found fake user IDs: ${userIds.join(', ')}`);
    
    console.log("Deleting fake visits (leads)...");
    await prisma.visit.deleteMany({
      where: {
        OR: [
          { setterId: { in: userIds } },
          { closerId: { in: userIds } }
        ]
      }
    });

    console.log("Resetting parcels...");
    await prisma.parcel.updateMany({
      where: { setterId: { in: userIds } },
      data: {
        status: "AVAILABLE",
        setterId: null,
      }
    });

    console.log("Deleting fake notifications...");
    await prisma.notification.deleteMany({
      where: { userId: { in: userIds } }
    });

    console.log("Deleting fake users...");
    await prisma.user.deleteMany({
      where: { id: { in: userIds } }
    });
    
    console.log("Cleanup complete!");
  } else {
    console.log("No fake users found to delete.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
