import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetParcels() {
  try {
    console.log("🔄 Iniciando reseteo de parcelas...\n");

    // Contar parcelas antes
    const totalParcels = await prisma.parcel.count();
    const claimedParcels = await prisma.parcel.count({
      where: { status: { not: "AVAILABLE" } },
    });

    console.log(`📊 Total de parcelas: ${totalParcels}`);
    console.log(`📊 Parcelas reclamadas: ${claimedParcels}\n`);

    // Resetear todas las parcelas
    const result = await prisma.parcel.updateMany({
      data: {
        setterId: null,
        status: "AVAILABLE",
      },
    });

    console.log(`✅ ${result.count} parcelas reseteadas exitosamente\n`);

    // Opcional: eliminar visitas asociadas
    const deleteVisits = process.argv.includes("--delete-visits");
    if (deleteVisits) {
      console.log("🗑️  Eliminando visitas asociadas...");
      const visitsDeleted = await prisma.visit.deleteMany({});
      console.log(`✅ ${visitsDeleted.count} visitas eliminadas\n`);
    }

    console.log("🎉 Reseteo completado!");
    console.log("\n💡 Para eliminar también las visitas, usa:");
    console.log("   npx tsx prisma/reset-parcels.ts --delete-visits\n");
  } catch (error) {
    console.error("❌ Error al resetear parcelas:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetParcels();
