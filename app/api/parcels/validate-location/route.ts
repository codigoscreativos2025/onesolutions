import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Función para calcular la distancia entre dos puntos usando la fórmula de Haversine
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distancia en metros
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);

  try {
    const body = await request.json();
    const { parcelId, latitude, longitude, accuracy } = body;

    if (!parcelId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'parcelId, latitude, and longitude are required' },
        { status: 400 }
      );
    }

    // Obtener la parcela
    const parcel = await prisma.parcel.findUnique({
      where: { id: parcelId },
    });

    if (!parcel) {
      return NextResponse.json({ error: 'Parcel not found' }, { status: 404 });
    }

    // Parsear la geometría de la parcela
    let parcelLat: number;
    let parcelLon: number;

    try {
      const geometry = JSON.parse(parcel.geometry);
      
      // Si es un Point, usar las coordenadas directamente
      if (geometry.type === 'Point') {
        parcelLon = geometry.coordinates[0];
        parcelLat = geometry.coordinates[1];
      }
      // Si es un Polygon, calcular el centroide
      else if (geometry.type === 'Polygon' && geometry.coordinates[0]) {
        const coords = geometry.coordinates[0];
        parcelLon = coords.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / coords.length;
        parcelLat = coords.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / coords.length;
      } else {
        return NextResponse.json(
          { error: 'Invalid parcel geometry' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid parcel geometry format' },
        { status: 400 }
      );
    }

    // Calcular la distancia
    const distance = calculateDistance(latitude, longitude, parcelLat, parcelLon);

    // Agregar el error de precisión del GPS
    const effectiveDistance = distance + (accuracy || 0);

    // Validar si está dentro de los 50 metros
    const isValid = effectiveDistance <= 50;

    // Registrar la ubicación en VisitLocation si la visita existe
    const visit = await prisma.visit.findFirst({
      where: {
        parcelId,
        setterId: userId,
        stage: 'IN_PROGRESS',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (visit && isValid) {
      await prisma.visitLocation.create({
        data: {
          visitId: visit.id,
          latitude,
          longitude,
          accuracy: accuracy || 0,
          recordedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      valid: isValid,
      distance: effectiveDistance,
      message: isValid
        ? 'Ubicación válida. Puedes continuar con la visita.'
        : `Estás demasiado lejos de la parcela (${effectiveDistance.toFixed(0)}m). Debes estar a menos de 50m.`,
    });
  } catch (error) {
    console.error('Error validating location:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
