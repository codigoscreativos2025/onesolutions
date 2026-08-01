"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ParcelSheet } from "./ParcelSheet";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface Parcel {
  id: string;
  address: string;
  ownerName?: string;
  status: "AVAILABLE" | "LEAD" | "CUSTOMER";
  geometry?: string;
  metadata?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  ownerOccupied?: boolean;
  parcelTags?: string;
  parcelNotes?: string;
  setter?: { id: number; name: string };
  visits?: {
    id: number;
    stage: string;
    outcome?: string;
    setter?: { id: number; name: string };
  }[];
}

const defaultCenter: [number, number] = [32.7767, -96.7970];

export default function MapView({ center, autoOpenId }: { center?: [number, number] | null; autoOpenId?: string | null }) {
  const { data: session } = useSession();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const mapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const autoOpenedRef = useRef(false);

  // Auto-open parcel sheet when coming from lead details
  useEffect(() => {
    if (autoOpenId && !autoOpenedRef.current) {
      autoOpenedRef.current = true;
      // Fetch the specific parcel from our DB
      fetch(`/api/parcels/${autoOpenId}`)
        .then(r => r.json())
        .then(data => {
          if (data && data.id) {
            const parcel: Parcel = {
              id: data.id,
              address: data.address || "Sin direccion",
              ownerName: data.ownerName,
              status: data.status || "AVAILABLE",
              geometry: data.geometry || "",
              metadata: data.metadata || "",
              setter: data.setter,
              visits: data.visits || [],
            };
            setSelectedParcel(parcel);

            // Highlight on the map
            if (map.current && data.geometry) {
              try {
                const geom = JSON.parse(data.geometry);
                if (geom.coordinates?.[0]) {
                  const coords = geom.coordinates[0].map((c: [number, number]) => [c[1], c[0]]);
                  const source = map.current.getSource("highlighted-parcel") as maplibregl.GeoJSONSource;
                  if (source) {
                    source.setData({
                      type: "Feature",
                      properties: { ll_uuid: data.id },
                      geometry: { type: "Polygon", coordinates: [coords.map(([lng, lat]: [number, number]) => [lng, lat])] },
                    });
                  }
                  // Pulse effect
                  map.current.setPaintProperty("parcel-highlight", "fill-color", "#f48221");
                  map.current.setPaintProperty("parcel-highlight", "fill-opacity", 0.6);
                  setTimeout(() => {
                    map.current?.setPaintProperty("parcel-highlight", "fill-opacity", 0.3);
                  }, 3000);
                }
              } catch {}
            }
          }
        })
        .catch(() => {});
    }
  }, [autoOpenId]);
  const initializedRef = useRef(false);
  const centerRef = useRef(center);
  const selectedGeometryRef = useRef<GeoJSON.Geometry | null>(null);

  const initMap = useCallback(() => {
    if (!mapContainer.current || initializedRef.current) return;
    initializedRef.current = true;

    const initialCenter = center || defaultCenter;
    centerRef.current = center;
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

    mapTimeout.current = setTimeout(() => {
      if (!mapReady) {
        setMapReady(true);
        toast.error("El mapa esta tardando. Si no ves las parcelas, intenta recargar.");
      }
    }, 15000);

    m.on("load", () => {
      if (mapTimeout.current) clearTimeout(mapTimeout.current);
      m.addSource("regrid-parcels", {
        type: "vector",
        tiles: [`${window.location.origin}/api/regrid/tiles/{z}/{x}/{y}`],
        minzoom: 10,
        maxzoom: 22,
      });

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

      m.addSource("selected-source", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      m.addLayer({
        id: "parcel-selected",
        type: "fill",
        source: "selected-source",
        paint: {
          "fill-color": ["get", "fillColor"],
          "fill-opacity": 0.5,
        },
      });

      m.addLayer({
        id: "parcel-selected-border",
        type: "line",
        source: "selected-source",
        paint: {
          "line-color": ["get", "borderColor"],
          "line-width": 3,
        },
      });

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

      m.on("click", "parcel-fills", async (e) => {
        if (!e.features?.[0]) return;
        const props = e.features[0].properties;
        const llUuid = props.ll_uuid || "";
        const { lng, lat } = e.lngLat;

        const getTagColor = (parcelTags?: string): string | null => {
          try {
            if (parcelTags) {
              const tags = JSON.parse(parcelTags);
              if (Array.isArray(tags) && tags.length > 0) return tags[0].color;
            }
          } catch { /* */ }
          return null;
        };

        const basicParcel: Parcel = {
          id: props.ll_uuid || `regrid-${props.fid}`,
          address: props.address || props.headline || "Sin direccion",
          ownerName: props.owner,
          status: "AVAILABLE",
          geometry: JSON.stringify(e.features[0].geometry),
          metadata: JSON.stringify({
            regrid_id: props.ll_uuid,
            path: props.path,
            owner: props.owner,
            parcelnumb: props.parcelnumb,
          }),
        };
        setSelectedParcel(basicParcel);

        const geom = (e.features[0] as unknown as { geometry: GeoJSON.Geometry }).geometry || e.features[0].geometry;
        selectedGeometryRef.current = geom;
        const tagColor = getTagColor(basicParcel.parcelTags);
        const selectedColor = tagColor || "#f48221";
        (map.current?.getSource("selected-source") as maplibregl.GeoJSONSource)?.setData({
          type: "FeatureCollection",
          features: [{
            type: "Feature" as const,
            geometry: geom,
            properties: {
              fillColor: selectedColor,
              borderColor: selectedColor,
            },
          }],
        });

        try {
          const res = await fetch(`/api/regrid/parcels?lat=${lat}&lng=${lng}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              const fullParcel = data[0];
              const fullMeta = fullParcel.metadata ? JSON.parse(fullParcel.metadata) : {};
              const updatedParcel: Parcel = {
                ...fullParcel,
                id: props.ll_uuid || fullParcel.id,
                address: fullParcel.address || basicParcel.address,
                ownerName: fullParcel.ownerName || basicParcel.ownerName,
                city: fullParcel.city || fullMeta.city,
                state: fullParcel.state || fullMeta.state,
                zipCode: fullParcel.zipCode || fullMeta.zipCode,
                ownerOccupied: fullParcel.ownerOccupied ?? fullMeta.ownerOccupied,
                parcelTags: fullParcel.parcelTags || null,
                parcelNotes: fullParcel.parcelNotes || null,
                geometry: basicParcel.geometry,
                metadata: JSON.stringify({
                  ...fullMeta,
                  regrid_id: props.ll_uuid,
                  path: props.path,
                }),
              };
              setSelectedParcel(updatedParcel);

              const updatedTagColor = getTagColor(fullParcel.parcelTags);
              const selColor = updatedTagColor || (fullParcel.status === "LEAD" ? "#f59e0b" : fullParcel.status === "CUSTOMER" ? "#10b981" : "#ef4444");
              selectedGeometryRef.current = geom;
              (map.current?.getSource("selected-source") as maplibregl.GeoJSONSource)?.setData({
                type: "FeatureCollection",
                features: [{
                  type: "Feature" as const,
                  geometry: (e.features[0] as unknown as { geometry: GeoJSON.Geometry }).geometry || e.features[0].geometry,
                  properties: {
                    fillColor: selColor,
                    borderColor: selColor,
                  },
                }],
              });
            }
          }
        } catch { /* keep basic data */ }
      });

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

      m.on("click", (e) => {
        const features = m.queryRenderedFeatures(e.point, { layers: ["parcel-fills"] });
        if (features.length === 0) {
          setSelectedParcel(null);
          (map.current?.getSource("selected-source") as maplibregl.GeoJSONSource)?.setData({
            type: "FeatureCollection",
            features: [],
          });
        }
      });

      map.current = m;
      setMapReady(true);
    });
  }, [center, mapReady]);

  useEffect(() => {
    if (center && centerRef.current && center[0] === centerRef.current[0] && center[1] === centerRef.current[1]) {
      return;
    }
    if (center && map.current) {
      map.current.flyTo({ center: [center[1], center[0]], zoom: 18 });
      centerRef.current = center;
    }
  }, [center]);

  useEffect(() => {
    initMap();
    return () => {
      if (mapTimeout.current) clearTimeout(mapTimeout.current);
      if (map.current) {
        map.current.remove();
        map.current = null;
        initializedRef.current = false;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
          <div className="flex flex-col items-center gap-3 text-on-surface-variant">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <div className="text-center">
              <p>Cargando mapa...</p>
              <p className="text-xs text-on-surface-variant mt-1">Si tarda demasiado, verifica tu conexion</p>
            </div>
          </div>
        </div>
      )}
      <ParcelSheet
        parcel={selectedParcel}
        onClose={() => {
          setSelectedParcel(null);
          selectedGeometryRef.current = null;
          (map.current?.getSource("selected-source") as maplibregl.GeoJSONSource)?.setData({
            type: "FeatureCollection",
            features: [],
          });
        }}
        onClaim={handleClaim}
        onVisitStarted={() => {
          setSelectedParcel(null);
        }}
        onParcelUpdated={(updated) => {
          setSelectedParcel(updated);
          try {
            const tags = updated.parcelTags ? JSON.parse(updated.parcelTags) : [];
            const tagColor = tags.length > 0 ? tags[0].color : null;
            const color = tagColor || "#f48221";
            if (map.current && selectedGeometryRef.current) {
              (map.current.getSource("selected-source") as maplibregl.GeoJSONSource)?.setData({
                type: "FeatureCollection",
                features: [{
                  type: "Feature" as const,
                  geometry: selectedGeometryRef.current!,
                  properties: {
                    fillColor: color,
                    borderColor: color,
                  },
                }],
              });
            }
          } catch { /* */ }
        }}
        userRole={session?.user?.role || ""}
        userId={session?.user?.id || ""}
      />
    </div>
  );
}
