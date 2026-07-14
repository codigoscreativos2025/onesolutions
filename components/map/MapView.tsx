"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
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

const defaultCenter: [number, number] = [32.7767, -96.7970]; // Dallas, TX (trial county)

export default function MapView({ center }: { center?: [number, number] | null }) {
  const { data: session } = useSession();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const initMap = useCallback(() => {
    if (!mapContainer.current || map.current) return;

    const initialCenter = center || defaultCenter;
    const zoom = center ? 18 : 15;

    const m = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm-layer",
            type: "raster",
            source: "osm",
          },
        ],
      },
      center: [initialCenter[1], initialCenter[0]],
      zoom,
    });

    m.on("load", () => {
      // Add the Regrid parcel vector tile source using our proxy
      m.addSource("regrid-parcels", {
        type: "vector",
        tiles: ["/api/regrid/tiles/{z}/{x}/{y}"],
        minzoom: 10,
        maxzoom: 22,
      });

      // Parcel borders
          m.addLayer({
            id: "parcel-borders",
            type: "line",
            source: "regrid-parcels",
            "source-layer": "parcels",
            paint: {
              "line-color": "#088",
              "line-width": 1,
            },
          });

          // Parcel fill
          m.addLayer({
            id: "parcel-fills",
            type: "fill",
            source: "regrid-parcels",
            "source-layer": "parcels",
            paint: {
              "fill-color": "#088",
              "fill-opacity": 0.1,
            },
          });

          // Hover highlight
          m.addLayer({
            id: "parcel-hover",
            type: "fill",
            source: "regrid-parcels",
            "source-layer": "parcels",
            paint: {
              "fill-color": "#ff8800",
              "fill-opacity": 0.4,
            },
            filter: ["==", "ll_uuid", ""],
          });

      // Click on parcel
      m.on("click", "parcel-fills", (e) => {
        if (!e.features?.[0]) return;
        const props = e.features[0].properties;
        const parcel: Parcel = {
          id: props.ll_uuid || `regrid-${props.fid}`,
          address: props.address || props.headline || "Sin direccion",
          ownerName: props.owner,
          status: "AVAILABLE",
          geometry: JSON.stringify(e.features[0].geometry),
          metadata: JSON.stringify({
            regrid_id: props.ll_uuid,
            path: props.path,
            parcelnumb: props.parcelnumb,
          }),
        };
        setSelectedParcel(parcel);
      });

      // Hover effect
      m.on("mousemove", "parcel-fills", (e) => {
        if (!e.features?.[0]) return;
        m.getCanvas().style.cursor = "pointer";
        const llUuid = e.features[0].properties.ll_uuid;
        m.setFilter("parcel-hover", ["==", "ll_uuid", llUuid || ""]);
      });

      m.on("mouseleave", "parcel-fills", () => {
        m.getCanvas().style.cursor = "";
        m.setFilter("parcel-hover", ["==", "ll_uuid", ""]);
      });

      // Click outside → deselect
      m.on("click", (e) => {
        const features = m.queryRenderedFeatures(e.point, { layers: ["parcel-fills"] });
        if (features.length === 0) {
          setSelectedParcel(null);
        }
      });

      map.current = m;
      setMapReady(true);
    });
  }, [center]);

  useEffect(() => {
    initMap();
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [initMap]);

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
    setSelectedParcel(claimed);
    return claimed;
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-container">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Cargando mapa...
          </div>
        </div>
      )}
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
