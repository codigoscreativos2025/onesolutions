import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getTemplatesByProjectTypes } from "@/lib/contract-templates";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const visitIdParam = searchParams.get("visitId");

  if (!visitIdParam) {
    return NextResponse.json({ error: "visitId query parameter is required" }, { status: 400 });
  }

  const visitId = parseInt(visitIdParam, 10);
  if (isNaN(visitId)) {
    return NextResponse.json({ error: "visitId must be a number" }, { status: 400 });
  }

  try {
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

    const role = session.user.role;
    const userId = parseInt(session.user.id);
    const isAuthorized =
      role === "CLOSER" ||
      role === "ADMIN" ||
      visit.setter.id === userId;
    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const projectTypeNames = visit.projects.map(p => p.projectType.name);
    const matchingTemplates = getTemplatesByProjectTypes(projectTypeNames);

    const details = visit.projectDetails;
    const clientName =
      details?.clientName ||
      visit.bill?.clientName ||
      visit.parcel.ownerName ||
      "";

    const fmtDate = (d: Date | string | null | undefined): string => {
      if (!d) return "";
      try {
        const date = new Date(d);
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      } catch {
        return "";
      }
    };

    const fmtMoney = (v: number | null | undefined): string => {
      if (v == null) return "";
      return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const contracts = matchingTemplates.map(template => {
      const data: Record<string, string> = {};
      data.clientName = clientName;
      data.date = fmtDate(details?.closingDate) || fmtDate(new Date());

      if (template.projectType === "Techo") {
        data.roofColor = "";
        data.shingleTotal = fmtMoney(details?.roofSalePrice);
        data.optionalWarrantyCost = "";
        data.optionalUpgradeCost = "";
        data.companySignature = "";
        data.companyDate = "";
        data.customerSignature1 = "";
        data.customerDate1 = "";
        data.customerSignature2 = "";
        data.customerDate2 = "";
      }

      if (template.projectType === "Panel Solar") {
        data.systemSize = details?.systemSize || "";
        data.ppwSold = details?.ppwSold || "";
        data.solarFinancier = details?.solarFinancier || "";
        data.totalPrice = fmtMoney(details?.roofSalePrice);
        data.companySignature = "";
        data.companyDate = "";
        data.customerSignature1 = "";
        data.customerDate1 = "";
      }

      if (template.projectType === "Purificador de Agua") {
        data.waterSystemType = details?.waterSystemType || "";
        data.totalPrice = fmtMoney(details?.waterSalePrice);
        data.companySignature = "";
        data.companyDate = "";
        data.customerSignature1 = "";
        data.customerDate1 = "";
      }

      return {
        projectType: template.projectType,
        name: template.name,
        html: template.html(data),
        fields: template.fields,
      };
    });

    return NextResponse.json({ contracts });
  } catch (error) {
    console.error("Error generating contracts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
