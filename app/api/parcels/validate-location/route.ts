import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Función para calcular la distancia entre dos puntos (fórmula de Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { parcelId, latitude, longitude, accuracy } = await request.json();

    // Verificar si el usuario tiene la validación habilitada
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { locationValidationEnabled: true },
    });

    if (!user?.locationValidationEnabled) {
      return NextResponse.json({
        valid: true,
        message: 'Validación de ubicación deshabilitada para este usuario',
      });
    }

    // Obtener la parcela
    const parcel = await prisma.parcel.findUnique({
      where: { id: parcelId },
    });

    if (!parcel) {
      return NextResponse.json({ error: 'Parcel not found' }, { status: 404 });
    }

    // Si la parcela no tiene geometría válida (leads manuales), permitir
    if (!parcel.geometry || parcel.geometry === '{"coordinates":[0,0],"type":"Point"}') {
      return NextResponse.json({
        valid: true,
        message: 'Parcela sin coordenadas exactas (lead manual)',
      });
    }

    // Parsear la geometría de la parcela
    let parcelLat: number;
    let parcelLon: number;

    try {
      const geometry = JSON.parse(parcel.geometry);
      
      if (geometry.type === 'Point') {
        parcelLon = geometry.coordinates[0];
        parcelLat = geometry.coordinates[1];
      } else if (geometry.type === 'Polygon') {
        // Calcular el centroide del polígono
        const coords = geometry.coordinates[0];
        const sum = coords.reduce((acc: [number, number], coord: [number, number]) => {
          return [acc[0] + coord[0], acc[1] + coord[1]];
        }, [0, 0]);
        parcelLon = sum[0] / coords.length;
        parcelLat = sum[1] / coords.length;
      } else {
        return NextResponse.json({
          valid: true,
          message: 'Tipo de geometría no soportado',
        });
      }
    } catch {
      return NextResponse.json({
        valid: true,
        message: 'Error al parsear geometría de la parcela',
      });
    }

    // Calcular la distancia
    const distance = calculateDistance(latitude, longitude, parcelLat, parcelLon);
    const isValid = distance <= 50;

    // Registrar la ubicación en VisitLocation si la visita existe
    const visit = await prisma.visit.findFirst({
      where: {
        parcelId,
        setterId: parseInt(session.user.id),
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
      distance: Math.round(distance),
      message: isValid
        ? 'Ubicación válida'
        : `Estás a ${Math.round(distance)}m de la parcela. Debes estar a menos de 50m.`,
    });
  } catch (error) {
    console.error('Error validating location:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

