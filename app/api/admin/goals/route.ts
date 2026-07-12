import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const goals = await prisma.businessGoal.findMany({
      orderBy: { startDate: "desc" },
    });
    return NextResponse.json(goals);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error fetching goals" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { period, doorsGoal, prospectsGoal, projectsGoal, startDate, endDate } = body;

    // Desactivar metas anteriores del mismo período
    await prisma.businessGoal.updateMany({
      where: { period },
      data: { endDate: new Date() },
    });

    const goal = await prisma.businessGoal.create({
      data: {
        period,
        doorsGoal: doorsGoal || 0,
        prospectsGoal: prospectsGoal || 0,
        projectsGoal: projectsGoal || 0,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error creating goal" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { doorsGoal, prospectsGoal, projectsGoal } = body;

    const goal = await prisma.businessGoal.update({
      where: { id: parseInt(id) },
      data: {
        doorsGoal,
        prospectsGoal,
        projectsGoal,
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error updating goal" }, { status: 500 });
  }
}
