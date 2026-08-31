import { prisma } from "@/lib/prisma";
import { sendEmail, emailTemplates } from "@/lib/email";

export interface NotificationPayload {
  recipientId: number; // The exact user ID to receive the notification
  title: string;
  body: string;
  link?: string;
  targetType?: string;
  assignedCloserId?: number;
  teamId?: string;
}

/**
 * Servicio centralizado para emitir notificaciones acotadas estrictamente
 * al recipientId (userId), evitando fugas (Data Leakage) entre usuarios del mismo rol.
 */
export async function sendNotification(payload: NotificationPayload) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: payload.recipientId, // Strict binding to the recipient
        title: payload.title,
        body: payload.body,
        link: payload.link,
        targetType: payload.targetType,
        assignedCloserId: payload.assignedCloserId,
        teamId: payload.teamId,
      },
    });

    // Optionally send email
    const user = await prisma.user.findUnique({
      where: { id: payload.recipientId },
      select: { email: true, name: true, role: true },
    });

    if (user && user.email && !user.email.endsWith("@onesolutions.com")) {
      try {
        await sendEmail({
          to: user.email,
          subject: "Nueva notificación - One Solutions",
          html: emailTemplates.notification(user.name || "", payload.title, payload.body),
        });
      } catch {
        // Email failure shouldn't break notification
      }
    }

    return notification;
  } catch (error) {
    console.error("Error in notificationService:", error);
    throw error;
  }
}

/**
 * Envía una notificación a todos los administradores (excepción para auditoría).
 */
export async function notifyAdmins(payload: Omit<NotificationPayload, 'recipientId'>) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  const promises = admins.map(admin => 
    sendNotification({
      ...payload,
      recipientId: admin.id,
    })
  );

  return Promise.all(promises);
}
