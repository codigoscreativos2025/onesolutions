import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
export const dynamic = 'force-dynamic';

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

    // Convertir campos numéricos
    const numericFields = [
      "primaryRepCommPct", "secondaryRepCommPct", "tertiaryRepCommPct",
      "panelsUpCount", "panelsDownCount",
      "solarCostPrice", "solarSalePrice", "solarCommission",
      "roofCostPrice", "roofSalePrice", "roofCommission",
      "waterCostPrice", "waterSalePrice", "waterCommission",
      "otherCostPrice", "otherSalePrice", "otherCommission",
      "fenceCostPrice", "fenceSalePrice", "fenceCommission",
      "gutterCostPrice", "gutterSalePrice", "gutterCommission",
      "remodelacionCostPrice", "remodelacionSalePrice", "remodelacionCommission",
      "generalCostPrice", "generalSalePrice",
    ];
    for (const key of numericFields) {
      if (processedDetails[key] !== undefined && processedDetails[key] !== "" && processedDetails[key] !== null) {
        const num = parseFloat(String(processedDetails[key]));
        if (!isNaN(num)) processedDetails[key] = num;
      }
    }

    // Filtrar solo campos válidos del modelo ProjectDetails
    const validFields = [
      "clientName", "clientEmail", "address", "closingDate", "paymentMethod",
      "primaryRep", "primaryRepCommPct", "secondaryRep", "secondaryRepCommPct",
      "tertiaryRep", "tertiaryRepCommPct",
      "solarFinancier", "systemSize", "hoaInfo", "ppwSold", "umbrella", "mpuPanels",
      "siteSurveyDate", "panelsUpCount", "panelsDownCount", "panelsPhotoUrl",
      "solarCostPrice", "solarSalePrice", "solarCommission",
      "electricBillUrl", "closingFormUrl", "homeInsuranceUrl", "homeTitleUrl", "idDocumentUrl",
      "roofType", "roofCostPrice", "roofSalePrice", "roofCommission",
      "nocUrl", "materialsOrderUrl", "roofReportUrl", "exteriorScopeUrl", "propertyPhotosJson",
      "waterSystemType", "waterCostPrice", "waterSalePrice", "waterCommission",
      "otherCostPrice", "otherSalePrice", "otherCommission", "clientIncentive",
      "fenceCostPrice", "fenceSalePrice", "fenceCommission",
      "gutterCostPrice", "gutterSalePrice", "gutterCommission",
      "remodelacionCostPrice", "remodelacionSalePrice", "remodelacionCommission",
      "generalCostPrice", "generalSalePrice",
    ];
    const filteredDetails: Record<string, unknown> = {};
    for (const key of validFields) {
      if (processedDetails[key] !== undefined) {
        filteredDetails[key] = processedDetails[key];
      }
    }
    const existing = await prisma.projectDetails.findUnique({
      where: { visitId: parseInt(visitId) },
    });

    let result;
    try {
      if (existing) {
        result = await prisma.projectDetails.update({ where: { visitId: parseInt(visitId) }, data: filteredDetails });
      } else {
        result = await prisma.projectDetails.create({ data: { visitId: parseInt(visitId), ...filteredDetails } });
      }
    } catch (prismaError: unknown) {
      const msg = (prismaError as Error).message || String(prismaError);
      console.error("Prisma error saving project details:", msg);
      return NextResponse.json({ error: "Database error", details: msg }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error saving details:", msg);
    return NextResponse.json({ error: "Error saving details", details: msg }, { status: 500 });
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

    // Convertir campos numéricos
    const numericFields = [
      "primaryRepCommPct", "secondaryRepCommPct", "tertiaryRepCommPct",
      "panelsUpCount", "panelsDownCount",
      "solarCostPrice", "solarSalePrice", "solarCommission",
      "roofCostPrice", "roofSalePrice", "roofCommission",
      "waterCostPrice", "waterSalePrice", "waterCommission",
      "otherCostPrice", "otherSalePrice", "otherCommission",
      "fenceCostPrice", "fenceSalePrice", "fenceCommission",
      "gutterCostPrice", "gutterSalePrice", "gutterCommission",
      "remodelacionCostPrice", "remodelacionSalePrice", "remodelacionCommission",
      "generalCostPrice", "generalSalePrice",
    ];
    for (const key of numericFields) {
      if (processedDetails[key] !== undefined && processedDetails[key] !== "" && processedDetails[key] !== null) {
        const num = parseFloat(String(processedDetails[key]));
        if (!isNaN(num)) processedDetails[key] = num;
      }
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
