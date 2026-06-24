import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { NextResponse } from "next/server";
import path from "path";

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  const { name } = await params;
  const uploadDir = process.env.UPLOAD_DIR || "./uploads";
  const filePath = path.join(uploadDir, name);

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const file = await readFile(filePath);
  const ext = path.extname(name).toLowerCase();

  const contentType: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
  };

  return new NextResponse(file, {
    headers: {
      "Content-Type": contentType[ext] || "application/octet-stream",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
