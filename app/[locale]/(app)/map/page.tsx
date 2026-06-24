"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Search, MapPin, Loader2 } from "lucide-react";

const DynamicMap = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
      Cargando mapa...
    </div>
  ),
});

interface SearchResult {
  id: string;
  address: string;
  ll_uuid?: string;
  geometry?: {
    type: string;
    coordinates: number[][][];
  };
}

export default function MapPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setSearchError("");
    setResults([]);

    try {
      const res = await fetch(
        `/api/regrid/search?query=${encodeURIComponent(query)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setSearchError(data.message || data.error || "Error en la búsqueda");
      } else {
        const features = data.results?.features || [];
        const items: SearchResult[] = features.map((feature: { properties?: { id?: string; ll_uuid?: string; address?: string }; geometry?: SearchResult["geometry"] }) => ({
          id: feature.properties?.id || feature.properties?.ll_uuid || "",
          address: feature.properties?.address || "",
          ll_uuid: feature.properties?.ll_uuid,
          geometry: feature.geometry,
        }));
        setResults(items);
      }
    } catch {
      setSearchError("No se pudo conectar con el servicio de búsqueda");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="font-headline text-2xl font-bold text-on-surface">Mapa</h1>

      <form onSubmit={handleSearch} className="relative">
        <div className="glass-panel rounded-full px-4 py-3 shadow-lg flex items-center gap-3">
          <Search className="w-5 h-5 text-primary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar dirección o parcela..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-on-surface-variant outline-none"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-4 py-2 bg-primary text-on-primary rounded-full text-sm font-semibold disabled:opacity-50"
          >
            {searching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Buscar"
            )}
          </button>
        </div>
      </form>

      {searchError && (
        <div className="p-3 rounded-xl bg-error-container text-on-error-container text-sm">
          {searchError}
        </div>
      )}

      {results.length > 0 && (
        <div className="glass-panel rounded-xl overflow-hidden">
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => {
                // Centrar mapa en el resultado si tiene geometría
                if (result.geometry) {
                  // Extraer centro aproximado del polígono
                  const geo = result.geometry;
                  if (geo.type === "Polygon" && geo.coordinates?.[0]?.[0]) {
                    const [lng, lat] = geo.coordinates[0][0];
                    setMapCenter([lat, lng]);
                  }
                }
              }}
              className="w-full text-left p-3 border-b border-outline-variant/20 last:border-0 hover:bg-surface-container-low flex items-center gap-3"
            >
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm text-on-surface">{result.address}</span>
            </button>
          ))}
        </div>
      )}

      <div className="w-full h-[60vh] rounded-2xl bg-surface-container border border-outline-variant flex items-center justify-center overflow-hidden relative">
        <DynamicMap center={mapCenter} />
      </div>
    </div>
  );
}
