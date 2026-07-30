import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Wipe all data in correct order (foreign key dependencies)
  await prisma.closerCommission.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatRoom.deleteMany();
  await prisma.visitCloserObjection.deleteMany();
  await prisma.visitObjection.deleteMany();
  await prisma.visitNotAvailableTag.deleteMany();
  await prisma.projectDetails.deleteMany();
  await prisma.visitProject.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.closerSlot.deleteMany();
  await prisma.weeklyPattern.deleteMany();
  await prisma.slotReassignment.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.businessGoal.deleteMany();
  await prisma.businessSettings.deleteMany();
  await prisma.frequentContact.deleteMany();
  await prisma.generatedInvoice.deleteMany();
  await prisma.projectTypeField.deleteMany();
  await prisma.parcelVisitHistory.deleteMany();
  await prisma.parcel.deleteMany();
  await prisma.objection.deleteMany();
  await prisma.closerObjection.deleteMany();
  await prisma.notAvailableTag.deleteMany();
  await prisma.projectType.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash("admin", 10);

  // Create users
  const admin = await prisma.user.create({
    data: { email: "admin@onesolutions.com", name: "Admin Principal", password: hash, role: "ADMIN" },
  });

  const closer = await prisma.user.create({
    data: { email: "closer@onesolutions.com", name: "Carlos Mendoza", password: hash, role: "CLOSER" },
  });

  const trainee = await prisma.user.create({
    data: { email: "trainee@onesolutions.com", name: "Alex Rivera", password: hash, role: "SETTER", closerId: closer.id },
  });

  const setter = await prisma.user.create({
    data: { email: "setter@onesolutions.com", name: "Maria Lopez", password: hash, role: "SETTER_JR", closerId: closer.id },
  });

  const partner = await prisma.user.create({
    data: { email: "partner@onesolutions.com", name: "Partner Demo", password: hash, role: "PARTNER" },
  });

  // Project types
  const projectTypes = [
    { name: "Panel Solar", description: "Instalacion de paneles solares" },
    { name: "Techo", description: "Reparacion de techo" },
    { name: "Purificacion de agua", description: "Sistema de purificacion para agua" },
    { name: "Fence", description: "Cercas y vallas" },
    { name: "Gutters", description: "Canaletas y desagues" },
    { name: "Remodelacion", description: "Remodelacion general" },
  ];

  for (const pt of projectTypes) {
    await prisma.projectType.create({ data: pt });
  }

  const badgesData = [
    { name: "20 Puertas Tocadas", description: "Tocó 20 puertas", icon: "🥉", color: "#CE8946", role: "SETTER", doorsThreshold: 20 },
    { name: "10 Leads Generados", description: "Generó 10 leads", icon: "🥈", color: "#C4C4C4", role: "SETTER", prospectsThreshold: 10 },
    { name: "5 Proyectos Cerrados", description: "Cerró 5 proyectos", icon: "🥇", color: "#EFBF04", role: "CLOSER", projectsThreshold: 5 },
  ];

  for (const badge of badgesData) {
    const existing = await prisma.badge.findFirst({ where: { name: badge.name } });
    if (!existing) {
      await prisma.badge.create({
        data: {
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          color: badge.color,
          role: badge.role,
          doorsThreshold: badge.doorsThreshold ?? null,
          prospectsThreshold: badge.prospectsThreshold ?? null,
          projectsThreshold: badge.projectsThreshold ?? null,
        },
      });
    }
  }

  // Create user profiles for all users
  for (const user of [admin, closer, trainee, setter, partner]) {
    await prisma.userProfile.create({
      data: { userId: user.id, joinDate: new Date() },
    });
  }

  console.log("Seed completado - 5 usuarios + 6 tipos de proyecto");
  console.log("");
  console.log("Credenciales:");
  console.log("  Admin:   admin@onesolutions.com / admin");
  console.log("  Closer:  closer@onesolutions.com / admin");
  console.log("  Trainee: trainee@onesolutions.com / admin");
  console.log("  Setter:  setter@onesolutions.com / admin");
  console.log("  Partner: partner@onesolutions.com / admin");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
