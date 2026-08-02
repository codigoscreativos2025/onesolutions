import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const swLat = parseFloat(searchParams.get('swlat') || '');
  const swLng = parseFloat(searchParams.get('swlng') || '');
  const neLat = parseFloat(searchParams.get('nelat') || '');
  const neLng = parseFloat(searchParams.get('nelng') || '');

  if (isNaN(swLat) || isNaN(swLng) || isNaN(neLat) || isNaN(neLng)) {
    return NextResponse.json({ error: 'Invalid bounds' }, { status: 400 });
  }

  try {
    const parcels = await prisma.parcel.findMany({
      where: { status: { not: 'AVAILABLE' } },
      select: {
        id: true,
        address: true,
        status: true,
        geometry: true,
        setter: { select: { name: true } },
      },
    });

    const results = parcels
      .map((p) => {
        try {
          const geom = JSON.parse(p.geometry);
          if (!geom?.coordinates?.[0]) return null;
          const coords = geom.coordinates[0];
          let sumLat = 0;
          let sumLng = 0;
          let count = 0;
          for (const c of coords) {
            if (c.length >= 2) {
              sumLat += c[1];
              sumLng += c[0];
              count++;
            }
          }
          if (count === 0) return null;
          const lat = sumLat / count;
          const lng = sumLng / count;
          if (lat < swLat || lat > neLat || lng < swLng || lng > neLng) return null;
          return {
            id: p.id,
            address: p.address,
            status: p.status,
            coordinates: [lng, lat],
            setterName: p.setter?.name,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching parcels in viewport:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
