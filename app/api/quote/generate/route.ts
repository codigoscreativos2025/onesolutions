import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { generateQuotePDF, generateContractPDF } from "@/lib/quote-templates";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  const userId = parseInt(session.user.id);

  try {
    const body = await request.json();
    const { visitId, type, signatureDataUrl } = body as {
      visitId: number;
      type: "quote" | "contract";
      signatureDataUrl?: string;
    };

    if (!visitId || !type || !["quote", "contract"].includes(type)) {
      return NextResponse.json({ error: "visitId and type (quote or contract) are required" }, { status: 400 });
    }

    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        parcel: {
          select: {
            id: true,
            address: true,
            ownerName: true,
          },
        },
        setter: {
          select: { id: true, name: true },
        },
        closer: {
          select: { id: true, name: true },
        },
        bill: {
          select: {
            clientName: true,
            clientEmail: true,
            phone: true,
          },
        },
        projectDetails: true,
        projects: {
          include: {
            projectType: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    const isAuthorized =
      role === "CLOSER" ||
      role === "ADMIN" ||
      visit.setter.id === userId;

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let businessSettings = null;
    try {
      businessSettings = await prisma.businessSettings.findFirst();
    } catch {
      // businessSettings table may not exist yet
    }

    let pdf: import("jspdf").jsPDF;

    const quoteData = {
      parcel: visit.parcel,
      bill: visit.bill,
      projects: visit.projects,
    };

    if (type === "quote") {
      pdf = generateQuotePDF(quoteData, businessSettings);
    } else {
      pdf = generateContractPDF(
        {
          ...quoteData,
          projectDetails: {
            clientName: visit.projectDetails?.clientName ?? null,
            clientEmail: visit.projectDetails?.clientEmail ?? null,
            address: visit.projectDetails?.address ?? null,
            closingDate: visit.projectDetails?.closingDate?.toISOString() ?? null,
            paymentMethod: visit.projectDetails?.paymentMethod ?? null,
            solarFinancier: visit.projectDetails?.solarFinancier ?? null,
            systemSize: visit.projectDetails?.systemSize ?? null,
            hoaInfo: visit.projectDetails?.hoaInfo ?? null,
            ppwSold: visit.projectDetails?.ppwSold ?? null,
            umbrella: visit.projectDetails?.umbrella ?? null,
            mpuPanels: visit.projectDetails?.mpuPanels ?? null,
            siteSurveyDate: visit.projectDetails?.siteSurveyDate?.toISOString() ?? null,
            panelsUp: visit.projectDetails?.panelsUp ?? false,
            panelsDown: visit.projectDetails?.panelsDown ?? false,
            roofType: visit.projectDetails?.roofType ?? null,
            roofCostPrice: visit.projectDetails?.roofCostPrice ?? null,
            roofSalePrice: visit.projectDetails?.roofSalePrice ?? null,
            roofCommission: visit.projectDetails?.roofCommission ?? null,
            waterSystemType: visit.projectDetails?.waterSystemType ?? null,
            waterCostPrice: visit.projectDetails?.waterCostPrice ?? null,
            waterSalePrice: visit.projectDetails?.waterSalePrice ?? null,
            waterCommission: visit.projectDetails?.waterCommission ?? null,
            primaryRep: visit.projectDetails?.primaryRep ?? null,
            primaryRepCommPct: visit.projectDetails?.primaryRepCommPct ?? null,
            secondaryRep: visit.projectDetails?.secondaryRep ?? null,
            secondaryRepCommPct: visit.projectDetails?.secondaryRepCommPct ?? null,
            tertiaryRep: visit.projectDetails?.tertiaryRep ?? null,
            tertiaryRepCommPct: visit.projectDetails?.tertiaryRepCommPct ?? null,
            otherCostPrice: visit.projectDetails?.otherCostPrice ?? null,
            otherSalePrice: visit.projectDetails?.otherSalePrice ?? null,
            otherCommission: visit.projectDetails?.otherCommission ?? null,
          },
        },
        signatureDataUrl ?? null,
        businessSettings
      );
    }

    const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));

    const filename =
      type === "quote"
        ? `cotizacion_visit_${visitId}.pdf`
        : `contrato_visit_${visitId}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
