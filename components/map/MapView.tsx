"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polygon, useMapEvent } from "react-leaflet";
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

function MapClickHandler({ onClick }: { onClick: () => void }) {
  useMapEvent("click", onClick);
  return null;
}

export default function MapView() {
  const { data: session } = useSession();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchParcels = async () => {
    try {
      const res = await fetch("/api/parcels");
      const data = await res.json();
      setParcels(data);
    } catch (error) {
      console.error(error);
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

  const position: [number, number] = [28.385, -81.365];

  return (
    <>
      <MapContainer
        center={position}
        zoom={16}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
        />
        <MapClickHandler onClick={() => setSelectedParcel(null)} />
        {parcels.map((parcel) => {
          let geometry;
          try {
            geometry = JSON.parse(parcel.geometry);
          } catch {
            return null;
          }

          const coordinates = geometry.coordinates?.[0]?.map(
            ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
          );

          if (!coordinates) return null;

          return (
            <Polygon
              key={parcel.id}
              positions={coordinates}
              pathOptions={{
                color: getParcelColor(parcel.status),
                fillColor: getParcelColor(parcel.status),
                fillOpacity: parcel.status === "AVAILABLE" ? 0.25 : 0.45,
                weight: 2,
              }}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent.stopPropagation();
                  setSelectedParcel(parcel);
                },
              }}
            />
          );
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
    </>
  );
}
