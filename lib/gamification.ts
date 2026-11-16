import { prisma } from "@/lib/prisma";

export async function broadcastGamificationEvent(
  title: string,
  body: string,
  link: string | null = null,
  excludeUserId?: number
) {
  // Las notificaciones personales en la campanita NUNCA deben mostrar acciones
  // o leads de otros usuarios (evitar filtración de datos privados entre usuarios).
  // Los eventos de gamification se descartan o se limitan a auditoría interna.
  return;
}
