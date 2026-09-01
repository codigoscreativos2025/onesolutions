
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { isActive: true },
  });

  const notifications = [
    {
      title: "Lead Creado",
      body: "Se creó el lead manual Juan Pérez por María López",
      link: null,
    },
    {
      title: "Cambio a Potencial",
      body: "El lead Familia Martínez pasó a estado POTENCIAL por Carlos Mendoza",
      link: null,
    },
    {
      title: "Lead Devuelto",
      body: "El lead Pedro Gómez fue devuelto a la lista de espera por Ana Soto",
      link: null,
    },
    {
      title: "Proyecto Cerrado",
      body: "¡Proyecto Solar Roof #124 CERRADO exitosamente por Alex Rivera!",
      link: null,
    }
  ];

  for (const user of users) {
    for (const notif of notifications) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: notif.title,
          body: notif.body,
          link: notif.link,
          isRead: false,
        }
      });
    }
  }

  console.log("Seeded notifications for " + users.length + " users.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
