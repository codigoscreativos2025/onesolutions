import { sendNotification } from '../lib/notificationService';

async function main() {
  console.log("Enviando notificacion al Closer 1 (ID: 48)...");
  await sendNotification({
    recipientId: 48,
    title: "Alerta de Prueba para Closer 1",
    body: "Esta notificación SOLO la deberías ver tú. Closer 2 no debe verla.",
    targetType: "TEST",
  });

  console.log("Enviando notificacion al Closer 2 (ID: 52)...");
  await sendNotification({
    recipientId: 52,
    title: "Alerta de Prueba para Closer 2",
    body: "Esta notificación es exclusiva para el Test Closer.",
    targetType: "TEST",
  });

  console.log("Notificaciones inyectadas con éxito.");
}

main().catch(console.error);
