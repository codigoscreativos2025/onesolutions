import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendEmail } from "@/lib/email";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  const allowedRoles = ["SETTER", "CLOSER", "TRAINEE", "ADMIN"];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { to, subject, html, attachments, pdfBase64, pdfFilename } = body as {
      to: string;
      subject: string;
      html: string;
      attachments?: Array<{
        filename: string;
        content: string;
        contentType?: string;
      }>;
      pdfBase64?: string;
      pdfFilename?: string;
    };

    if (!to || !subject) {
      return NextResponse.json({ error: "to and subject are required" }, { status: 400 });
    }

    const emailAttachments: Array<{
      filename: string;
      content: Buffer | string;
      contentType?: string;
    }> = attachments ? attachments.map(a => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
    })) : [];

    if (pdfBase64) {
      const pdfBuffer = Buffer.from(pdfBase64, "base64");
      emailAttachments.push({
        filename: pdfFilename || "document.pdf",
        content: pdfBuffer,
        contentType: "application/pdf",
      });
    }

    await sendEmail({
      to,
      subject,
      html: html || "",
      attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
