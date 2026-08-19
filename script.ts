import { prisma } from './lib/prisma.ts'; prisma.parcel.findFirst({ where: { address: { contains: '135 N LUCERNE' } } }).then(p => console.log(p));
