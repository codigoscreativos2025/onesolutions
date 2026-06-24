import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const token = process.env.REGRID_API_KEY;

  if (!token) {
    return NextResponse.json(
      {
        error: "Regrid API key not configured",
        message:
          "Configura REGRID_API_KEY en las variables de entorno para usar búsqueda real.",
      },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(
      `https://app.regrid.com/api/v1/search?query=${encodeURIComponent(
        query
      )}&limit=10&token=${token}`
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch from Regrid" },
      { status: 500 }
    );
  }
}
