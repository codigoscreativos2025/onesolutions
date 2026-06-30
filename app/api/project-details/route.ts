import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const visitId = searchParams.get("visitId");

  if (!visitId) {
    return NextResponse.json({ error: "visitId required" }, { status: 400 });
  }

  try {
    const details = await prisma.projectDetails.findUnique({
      where: { visitId: parseInt(visitId) },
    });
    return NextResponse.json(details);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error fetching details" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { visitId, ...details } = data;

    if (!visitId) {
      return NextResponse.json({ error: "visitId required" }, { status: 400 });
    }

    // Verificar si ya existe
    const existing = await prisma.projectDetails.findUnique({
      where: { visitId: parseInt(visitId) },
    });

    let result;
    if (existing) {
      result = await prisma.projectDetails.update({
        where: { visitId: parseInt(visitId) },
        data: details,
      });
    } else {
      result = await prisma.projectDetails.create({
        data: {
          visitId: parseInt(visitId),
          ...details,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error saving details" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { visitId, ...details } = data;

    if (!visitId) {
      return NextResponse.json({ error: "visitId required" }, { status: 400 });
    }

    const result = await prisma.projectDetails.update({
      where: { visitId: parseInt(visitId) },
      data: details,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error updating details" }, { status: 500 });
  }
}
