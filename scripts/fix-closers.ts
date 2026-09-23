import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando correccion de closerIds...");
  
  // Encontrar todas las visitas transferidas a Closers donde el setterId cambio
  // pero el closerId se quedo pegado en otro usuario
  
  // Obtenemos a todos los usuarios con rol CLOSER
  const closers = await prisma.user.findMany({
    where: { role: 'CLOSER' },
    select: { id: true, name: true }
  });
  
  console.log(`Encontrados ${closers.length} Closers activos.`);
  let updatedCount = 0;
  
  for (const closer of closers) {
    // Buscar proyectos/visitas donde este closer fue asignado como setter (por la transferencia)
    // pero el closerId no es el mismo.
    const visits = await prisma.visit.findMany({
      where: {
        setterId: closer.id,
        closerId: { not: closer.id }
      },
      select: { id: true, closerId: true }
    });
    
    if (visits.length > 0) {
      console.log(`Actualizando ${visits.length} visitas para el closer ${closer.name}...`);
      await prisma.visit.updateMany({
        where: { id: { in: visits.map(v => v.id) } },
        data: { closerId: closer.id }
      });
      updatedCount += visits.length;
    }
  }
  
  console.log(`¡Correccion completada! Se actualizaron ${updatedCount} visitas en total.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
