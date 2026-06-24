import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const token = process.env.REGRID_API_KEY;

  if (!token) {
    return NextResponse.json(
      { error: "Regrid API key not configured" },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(
      `https://app.regrid.com/api/v1/parcels/${id}?token=${token}`
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
