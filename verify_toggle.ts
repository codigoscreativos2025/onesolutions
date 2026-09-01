import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "trainee@onesolutions.com";
  
  // 1. Obtener estado inicial
  let user = await prisma.user.findUnique({ where: { email } });
  console.log(`Estado inicial de ${user?.name}: Activo = ${user?.isActive}`);

  // 2. Desactivar
  console.log("Desactivando usuario...");
  user = await prisma.user.update({
    where: { email },
    data: { isActive: false }
  });
  console.log(`Nuevo estado: Activo = ${user?.isActive}`);

  // 3. Reactivar
  console.log("Reactivando usuario...");
  user = await prisma.user.update({
    where: { email },
    data: { isActive: true }
  });
  console.log(`Estado final: Activo = ${user?.isActive}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
