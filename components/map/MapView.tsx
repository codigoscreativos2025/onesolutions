"use client";

import { useState, useCallback, useRef } from "react";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ParcelSheet } from "./ParcelSheet";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

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

function MapClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const defaultPosition: [number, number] = [28.385, -81.365];

export default function MapView({
  center,
}: {
  center?: [number, number] | null;
}) {
  const { data: session } = useSession();
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [fetchingParcel, setFetchingParcel] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchParcelAtPoint = useCallback(async (lat: number, lng: number) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setFetchingParcel(true);
      const res = await fetch(
        `/api/regrid/parcels?lat=${lat}&lng=${lng}`,
        { signal: controller.signal }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setSelectedParcel(data[0]);
      } else {
        toast.info("No se encontro parcela en este punto");
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("Error fetching parcel:", err);
    } finally {
      setFetchingParcel(false);
      abortRef.current = null;
    }
  }, []);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      fetchParcelAtPoint(lat, lng);
    },
    [fetchParcelAtPoint]
  );

  const handleClaim = async (parcelId: string) => {
    const res = await fetch(`/api/parcels/${parcelId}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: selectedParcel?.address,
        ownerName: selectedParcel?.ownerName,
        geometry: selectedParcel?.geometry,
        metadata: selectedParcel?.metadata,
      }),
    });

    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ error: "Error al reclamar parcela" }));
      throw new Error(err.error);
    }

    const claimed = await res.json();
    setSelectedParcel(claimed);
    return claimed;
  };

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
        <TileLayer
          attribution='&copy; Regrid'
          url="/api/regrid/tiles/{z}/{x}/{y}"
          maxZoom={21}
          minZoom={10}
          opacity={0.85}
        />
        <MapClickHandler onClick={handleMapClick} />
      </MapContainer>

      {fetchingParcel && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] glass-panel px-4 py-2 rounded-full text-sm text-on-surface flex items-center gap-2 shadow-lg">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Buscando parcela...
        </div>
      )}

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] glass-panel px-3 py-1.5 rounded-full text-xs text-on-surface-variant shadow-lg">
        Toca el mapa para ver info de la parcela
      </div>

      <ParcelSheet
        parcel={selectedParcel}
        onClose={() => setSelectedParcel(null)}
        onClaim={handleClaim}
        onVisitStarted={() => {
          setSelectedParcel(null);
        }}
        userRole={session?.user?.role || ""}
        userId={session?.user?.id || ""}
      />
    </div>
  );
}
