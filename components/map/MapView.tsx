"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Polygon, useMap, useMapEvents } from "react-leaflet";
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

interface MapBounds {
  lat1: number;
  lng1: number;
  lat2: number;
  lng2: number;
}

function MapController({
  onMoveEnd,
  onReady,
  onClick,
}: {
  onMoveEnd: (bounds: MapBounds, zoom: number) => void;
  onReady: (bounds: MapBounds, zoom: number) => void;
  onClick: () => void;
}) {
  const map = useMap();
  const hasFired = useRef(false);

  useEffect(() => {
    if (!hasFired.current) {
      hasFired.current = true;
      const bounds = map.getBounds();
      onReady(
        { lat1: bounds.getSouth(), lng1: bounds.getWest(), lat2: bounds.getNorth(), lng2: bounds.getEast() },
        map.getZoom()
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      onMoveEnd(
        { lat1: bounds.getSouth(), lng1: bounds.getWest(), lat2: bounds.getNorth(), lng2: bounds.getEast() },
        map.getZoom()
      );
    },
    click: () => {
      onClick();
    },
  });

  return null;
}

function getParcelColor(status: string) {
  switch (status) {
    case "AVAILABLE": return "#ba1a1a";
    case "LEAD": return "#fb7800";
    case "CUSTOMER": return "#006e00";
    default: return "#6e7b68";
  }
}

const MIN_FETCH_ZOOM = 14;
const defaultPosition: [number, number] = [28.385, -81.365];

export default function MapView({ center }: { center?: [number, number] | null }) {
  const { data: session } = useSession();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [fetching, setFetching] = useState(false);
  const fetchedIds = useRef<Set<string>>(new Set());
  const lastFetchTime = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const mapCenterRef = useRef<[number, number]>(defaultPosition);

  const fetchParcels = useCallback(async (bounds: MapBounds, zoom: number) => {
    if (zoom < MIN_FETCH_ZOOM) return;

    const now = Date.now();
    if (now - lastFetchTime.current < 1500) return; // debounce
    lastFetchTime.current = now;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setFetching(true);
      const params = new URLSearchParams({
        lat1: bounds.lat1.toFixed(6),
        lng1: bounds.lng1.toFixed(6),
        lat2: bounds.lat2.toFixed(6),
        lng2: bounds.lng2.toFixed(6),
      });
      const res = await fetch(`/api/regrid/parcels?${params}`, { signal: controller.signal });
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return;

      const newParcels = data as Parcel[];
      setParcels((prev) => {
        const uniqueNew = newParcels.filter((p) => p.id && !fetchedIds.current.has(p.id));
        uniqueNew.forEach((p) => fetchedIds.current.add(p.id));
        return [...prev, ...uniqueNew];
      });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("Error fetching parcels:", err);
    } finally {
      setFetching(false);
      abortRef.current = null;
    }
  }, []);

  const handleMoveEnd = useCallback(
    (bounds: MapBounds, zoom: number) => {
      fetchParcels(bounds, zoom);
    },
    [fetchParcels]
  );

  const handleReady = useCallback(
    (bounds: MapBounds, zoom: number) => {
      if (center) mapCenterRef.current = center;
      fetchParcels(bounds, zoom);
    },
    [center, fetchParcels]
  );

  const handleParcelClick = useCallback((parcel: Parcel) => {
    setSelectedParcel(parcel);
  }, []);

  const handleMapClick = useCallback(() => {
    setSelectedParcel(null);
  }, []);

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
      const err = await res.json().catch(() => ({ error: "Error al reclamar parcela" }));
      throw new Error(err.error);
    }
    const claimed = await res.json();
    setParcels((prev) =>
      prev.map((p) => (p.id === parcelId ? { ...p, status: "LEAD" as const } : p))
    );
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
        <MapController onReady={handleReady} onMoveEnd={handleMoveEnd} onClick={handleMapClick} />
        {parcels.map((parcel) => {
          try {
            if (!parcel.geometry) return null;
            const geo = JSON.parse(parcel.geometry);
            if (!geo.coordinates?.[0] || geo.coordinates[0].length < 3) return null;
            const coords = geo.coordinates[0].map(
              (c: [number, number]) => [c[1], c[0]] as [number, number]
            );
            const isSelected = selectedParcel?.id === parcel.id;
            return (
              <Polygon
                key={parcel.id}
                positions={coords}
                pathOptions={{
                  color: isSelected ? "#ffffff" : getParcelColor(parcel.status),
                  fillColor: getParcelColor(parcel.status),
                  fillOpacity: isSelected ? 0.7 : 0.35,
                  weight: isSelected ? 4 : 2,
                }}
                eventHandlers={{
                  click: (e) => {
                    e.originalEvent.stopPropagation();
                    handleParcelClick(parcel);
                  },
                  mouseover: (e) => {
                    e.target.setStyle({ weight: 4, fillOpacity: 0.6 });
                    document.body.style.cursor = "pointer";
                  },
                  mouseout: (e) => {
                    const sel = selectedParcel?.id === parcel.id;
                    e.target.setStyle({
                      weight: sel ? 4 : 2,
                      fillOpacity: sel ? 0.7 : 0.35,
                    });
                    if (!isSelected) document.body.style.cursor = "default";
                  },
                }}
              />
            );
          } catch {
            return null;
          }
        })}
      </MapContainer>

      {fetching && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] glass-panel px-4 py-2 rounded-full text-sm text-on-surface flex items-center gap-2 shadow-lg">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Cargando parcelas...
        </div>
      )}

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] glass-panel px-3 py-1.5 rounded-full text-xs text-on-surface-variant shadow-lg">
        Acerca el mapa para ver parcelas (zoom 14+)
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
