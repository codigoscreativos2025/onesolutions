import { NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/auth-utils';

const globalForNotes = global as unknown as { mapNotesCache: Record<string, string> };

if (!globalForNotes.mapNotesCache) {
  globalForNotes.mapNotesCache = {};
}

export async function GET(request: Request) {
  const authRes = await verifyApiAuth();
  if (authRes.error) {
    return NextResponse.json({ error: authRes.error }, { status: authRes.status });
  }
  const { searchParams } = new URL(request.url);
  const parcelId = searchParams.get('parcelId');
  if (!parcelId) return NextResponse.json({ note: "" });

  return NextResponse.json({ note: globalForNotes.mapNotesCache[parcelId] || "" });
}

export async function POST(request: Request) {
  const authRes = await verifyApiAuth();
  if (authRes.error) {
    return NextResponse.json({ error: authRes.error }, { status: authRes.status });
  }
  try {
    const { parcelId, note } = await request.json();
    if (!parcelId) return NextResponse.json({ error: "Missing parcelId" }, { status: 400 });
    
    globalForNotes.mapNotesCache[parcelId] = note || "";
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
