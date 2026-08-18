"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ParcelSheet } from "./ParcelSheet";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { useLocale } from "@/lib/locale-context";

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

/** Downtown Orlando [lat, lng] */
const defaultCenter: [number, number] = [28.5383, -81.3792];

const EMPTY_FC: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

function getTagColor(parcelTags?: string): string | null {
  try {
    if (parcelTags) {
      const tags = JSON.parse(parcelTags);
      if (Array.isArray(tags) && tags.length > 0) return tags[0].color;
    }
  } catch {
    /* */
  }
  return null;
}

export default function MapView({
  center,
  autoOpenId,
}: {
  center?: [number, number] | null;
  autoOpenId?: string | null;
}) {
  const { data: session } = useSession();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const mapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [isFetchingParcel, setIsFetchingParcel] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [parcelsHint, setParcelsHint] = useState<string | null>(null);
  const autoOpenedRef = useRef(false);

  const { t } = useLocale();

  useEffect(() => {
    if (autoOpenId && !autoOpenedRef.current) {
      autoOpenedRef.current = true;
      fetch(`/api/parcels/${encodeURIComponent(autoOpenId)}`)
        .then((r) => r.json())
        .then((data) => {
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

            if (map.current && data.geometry) {
              try {
                const geom = JSON.parse(data.geometry);
                selectedGeometryRef.current = geom;
                (map.current.getSource("selected-source") as maplibregl.GeoJSONSource)?.setData({
                  type: "FeatureCollection",
                  features: [
                    {
                      type: "Feature",
                      geometry: geom,
                      properties: {
                        fillColor: "#f48221",
                        borderColor: "#f48221",
                      },
                    },
                  ],
                });
              } catch {
                /* */
              }
            }
          }
        })
        .catch(() => {});
    }
  }, [autoOpenId]);

  const fetchMarkersRef = useRef<() => void>();
  const fetchParcelsRef = useRef<() => void>();
  const initializedRef = useRef(false);
  const centerRef = useRef<[number, number] | null | undefined>(center);
  const selectedGeometryRef = useRef<GeoJSON.Geometry | null>(null);
  const quickTagActiveRef = useRef(false);
  const parcelsAbortRef = useRef<AbortController | null>(null);
  const parcelsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    centerRef.current = center;
  }, [center]);

  const initMap = useCallback(() => {
    if (!mapContainer.current || initializedRef.current) return;
    initializedRef.current = true;

    const initialCenter = centerRef.current || defaultCenter;
    const zoom = centerRef.current ? 18 : 16;

    const m = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: [
              "https://cartodb-basemaps-a.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png",
              "https://cartodb-basemaps-b.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png",
              "https://cartodb-basemaps-c.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
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
        toast.error(
          "El mapa esta tardando. Si no ves las parcelas, intenta recargar."
        );
      }
    }, 15000);

    m.on("load", () => {
      if (mapTimeout.current) clearTimeout(mapTimeout.current);

      m.addSource("gis-parcels", {
        type: "geojson",
        data: EMPTY_FC,
        promoteId: "ll_uuid",
      });

      m.addLayer({
        id: "parcel-borders",
        type: "line",
        source: "gis-parcels",
        minzoom: 14,
        paint: {
          "line-color": "#088",
          "line-width": 1,
        },
      });

      m.addLayer({
        id: "parcel-fills",
        type: "fill",
        source: "gis-parcels",
        minzoom: 14,
        paint: {
          "fill-color": "#088",
          "fill-opacity": 0.12,
        },
      });

      m.addSource("selected-source", {
        type: "geojson",
        data: EMPTY_FC,
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
        source: "gis-parcels",
        minzoom: 14,
        paint: {
          "fill-color": "#ff8800",
          "fill-opacity": 0.4,
        },
        filter: ["==", ["get", "ll_uuid"], ""],
      });

      const loadViewportParcels = async () => {
        if (!map.current) return;
        const z = map.current.getZoom();
        if (z < 13) {
          setParcelsHint("Acerca el mapa para ver parcelas");
          (map.current.getSource("gis-parcels") as maplibregl.GeoJSONSource)?.setData(
            EMPTY_FC
          );
          return;
        }

        const bounds = map.current.getBounds();
        
        // Grid Snapping Optimization (0.01 degrees ~= 1.1km)
        const GRID_SIZE = 0.01;
        const snapMin = (val: number) => (Math.floor(val / GRID_SIZE) * GRID_SIZE).toFixed(3);
        const snapMax = (val: number) => (Math.ceil(val / GRID_SIZE) * GRID_SIZE).toFixed(3);

        const west = snapMin(bounds.getWest());
        const south = snapMin(bounds.getSouth());
        const east = snapMax(bounds.getEast());
        const north = snapMax(bounds.getNorth());

        parcelsAbortRef.current?.abort();
        const ac = new AbortController();
        parcelsAbortRef.current = ac;

        try {
          const res = await fetch(
            `/api/gis/geojson?west=${west}&south=${south}&east=${east}&north=${north}`,
            { signal: ac.signal }
          );
          if (!res.ok) {
            setParcelsHint("No se pudieron cargar parcelas GIS");
            return;
          }
          const data = await res.json();
          if (data.tooLarge) {
            setParcelsHint(
              data.message || "Acerca el mapa para ver parcelas"
            );
            (map.current?.getSource("gis-parcels") as maplibregl.GeoJSONSource)?.setData(
              EMPTY_FC
            );
            return;
          }
          setParcelsHint(null);
          const fc: GeoJSON.FeatureCollection = {
            type: "FeatureCollection",
            features: Array.isArray(data.features) ? data.features : [],
          };
          (map.current?.getSource("gis-parcels") as maplibregl.GeoJSONSource)?.setData(
            fc
          );
        } catch (err) {
          if ((err as Error)?.name === "AbortError") return;
          setParcelsHint("Error cargando parcelas del condado");
        }
      };

      const scheduleParcelLoad = () => {
        if (parcelsDebounceRef.current) clearTimeout(parcelsDebounceRef.current);
        parcelsDebounceRef.current = setTimeout(() => {
          loadViewportParcels();
        }, 350);
      };

      fetchParcelsRef.current = loadViewportParcels;

      const enrichParcelFromClick = async (
        props: Record<string, unknown>,
        geom: GeoJSON.Geometry,
        lng: number,
        lat: number
      ) => {
        // Fast-path: prefer OBJECTID-based externalId when present.
        // objectIds= query is ~30x faster than WHERE PARCEL='...' (0.3s vs 9s)
        // for any county whose catalog has extraOutFields: ["OBJECTID"].
        const objectId = props.object_id;
        const provider = String(props.provider || "");
        let llUuid = String(props.ll_uuid || "");
        if (objectId != null && provider) {
          llUuid = `${provider}:O:${objectId}`;
        }
        const basicParcel: Parcel = {
          id: llUuid || `gis-${props.parcel_id || "unknown"}`,
          address: String(props.address || props.headline || "Sin direccion"),
          ownerName: props.owner ? String(props.owner) : undefined,
          city: props.city ? String(props.city) : undefined,
          state: props.state ? String(props.state) : "FL",
          zipCode: props.zipCode ? String(props.zipCode) : undefined,
          status: "AVAILABLE",
          geometry: JSON.stringify(geom),
          metadata: JSON.stringify({
            source: "gis",
            regrid_id: llUuid,
            owner: props.owner,
            parcel_id: props.parcel_id,
            property_class: props.property_class,
            acreage: props.acreage,
            land_value: props.land_value,
            building_value: props.building_value,
            city: props.city,
            state: props.state || "FL",
            zipCode: props.zipCode,
          }),
        };

        selectedGeometryRef.current = geom;
        const selectedColor = "#f48221";
        (map.current?.getSource("selected-source") as maplibregl.GeoJSONSource)?.setData(
          {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature" as const,
                geometry: geom,
                properties: {
                  fillColor: selectedColor,
                  borderColor: selectedColor,
                },
              },
            ],
          }
        );
        setSelectedParcel(basicParcel);
        setIsFetchingParcel(true);

        try {
          // Single fetch: /api/parcels/[id] handles DB lookup with
          // GIS fallback for external ids (provider:parcelId or
          // provider:O:objectId for fast-path).
          // For features with no llUuid we use a point query instead.
          let fullParcel: Parcel | null = null;

          if (llUuid) {
            const res = await fetch(
              `/api/parcels/${encodeURIComponent(llUuid)}`
            );
            if (res.ok) {
              const data = await res.json();
              if (data?.id) {
                fullParcel = {
                  ...basicParcel,
                  ...data,
                  address:
                    data.address ||
                    basicParcel.address,
                  ownerName:
                    data.ownerName ||
                    basicParcel.ownerName,
                  geometry: basicParcel.geometry,
                  metadata: data.metadata
                    ? typeof data.metadata === "string"
                      ? data.metadata
                      : JSON.stringify(data.metadata)
                    : basicParcel.metadata,
                };
              }
            }
          }

          // Point-query fallback only if feature has no llUuid (rare)
          if (!fullParcel && !llUuid) {
            const pointRes = await fetch(
              `/api/gis/parcels?lat=${lat}&lng=${lng}`
            );
            if (pointRes.ok) {
              const list = await pointRes.json();
              if (Array.isArray(list) && list[0]) {
                fullParcel = {
                  ...list[0],
                  geometry: list[0].geometry || basicParcel.geometry,
                };
              }
            }
          }

          if (fullParcel && fullParcel.id) {
            setSelectedParcel(fullParcel);
            const updatedTagColor = getTagColor(fullParcel.parcelTags);
            const selColor =
              fullParcel.status === "LEAD"
                ? "#22C55E"
                : fullParcel.status === "CUSTOMER"
                  ? "#10b981"
                  : updatedTagColor || "#ef4444";
            if (selectedGeometryRef.current) {
              (map.current?.getSource(
                "selected-source"
              ) as maplibregl.GeoJSONSource)?.setData({
                type: "FeatureCollection",
                features: [
                  {
                    type: "Feature" as const,
                    geometry: selectedGeometryRef.current,
                    properties: {
                      fillColor: selColor,
                      borderColor: selColor,
                    },
                  },
                ],
              });
            }
            fetchMarkersRef.current?.();
          }
        } catch {
          /* keep basic parcel */
        } finally {
          setIsFetchingParcel(false);
        }
      };

      m.on("click", "parcel-fills", async (e) => {
        if (!e.features?.[0]) return;
        quickTagActiveRef.current = false;
        const props = (e.features[0].properties || {}) as Record<string, unknown>;
        const geom =
          (e.features[0] as unknown as { geometry: GeoJSON.Geometry }).geometry ||
          e.features[0].geometry;
        const { lng, lat } = e.lngLat;
        await enrichParcelFromClick(props, geom as GeoJSON.Geometry, lng, lat);
      });

      m.on("mousemove", "parcel-fills", (e) => {
        if (!e.features?.[0]) return;
        m.getCanvas().style.cursor = "pointer";
        const llUuid = e.features[0].properties?.ll_uuid;
        m.setFilter("parcel-hover", [
          "==",
          ["get", "ll_uuid"],
          llUuid || "",
        ]);
      });

      m.on("mouseleave", "parcel-fills", () => {
        m.getCanvas().style.cursor = "";
        m.setFilter("parcel-hover", ["==", ["get", "ll_uuid"], ""]);
      });

      m.on("click", (e) => {
        const features = m.queryRenderedFeatures(e.point, {
          layers: ["parcel-fills"],
        });
        if (features.length === 0) {
          setSelectedParcel(null);
          (map.current?.getSource(
            "selected-source"
          ) as maplibregl.GeoJSONSource)?.setData(EMPTY_FC);
        }
      });

      m.addSource("parcel-status-points", {
        type: "geojson",
        data: EMPTY_FC,
      });

      m.addLayer({
        id: "parcel-status-circles",
        type: "circle",
        source: "parcel-status-points",
        filter: ["!=", ["get", "hasHistory"], true],
        minzoom: 8,
        paint: {
          "circle-radius": 8,
          "circle-color": ["get", "color"],
          "circle-opacity": 0.9,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });

      m.addLayer({
        id: "parcel-status-triangles",
        type: "symbol",
        source: "parcel-status-points",
        filter: ["==", ["get", "hasHistory"], true],
        minzoom: 8,
        layout: {
          "text-field": "▲",
          "text-size": 22,
          "text-allow-overlap": true,
          "text-ignore-placement": true,
        },
        paint: {
          "text-color": ["get", "color"],
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.5,
        },
      });

      const fetchStatusMarkers = async () => {
        if (!map.current) return;
        const bounds = map.current.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        try {
          const res = await fetch(
            `/api/parcels/in-viewport?swlat=${sw.lat}&swlng=${sw.lng}&nelat=${ne.lat}&nelng=${ne.lng}`
          );
          const parcels: {
            id: string;
            status: string;
            parcelTags?: string;
            coordinates: [number, number];
            hasHistory?: boolean;
          }[] = await res.json();
          const features = parcels.map((p) => {
            let dotColor =
              p.status === "LEAD"
                ? "#22C55E"
                : p.status === "CUSTOMER"
                  ? "#10b981"
                  : "#EF4444";
            if (p.status !== "LEAD" && p.status !== "CUSTOMER" && p.parcelTags) {
              try {
                const tags = JSON.parse(p.parcelTags);
                if (Array.isArray(tags) && tags.length > 0)
                  dotColor = tags[0].color;
              } catch {
                /* */
              }
            }
            return {
              type: "Feature" as const,
              geometry: {
                type: "Point" as const,
                coordinates: p.coordinates,
              },
              properties: {
                id: p.id,
                color: dotColor,
                hasHistory: !!p.hasHistory,
              },
            };
          });
          (map.current?.getSource(
            "parcel-status-points"
          ) as maplibregl.GeoJSONSource)?.setData({
            type: "FeatureCollection",
            features,
          });
        } catch {
          /* */
        }
      };

      fetchMarkersRef.current = fetchStatusMarkers;

      m.on("moveend", () => {
        fetchStatusMarkers();
        scheduleParcelLoad();
      });
      m.on("zoomend", () => {
        fetchStatusMarkers();
        scheduleParcelLoad();
      });

      fetchStatusMarkers();
      scheduleParcelLoad();

      map.current = m;
      setMapReady(true);

      if (centerRef.current) {
        m.flyTo({
          center: [centerRef.current[1], centerRef.current[0]],
          zoom: 18,
        });
      }
    });
  }, [mapReady]);

  useEffect(() => {
    if (!center || !map.current) return;
    const doFly = () => {
      if (!center || !map.current) return;
      map.current.flyTo({ center: [center[1], center[0]], zoom: 18 });
      centerRef.current = center;
      setTimeout(() => fetchParcelsRef.current?.(), 500);
    };
    if (map.current.isStyleLoaded()) {
      doFly();
    } else {
      map.current.once("style.load", doFly);
    }
  }, [center]);

  useEffect(() => {
    initMap();
    return () => {
      if (mapTimeout.current) clearTimeout(mapTimeout.current);
      if (parcelsDebounceRef.current) clearTimeout(parcelsDebounceRef.current);
      parcelsAbortRef.current?.abort();
      if (map.current) {
        map.current.remove();
        map.current = null;
        initializedRef.current = false;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleQuickTagApplied = useCallback(() => {
    quickTagActiveRef.current = true;
    (map.current?.getSource("selected-source") as maplibregl.GeoJSONSource)?.setData(
      EMPTY_FC
    );
    selectedGeometryRef.current = null;
    fetchMarkersRef.current?.();
  }, []);

  const handleClaim = async (parcelId: string) => {
    const res = await fetch(
      `/api/parcels/${encodeURIComponent(parcelId)}/claim`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: selectedParcel?.address,
          ownerName: selectedParcel?.ownerName,
          geometry: selectedParcel?.geometry,
          metadata: selectedParcel?.metadata,
        }),
      }
    );
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
      <div ref={mapContainer} className="w-full h-full" />
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-container">
          <div className="flex flex-col items-center gap-3 text-on-surface-variant">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <div className="text-center">
              <p>{t.map.loading}</p>
              <p className="text-xs text-on-surface-variant mt-1">
                Si tarda demasiado, verifica tu conexion
              </p>
            </div>
          </div>
        </div>
      )}
      {mapReady && parcelsHint && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full bg-surface/95 border border-outline-variant/40 text-xs text-on-surface shadow-lg">
          {parcelsHint}
        </div>
      )}
      <ParcelSheet
        isFetching={isFetchingParcel}
        parcel={selectedParcel}
        onClose={() => {
          setSelectedParcel(null);
          quickTagActiveRef.current = false;
          selectedGeometryRef.current = null;
          (map.current?.getSource(
            "selected-source"
          ) as maplibregl.GeoJSONSource)?.setData(EMPTY_FC);
        }}
        onClaim={handleClaim}
        onVisitStarted={() => {
          setSelectedParcel(null);
        }}
        onParcelUpdated={(updated) => {
          setSelectedParcel(updated);
          if (quickTagActiveRef.current) return;
          try {
            const tags = updated.parcelTags
              ? JSON.parse(updated.parcelTags)
              : [];
            const tagColor = tags.length > 0 ? tags[0].color : null;
            const color = tagColor || "#f48221";
            if (map.current && selectedGeometryRef.current) {
              (map.current.getSource(
                "selected-source"
              ) as maplibregl.GeoJSONSource)?.setData({
                type: "FeatureCollection",
                features: [
                  {
                    type: "Feature" as const,
                    geometry: selectedGeometryRef.current!,
                    properties: {
                      fillColor: color,
                      borderColor: color,
                    },
                  },
                ],
              });
            }
          } catch {
            /* */
          }
        }}
        onQuickTagApplied={handleQuickTagApplied}
        userRole={session?.user?.role || ""}
        userId={session?.user?.id || ""}
      />

    </div>
  );
}
