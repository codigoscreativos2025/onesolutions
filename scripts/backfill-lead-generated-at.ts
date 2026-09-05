import { PrismaClient } from "@prisma/client";

async function main() {
  const p = new PrismaClient();

  const result = await p.visit.updateMany({
    where: {
      stage: { in: ["PROPOSAL_ACCEPTED", "PROJECT", "CLOSED"] },
      leadGeneratedAt: null,
    },
    data: {
      leadGeneratedAt: new Date(),
    },
  });

  console.log(`Backfilled leadGeneratedAt for ${result.count} existing lead visits.`);
  await p.$disconnect();
}
main();
