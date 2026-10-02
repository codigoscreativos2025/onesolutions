import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const inv = await prisma.generatedInvoice.findFirst({ where: { invoiceNum: "INV0026" } });
    if (!inv) return NextResponse.json({ error: "Not found" });
    return NextResponse.json({ html: inv.html });
  } catch(e) {
    return NextResponse.json({ error: String(e) });
  }
}
