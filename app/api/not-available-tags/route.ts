import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tags = await prisma.notAvailableTag.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: { id: true, name: true, nameEn: true, color: true },
  });

  return NextResponse.json(tags);
}
