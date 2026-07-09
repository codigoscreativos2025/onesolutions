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

    // Convertir fechas de string a Date
    const processedDetails = { ...details };
    if (processedDetails.closingDate && typeof processedDetails.closingDate === 'string') {
      processedDetails.closingDate = new Date(processedDetails.closingDate);
    }
    if (processedDetails.siteSurveyDate && typeof processedDetails.siteSurveyDate === 'string') {
      processedDetails.siteSurveyDate = new Date(processedDetails.siteSurveyDate);
    }

    // Verificar si ya existe
    const existing = await prisma.projectDetails.findUnique({
      where: { visitId: parseInt(visitId) },
    });

    let result;
    if (existing) {
      result = await prisma.projectDetails.update({
        where: { visitId: parseInt(visitId) },
        data: processedDetails,
      });
    } else {
      result = await prisma.projectDetails.create({
        data: {
          visitId: parseInt(visitId),
          ...processedDetails,
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

    // Convertir fechas de string a Date
    const processedDetails = { ...details };
    if (processedDetails.closingDate && typeof processedDetails.closingDate === 'string') {
      processedDetails.closingDate = new Date(processedDetails.closingDate);
    }
    if (processedDetails.siteSurveyDate && typeof processedDetails.siteSurveyDate === 'string') {
      processedDetails.siteSurveyDate = new Date(processedDetails.siteSurveyDate);
    }

    const result = await prisma.projectDetails.update({
      where: { visitId: parseInt(visitId) },
      data: processedDetails,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error updating details" }, { status: 500 });
  }
}
