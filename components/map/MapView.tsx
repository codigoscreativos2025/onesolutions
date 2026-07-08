"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ParcelSheet } from "./ParcelSheet";
import { useSession } from "next-auth/react";

interface Parcel {
  id: string;
  address: string;
  ownerName?: string;
  status: "AVAILABLE" | "LEAD" | "CUSTOMER";
  geometry: string;
  metadata?: string;
  setter?: { id: number; name: string };
  visits?: {
    id: number;
    stage: string;
    outcome?: string;
    setter?: { id: number; name: string };
  }[];
}

export default function MapView({
  center,
}: {
  center?: [number, number] | null;
}) {
  const { data: session } = useSession();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchParcels = async () => {
    try {
      const res = await fetch("/api/parcels");
      if (!res.ok) {
        throw new Error('Failed to fetch parcels');
      }
      const data = await res.json();
      setParcels(data || []);
    } catch (error) {
      console.error('Error fetching parcels:', error);
      setParcels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParcels();
  }, []);

  const getParcelColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "#ba1a1a";
      case "LEAD":
        return "#fb7800";
      case "CUSTOMER":
        return "#006e00";
      default:
        return "#6e7b68";
    }
  };

  const handleClaim = async (parcelId: string) => {
    const res = await fetch(`/api/parcels/${parcelId}/claim`, {
      method: "POST",
    });

    if (res.ok) {
      fetchParcels();
      const updated = await fetch(`/api/parcels/${parcelId}`);
      const data = await updated.json();
      setSelectedParcel(data);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
        Cargando parcelas...
      </div>
    );
  }

  const defaultPosition: [number, number] = [28.385, -81.365];

  return (
    <div className="relative w-full h-full">
      <MapContainer
        key={center ? `${center[0]}-${center[1]}` : "default"}
        center={center || defaultPosition}
        zoom={center ? 18 : 16}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
        />
        {parcels.map((parcel) => {
          try {
            if (!parcel.geometry) return null;
            
            const geometry = JSON.parse(parcel.geometry);
            
            // Validar que la geometría tenga coordenadas válidas
            if (!geometry.coordinates || !geometry.coordinates[0] || geometry.coordinates[0].length < 3) {
              return null;
            }

            const coordinates = geometry.coordinates[0].map(
              (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
            );

            // Validar que todas las coordenadas sean números válidos
            const hasValidCoords = coordinates.every(
              (coord: [number, number]) => 
                typeof coord[0] === 'number' && 
                typeof coord[1] === 'number' &&
                !isNaN(coord[0]) && 
                !isNaN(coord[1])
            );

            if (!hasValidCoords) return null;

            return (
              <Polygon
                key={parcel.id}
                positions={coordinates}
                pathOptions={{
                  color: getParcelColor(parcel.status),
                  fillColor: getParcelColor(parcel.status),
                  fillOpacity: parcel.status === "AVAILABLE" ? 0.35 : 0.55,
                  weight: 4,
                }}
                eventHandlers={{
                  click: (e) => {
                    e.originalEvent.stopPropagation();
                    e.originalEvent.preventDefault();
                    setSelectedParcel(parcel);
                  },
                  mouseover: (e) => {
                    e.target.setStyle({ weight: 6, fillOpacity: 0.7 });
                    document.body.style.cursor = "pointer";
                  },
                  mouseout: (e) => {
                    e.target.setStyle({
                      weight: 4,
                      fillOpacity: parcel.status === "AVAILABLE" ? 0.35 : 0.55,
                    });
                    document.body.style.cursor = "default";
                  },
                }}
              />
            );
          } catch (error) {
            console.error('Error rendering parcel:', parcel.id, error);
            return null;
          }
        })}
      </MapContainer>

      <ParcelSheet
        parcel={selectedParcel}
        onClose={() => setSelectedParcel(null)}
        onClaim={handleClaim}
        onVisitStarted={() => {
          fetchParcels();
          setSelectedParcel(null);
        }}
        userRole={session?.user?.role || ""}
        userId={session?.user?.id || ""}
      />
    </div>
  );
}
