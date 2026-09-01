const http = require('http');

async function main() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const rooms = await prisma.chatRoom.findMany({ include: { personalUser: true } });
  console.log("DB Rooms length:", rooms.length);
  const jsonRooms = JSON.stringify(rooms);
  console.log("DB Rooms:", jsonRooms);
}
main();
