import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const invoices = await prisma.generatedInvoice.findMany();
    let fixedCount = 0;

    for (const inv of invoices) {
      if (!inv.html) continue;

      let html = inv.html;
      const originalHtml = html;

      html = html.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1");
      html = html.replace(/<s\b[^>]*>([\s\S]*?)<\/s>/gi, "$1");
      html = html.replace(/<strike\b[^>]*>([\s\S]*?)<\/strike>/gi, "$1");
      html = html.replace(/<del\b[^>]*>([\s\S]*?)<\/del>/gi, "$1");
      html = html.replace(/<u\b[^>]*>([\s\S]*?)<\/u>/gi, "$1");
      html = html.replace(/text-decoration:\s*line-through/gi, "text-decoration: none");
      html = html.replace(/text-decoration-line:\s*line-through/gi, "text-decoration-line: none");

      if (html !== originalHtml) {
        await prisma.generatedInvoice.update({
          where: { id: inv.id },
          data: { html },
        });
        fixedCount++;
      }
    }

    return NextResponse.json({ success: true, message: `Fixed ${fixedCount} invoices in the database.` });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
