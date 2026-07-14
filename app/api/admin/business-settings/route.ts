import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let settings = await prisma.businessSettings.findFirst();

  if (!settings) {
    settings = await prisma.businessSettings.create({
      data: {
        logoUrl: null,
        watermarkedEnabled: true,
      },
    });
  }

  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("logo") as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No logo file provided" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "png";
    const filename = `logo-${Date.now()}.${ext}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads");

    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, filename), buffer);

    const logoUrl = `/uploads/${filename}`;

    let settings = await prisma.businessSettings.findFirst();
    if (!settings) {
      settings = await prisma.businessSettings.create({
        data: { logoUrl, logoUpdatedAt: new Date() },
      });
    } else {
      settings = await prisma.businessSettings.update({
        where: { id: settings.id },
        data: { logoUrl, logoUpdatedAt: new Date() },
      });
    }

    return NextResponse.json(settings);
  }

  const body = await request.json();
  const { logoUrl, watermarkedEnabled } = body;

  let settings = await prisma.businessSettings.findFirst();
  if (!settings) {
    settings = await prisma.businessSettings.create({
      data: {
        logoUrl: logoUrl ?? null,
        watermarkedEnabled:
          watermarkedEnabled !== undefined ? watermarkedEnabled : true,
      },
    });
  } else {
    settings = await prisma.businessSettings.update({
      where: { id: settings.id },
      data: {
        ...(logoUrl !== undefined && { logoUrl }),
        ...(watermarkedEnabled !== undefined && { watermarkedEnabled }),
      },
    });
  }

  return NextResponse.json(settings);
}
