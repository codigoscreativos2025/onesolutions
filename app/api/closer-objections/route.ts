import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const objections = await prisma.closerObjection.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(objections);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error fetching closer objections" }, { status: 500 });
  }
}
