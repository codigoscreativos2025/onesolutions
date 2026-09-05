import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const where: Record<string, unknown> = {};
  if (startDate || endDate) {
    where.date = {};
    if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate + "T00:00:00");
    if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate + "T23:59:59");
  }

  const invoices = await prisma.generatedInvoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invoices);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { invoiceNum, date, billToName, billToEmail, total, paid, balance, html } = body;

  if (!invoiceNum || !date || !billToName) {
    return NextResponse.json(
      { error: "invoiceNum, date, and billToName are required" },
      { status: 400 }
    );
  }

  const invoice = await prisma.generatedInvoice.create({
    data: {
      invoiceNum,
      date: new Date(date + "T12:00:00"),
      billToName,
      billToEmail,
      total: total || 0,
      paid: paid || 0,
      balance: balance || 0,
      html: html || "",
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}
