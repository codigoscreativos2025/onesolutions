import { auth } from "@/auth";
import { writeFile } from "fs/promises";
import { mkdir } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const rawFiles = [
      ...formData.getAll("files"),
      ...formData.getAll("file"),
    ].filter((f): f is File => f instanceof File && f.size > 0);

    if (rawFiles.length === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const uploadDir = process.env.UPLOAD_DIR || "./uploads";
    await mkdir(uploadDir, { recursive: true });

    const results = await Promise.all(
      rawFiles.map(async (file) => {
        const ext = path.extname(file.name) || ".jpg";
        const fileName = `${uuidv4()}${ext}`;
        const filePath = path.join(uploadDir, fileName);

        const bytes = await file.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));

        return {
          url: `/api/files/${fileName}`,
          name: file.name,
          type: file.type,
        };
      })
    );

    return NextResponse.json({
      success: true,
      url: results[0].url,
      name: results[0].name,
      type: results[0].type,
      urls: results.map((r) => r.url),
      files: results,
    });
  } catch (err) {
    console.error("Failed to upload file:", err);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
