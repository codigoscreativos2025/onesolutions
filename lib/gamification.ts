import { prisma } from "@/lib/prisma";

export async function broadcastGamificationEvent(
  title: string,
  body: string,
  link: string | null = null,
  excludeUserId?: number
) {
  // Gamification feed is visible to: SETTER (Trainee), CLOSER, ADMIN
  // SETTER_JR (Setter) is excluded as they don't have notification bell or chat
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: ["SETTER", "CLOSER", "ADMIN"] },
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true },
  });

  if (users.length === 0) return;

  const notifications = users.map((user) => ({
    userId: user.id,
    title,
    body,
    link,
    isRead: false,
  }));

  await prisma.notification.createMany({ data: notifications });
}
