"use client";

import dynamic from "next/dynamic";

const DynamicMap = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
      Cargando mapa...
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-headline text-2xl font-bold text-on-surface">Mapa</h1>
      <div className="w-full h-[70vh] rounded-2xl bg-surface-container border border-outline-variant overflow-hidden relative">
        <DynamicMap />
      </div>
    </div>
  );
}
