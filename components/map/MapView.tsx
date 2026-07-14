"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  useMap,
  useMapEvents,
} from "react-leaflet";
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

interface MapBounds {
  lat1: number;
  lng1: number;
  lat2: number;
  lng2: number;
}

function MapEventHandler({
  onReady,
  onMoveEnd,
}: {
  onReady: (map: L.Map) => void;
  onMoveEnd: () => void;
}) {
  const map = useMap();
  const hasFiredReady = useRef(false);

  useEffect(() => {
    if (!hasFiredReady.current) {
      hasFiredReady.current = true;
      onReady(map);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useMapEvents({
    moveend: () => {
      // don't trigger during the ready->moveend cascade
      if (hasFiredReady.current) {
        onMoveEnd();
      }
    },
  });

  return null;
}

function getBoundsFromMap(map: L.Map): MapBounds {
  const bounds = map.getBounds();
  return {
    lat1: bounds.getSouth(),
    lng1: bounds.getWest(),
    lat2: bounds.getNorth(),
    lng2: bounds.getEast(),
  };
}

function boundsEqual(a: MapBounds, b: MapBounds, tolerance = 0.0001): boolean {
  return (
    Math.abs(a.lat1 - b.lat1) < tolerance &&
    Math.abs(a.lng1 - b.lng1) < tolerance &&
    Math.abs(a.lat2 - b.lat2) < tolerance &&
    Math.abs(a.lng2 - b.lng2) < tolerance
  );
}

export default function MapView({
  center,
}: {
  center?: [number, number] | null;
}) {
  const { data: session } = useSession();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [fetching, setFetching] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const mapBoundsRef = useRef<MapBounds | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const fetchingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchParcelsByBounds = useCallback(async (bounds: MapBounds) => {
    if (fetchingRef.current) {
      abortRef.current?.abort();
    }
    fetchingRef.current = true;
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
      const res = await fetch(`/api/regrid/parcels?${params}`, {
        signal: controller.signal,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 503 || res.status === 502) {
          toast.error(errData.error || "Error al conectar con Regrid");
        }
        throw new Error(errData.error || "Failed to fetch parcels");
      }
      const data = await res.json();
      setParcels(data || []);
      if (!hasFetched) setHasFetched(true);
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Error fetching parcels:", error);
      setParcels([]);
      if (!hasFetched) setHasFetched(true);
    } finally {
      setFetching(false);
      fetchingRef.current = false;
      abortRef.current = null;
    }
  }, [hasFetched]);

  const handleMapReady = useCallback(
    (map: L.Map) => {
      mapInstanceRef.current = map;
      const bounds = getBoundsFromMap(map);
      mapBoundsRef.current = bounds;
      fetchParcelsByBounds(bounds);
    },
    [fetchParcelsByBounds]
  );

  const handleMoveEnd = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const bounds = getBoundsFromMap(map);
    if (mapBoundsRef.current && boundsEqual(mapBoundsRef.current, bounds)) {
      return;
    }
    mapBoundsRef.current = bounds;
    fetchParcelsByBounds(bounds);
  }, [fetchParcelsByBounds]);

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

    if (mapBoundsRef.current) {
      await fetchParcelsByBounds(mapBoundsRef.current);
    }

    setSelectedParcel(claimed);
    return claimed;
  };

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
        <MapEventHandler onReady={handleMapReady} onMoveEnd={handleMoveEnd} />
        {parcels.map((parcel) => {
          try {
            if (!parcel.geometry) return null;

            const geometry = JSON.parse(parcel.geometry);

            if (
              !geometry.coordinates ||
              !geometry.coordinates[0] ||
              geometry.coordinates[0].length < 3
            ) {
              return null;
            }

            const coordinates = geometry.coordinates[0].map(
              (coord: [number, number]) =>
                [coord[1], coord[0]] as [number, number]
            );

            const hasValidCoords = coordinates.every(
              (coord: [number, number]) =>
                typeof coord[0] === "number" &&
                typeof coord[1] === "number" &&
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
                      fillOpacity:
                        parcel.status === "AVAILABLE" ? 0.35 : 0.55,
                    });
                    document.body.style.cursor = "default";
                  },
                }}
              />
            );
          } catch (error) {
            console.error("Error rendering parcel:", parcel.id, error);
            return null;
          }
        })}
      </MapContainer>

      {fetching && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] glass-panel px-4 py-2 rounded-full text-sm text-on-surface flex items-center gap-2 shadow-lg">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Cargando datos de Regrid...
        </div>
      )}

      {!fetching && hasFetched && parcels.length === 0 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[1000] glass-panel px-4 py-2 rounded-full text-xs text-on-surface-variant shadow-lg">
          Sin parcelas en esta vista. Mueve el mapa o busca una direccion.
        </div>
      )}

      <ParcelSheet
        parcel={selectedParcel}
        onClose={() => setSelectedParcel(null)}
        onClaim={handleClaim}
        onVisitStarted={() => {
          if (mapBoundsRef.current) {
            fetchParcelsByBounds(mapBoundsRef.current);
          }
          setSelectedParcel(null);
        }}
        userRole={session?.user?.role || ""}
        userId={session?.user?.id || ""}
      />
    </div>
  );
}
