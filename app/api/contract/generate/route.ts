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

    const rawDate = (d: Date | string | null | undefined): string => {
      if (!d) return "";
      try {
        const date = new Date(d);
        if (isNaN(date.getTime())) return "";
        if (date.toISOString().endsWith("T00:00:00.000Z")) {
           return date.toISOString().split('T')[0];
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch {
        return "";
      }
    };

    const fmtDate = (d: Date | string | null | undefined): string => {
      if (!d) return "";
      try {
        let date: Date;
        if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
          const [year, month, day] = d.split('-').map(Number);
          date = new Date(year, month - 1, day);
        } else {
          date = new Date(d);
          if (isNaN(date.getTime())) return "";
          if (date.toISOString().endsWith("T00:00:00.000Z")) {
             return date.toLocaleDateString("en-GB", {
                timeZone: "UTC",
                day: "numeric",
                month: "long",
                year: "numeric",
              });
          }
        }
        return date.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      } catch {
        return "";
      }
    };

    const fmtMoney = (v: number | null | undefined): string => {
      if (v == null) return "";
      return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    let savedSigs: Record<string, Record<string, string>> = {};
    if (visit.contractSignatures) {
      try {
        savedSigs = JSON.parse(visit.contractSignatures);
      } catch {}
    }

    let savedFields: Record<string, Record<string, string>> = {};
    if ((visit as Record<string, unknown>).contractFields) {
      try {
        savedFields = JSON.parse((visit as Record<string, unknown>).contractFields as string);
      } catch {}
    }

    const contracts = matchingTemplates.map(template => {
      const data: Record<string, string> = {};
      data.clientName = clientName;
      data.clientEmail = visit.bill?.clientEmail || details?.clientEmail || "";
      data.date = rawDate(details?.closingDate) || rawDate(new Date());

      if (template.projectType === "Techo" || template.projectType === "Flat Roofing") {
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

      if (template.projectType === "Purificador de Agua") {
        data.clientName = clientName;
        data.clientAddress = visit.parcel.address || "";
        data.clientCity = "Orlando";
        data.clientEmail = visit.bill?.clientEmail || "";
        data.clientZip = "";
        data.clientPhone = visit.bill?.phone || "";
        data.rep = visit.setter.name || "";
        data.totalPrice = fmtMoney(details?.waterSalePrice || details?.otherSalePrice);
        data.companySignature = "";
        data.companyDate = "";
        data.customerSignature = "";
        data.customerDate = "";
        data.cancelSignature = "";
      }

      if (template.projectType === "Fence") {
        data.clientName = clientName;
        data.clientAddress = visit.parcel.address || "";
        data.date = rawDate(details?.closingDate) || rawDate(new Date());
        data.clientPhone = visit.bill?.phone || "";
        data.serviceType = "";
        data.paymentTerms = "";
        data.detailLine1 = "";
        data.detailLine2 = "";
        data.detailLine3 = "";
        data.totalAmount = fmtMoney(details?.otherSalePrice);
        data.clientSignature = "";
        data.signatureDate = "";
      }

      const typeSigs = savedSigs[template.projectType];
      if (typeSigs) {
        Object.assign(data, typeSigs);
      }

      const typeFields = savedFields[template.projectType];
      if (typeFields) {
        Object.assign(data, typeFields);
      }

      const htmlData = { ...data };
      template.fields.forEach(f => {
        if (f.type === "date" && htmlData[f.key]) {
          htmlData[f.key] = fmtDate(htmlData[f.key]);
        }
      });

      return {
        type: template.projectType,
        name: template.name,
        html: template.html(htmlData),
        fields: template.fields,
        data,
        allowSigning: visit.stage !== "PROPOSAL_ACCEPTED" && visit.stage !== "IN_PROGRESS",
      };
    });

    return NextResponse.json({ contracts });
  } catch (error) {
    console.error("Error generating contracts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { visitId, fieldValues } = body;

    if (!visitId) {
      return NextResponse.json({ error: "visitId is required" }, { status: 400 });
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

    const rawDate = (d: Date | string | null | undefined): string => {
      if (!d) return "";
      try {
        const date = new Date(d);
        if (isNaN(date.getTime())) return "";
        if (date.toISOString().endsWith("T00:00:00.000Z")) {
           return date.toISOString().split('T')[0];
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch {
        return "";
      }
    };

    const fmtDate = (d: Date | string | null | undefined): string => {
      if (!d) return "";
      try {
        let date: Date;
        if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
          const [year, month, day] = d.split('-').map(Number);
          date = new Date(year, month - 1, day);
        } else {
          date = new Date(d);
          if (isNaN(date.getTime())) return "";
          if (date.toISOString().endsWith("T00:00:00.000Z")) {
             return date.toLocaleDateString("en-GB", {
                timeZone: "UTC",
                day: "numeric",
                month: "long",
                year: "numeric",
              });
          }
        }
        return date.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      } catch {
        return "";
      }
    };

    const fmtMoney = (v: number | null | undefined): string => {
      if (v == null) return "";
      return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    let savedSigs: Record<string, Record<string, string>> = {};
    if (visit.contractSignatures) {
      try {
        savedSigs = JSON.parse(visit.contractSignatures);
      } catch {}
    }

    let savedFields: Record<string, Record<string, string>> = {};
    if ((visit as Record<string, unknown>).contractFields) {
      try {
        savedFields = JSON.parse((visit as Record<string, unknown>).contractFields as string);
      } catch {}
    }

    const contracts = matchingTemplates.map(template => {
      const data: Record<string, string> = {};
      data.clientName = clientName;
      data.clientEmail = visit.bill?.clientEmail || details?.clientEmail || "";
      data.date = rawDate(details?.closingDate) || rawDate(new Date());

      if (template.projectType === "Techo" || template.projectType === "Flat Roofing") {
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

      if (template.projectType === "Purificador de Agua") {
        data.clientName = clientName;
        data.clientAddress = visit.parcel.address || "";
        data.clientCity = "Orlando";
        data.clientEmail = visit.bill?.clientEmail || "";
        data.clientZip = "";
        data.clientPhone = visit.bill?.phone || "";
        data.rep = visit.setter.name || "";
        data.totalPrice = fmtMoney(details?.waterSalePrice || details?.otherSalePrice);
        data.companySignature = "";
        data.companyDate = "";
        data.customerSignature = "";
        data.customerDate = "";
        data.cancelSignature = "";
      }

      if (template.projectType === "Fence") {
        data.clientName = clientName;
        data.clientAddress = visit.parcel.address || "";
        data.date = rawDate(details?.closingDate) || rawDate(new Date());
        data.clientPhone = visit.bill?.phone || "";
        data.serviceType = "";
        data.paymentTerms = "";
        data.detailLine1 = "";
        data.detailLine2 = "";
        data.detailLine3 = "";
        data.totalAmount = fmtMoney(details?.otherSalePrice);
        data.clientSignature = "";
        data.signatureDate = "";
      }

      const typeSigs = savedSigs[template.projectType];
      if (typeSigs) {
        Object.assign(data, typeSigs);
      }

      const typeFields = savedFields[template.projectType];
      if (typeFields) {
        Object.assign(data, typeFields);
      }

      if (fieldValues) {
        Object.assign(data, fieldValues);
      }

      const htmlData = { ...data };
      template.fields.forEach(f => {
        if (f.type === "date" && htmlData[f.key]) {
          htmlData[f.key] = fmtDate(htmlData[f.key]);
        }
      });

      return {
        type: template.projectType,
        name: template.name,
        html: template.html(htmlData),
        fields: template.fields,
        data,
        allowSigning: visit.stage !== "PROPOSAL_ACCEPTED" && visit.stage !== "IN_PROGRESS",
      };
    });

    return NextResponse.json({ contracts });
  } catch (error) {
    console.error("Error generating contracts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
