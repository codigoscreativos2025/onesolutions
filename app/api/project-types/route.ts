import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const projectTypes = await prisma.projectType.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(projectTypes);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error fetching project types" },
      { status: 500 }
    );
  }
}
