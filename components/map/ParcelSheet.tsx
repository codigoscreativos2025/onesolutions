"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { DoorOpen, X, User } from "lucide-react";

interface Parcel {
  id: string;
  address: string;
  ownerName?: string;
  status: "AVAILABLE" | "LEAD" | "CUSTOMER";
  metadata?: string;
  setter?: { id: number; name: string };
  visits?: {
    id: number;
    stage: string;
    outcome?: string;
    setter?: { id: number; name: string };
  }[];
}

interface ParcelSheetProps {
  parcel: Parcel | null;
  onClose: () => void;
  onClaim: (parcelId: string) => void;
  onVisitStarted: () => void;
  userRole: string;
  userId: string;
}

export function ParcelSheet({
  parcel,
  onClose,
  onClaim,
  onVisitStarted,
  userRole,
  userId,
}: ParcelSheetProps) {
  const router = useRouter();
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState("");

  if (!parcel) return null;

  const metadata = parcel.metadata ? JSON.parse(parcel.metadata) : {};
  const isSetter = userRole === "SETTER" || userRole === "CLOSER";
  const isTakenByMe = parcel.setter?.id === parseInt(userId);
  const isAvailable = parcel.status === "AVAILABLE";

  const handleKnockDoor = async () => {
    if (claiming) return;
    setClaimError("");
    setClaiming(true);
    try {
      if (isAvailable) {
        await onClaim(parcel.id);
      }
      onVisitStarted();
      router.push(`/visit/${parcel.id}`);
    } catch (e) {
      setClaimError(e instanceof Error ? e.message : "Error al reclamar parcela");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-[1000] w-full sm:w-96 glass-panel border-l border-glass-border shadow-[-10px_0_40px_rgba(0,0,0,0.1)] flex flex-col max-h-screen sm:max-h-none animate-slide-in-right">
      <div className="flex justify-between items-center p-4 border-b border-glass-border">
        <div className="flex items-center gap-2">
          <StatusBadge status={parcel.status} />
          {parcel.setter && (
            <span className="text-on-surface-variant text-xs">
              • {parcel.setter.name}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <div>
          <h2 className="font-headline text-xl font-bold text-on-surface mb-2">
            {parcel.address}
          </h2>
          {parcel.ownerName && (
            <p className="text-on-surface-variant flex items-center gap-2">
              <User className="w-4 h-4" />
              {parcel.ownerName}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {metadata.roofAge && (
            <InfoCard label="Edad del techo" value={metadata.roofAge} />
          )}
          {metadata.utility && (
            <InfoCard label="Est. Luz" value={metadata.utility} />
          )}
          {metadata.solarPotential && (
            <InfoCard label="Potencial solar" value={metadata.solarPotential} />
          )}
          <InfoCard
            label="Estado"
            value={
              parcel.status === "AVAILABLE"
                ? "Disponible"
                : parcel.status === "LEAD"
                ? "Lead"
                : "Cliente"
            }
          />
        </div>

        {!isAvailable && !isTakenByMe && parcel.setter && (
          <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20">
            <p className="text-sm text-secondary font-medium">
              Esta parcela ya fue tomada por {parcel.setter.name}
            </p>
          </div>
        )}

        {parcel.status === "CUSTOMER" && (
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-sm text-primary font-medium">
              Cliente concretado
            </p>
          </div>
        )}
      </div>

      {isSetter && (isAvailable || isTakenByMe) && parcel.status !== "CUSTOMER" && (
        <div className="p-4 border-t border-glass-border space-y-2">
          {claimError && (
            <p className="text-sm text-error bg-error/10 px-3 py-2 rounded-lg">
              {claimError}
            </p>
          )}
          <Button
            onClick={handleKnockDoor}
            disabled={claiming}
            className="w-full h-14 text-lg uppercase tracking-widest"
          >
            <DoorOpen className="w-6 h-6" />
            {claiming ? "Reclamando..." : isAvailable ? "Tocar Puerta" : "Continuar Visita"}
          </Button>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    AVAILABLE: "bg-error/10 text-error",
    LEAD: "bg-secondary-container/20 text-secondary",
    CUSTOMER: "bg-primary/10 text-primary",
  };

  const labels = {
    AVAILABLE: "Disponible",
    LEAD: "Lead",
    CUSTOMER: "Cliente",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
        colors[status as keyof typeof colors]
      }`}
    >
      {labels[status as keyof typeof labels]}
    </span>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl border border-glass-border bg-white/40 dark:bg-black/20 flex flex-col gap-1">
      <span className="text-on-surface-variant text-[10px] uppercase tracking-wider">
        {label}
      </span>
      <span className="text-on-surface font-semibold text-sm">{value}</span>
    </div>
  );
}
