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

    const parsedVisitId = parseInt(visitId);
    const visit = await prisma.visit.findUnique({
      where: { id: parsedVisitId },
      include: { slot: true },
    });

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
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
    ];
    for (const key of numericFields) {
      if (processedDetails[key] !== undefined && processedDetails[key] !== "" && processedDetails[key] !== null) {
        const num = parseFloat(String(processedDetails[key]));
        if (!isNaN(num)) processedDetails[key] = num;
      }
    }

    // Filtrar solo campos válidos del modelo ProjectDetails
    const validFields = [
      "clientName", "clientEmail", "address", "closingDate",
      "primaryRep", "primaryRepCommPct", "secondaryRep", "secondaryRepCommPct",
      "tertiaryRep", "tertiaryRepCommPct",
      "solarFinancier", "systemSize", "hoaInfo", "hoaImage1Url", "hoaImage2Url", "hoaImage3Url", "ppwSold", "umbrella", "mpuPanels",
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
      "solarPaymentMethod", "roofPaymentMethod", "waterPaymentMethod",
      "fencePaymentMethod", "gutterPaymentMethod", "remodelacionPaymentMethod",
      "otroPaymentMethod", "otroDescripcion",
    ];
    const filteredDetails: Record<string, unknown> = {};
    for (const key of validFields) {
      if (processedDetails[key] !== undefined) {
        filteredDetails[key] = processedDetails[key];
      }
    }
    const existing = await prisma.projectDetails.findUnique({
      where: { visitId: parsedVisitId },
    });

    let result;
    try {
      if (existing) {
        result = await prisma.projectDetails.update({ where: { visitId: parsedVisitId }, data: filteredDetails });
      } else {
        result = await prisma.projectDetails.create({ data: { visitId: parsedVisitId, ...filteredDetails } });
      }

      // Sync lead name to Bill and Parcel
      const clientName = typeof filteredDetails.clientName === "string" ? filteredDetails.clientName.trim() : null;
      if (clientName) {
        await prisma.bill.upsert({
          where: { visitId: parsedVisitId },
          update: { clientName },
          create: { visitId: parsedVisitId, clientName, phone: "" },
        }).catch((e) => console.error("Error syncing bill clientName:", e));

        if (visit.parcelId) {
          await prisma.parcel.update({
            where: { id: visit.parcelId },
            data: { ownerName: clientName },
          }).catch((e) => console.error("Error syncing parcel ownerName:", e));
        }
      }

      // If closingDate was updated, ensure visit.completedAt is also synced
      if (filteredDetails.closingDate instanceof Date) {
        await prisma.visit.update({
          where: { id: parsedVisitId },
          data: { completedAt: filteredDetails.closingDate },
        }).catch((e) => console.error("Error syncing completedAt:", e));
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

    const parsedVisitId = parseInt(visitId);

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
    ];
    for (const key of numericFields) {
      if (processedDetails[key] !== undefined && processedDetails[key] !== "" && processedDetails[key] !== null) {
        const num = parseFloat(String(processedDetails[key]));
        if (!isNaN(num)) processedDetails[key] = num;
      }
    }

    const result = await prisma.projectDetails.update({
      where: { visitId: parsedVisitId },
      data: processedDetails,
    });

    // Sync lead name to Bill and Parcel
    const clientName = typeof processedDetails.clientName === "string" ? processedDetails.clientName.trim() : null;
    if (clientName) {
      await prisma.bill.upsert({
        where: { visitId: parsedVisitId },
        update: { clientName },
        create: { visitId: parsedVisitId, clientName, phone: "" },
      }).catch((e) => console.error("Error syncing bill clientName in PATCH:", e));

      const v = await prisma.visit.findUnique({
        where: { id: parsedVisitId },
        select: { parcelId: true },
      });
      if (v?.parcelId) {
        await prisma.parcel.update({
          where: { id: v.parcelId },
          data: { ownerName: clientName },
        }).catch((e) => console.error("Error syncing parcel ownerName in PATCH:", e));
      }
    }

    if (processedDetails.closingDate instanceof Date) {
      await prisma.visit.update({
        where: { id: parsedVisitId },
        data: { completedAt: processedDetails.closingDate },
      }).catch((e) => console.error("Error syncing completedAt in PATCH:", e));
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error updating details" }, { status: 500 });
  }
}
