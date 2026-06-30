import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const badges = await prisma.badge.findMany({
      orderBy: [{ role: "asc" }, { doorsThreshold: "asc" }],
      include: {
        _count: {
          select: { userBadges: true },
        },
      },
    });
    return NextResponse.json(badges);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error fetching badges" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, icon, color, role, doorsThreshold, prospectsThreshold, projectsThreshold } = body;

    const badge = await prisma.badge.create({
      data: {
        name,
        description,
        icon,
        color: color || "#006e00",
        role,
        doorsThreshold,
        prospectsThreshold,
        projectsThreshold,
      },
    });

    return NextResponse.json(badge, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error creating badge" }, { status: 500 });
  }
}
