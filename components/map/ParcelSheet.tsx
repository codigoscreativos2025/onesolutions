"use client";

import { useParams, useRouter } from "next/navigation";
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
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  if (!parcel) return null;

  const metadata = parcel.metadata ? JSON.parse(parcel.metadata) : {};
  const isSetter = userRole === "SETTER" || userRole === "CLOSER";
  const isTakenByMe = parcel.setter?.id === parseInt(userId);
  const isAvailable = parcel.status === "AVAILABLE";

  const handleKnockDoor = async () => {
    if (isAvailable) {
      await onClaim(parcel.id);
    }
    onVisitStarted();
    router.push(`/${locale}/visit/${parcel.id}`);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] glass-panel border-t border-glass-border rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col max-h-[70vh] animate-slide-up">
      <div
        className="w-12 h-1 bg-outline-variant rounded-full mx-auto my-3 cursor-pointer"
        onClick={onClose}
      />
      <div className="px-5 pb-24 overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={parcel.status} />
              {parcel.setter && (
                <span className="text-on-surface-variant text-xs">
                  • {parcel.setter.name}
                </span>
              )}
            </div>
            <h2 className="font-headline text-xl font-bold text-on-surface">
              {parcel.address}
            </h2>
            {parcel.ownerName && (
              <p className="text-on-surface-variant flex items-center gap-1 mt-1">
                <User className="w-4 h-4" />
                {parcel.ownerName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
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
          <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20 mb-4">
            <p className="text-sm text-secondary font-medium">
              Esta parcela ya fue tomada por {parcel.setter.name}
            </p>
          </div>
        )}

        {isSetter && (isAvailable || isTakenByMe) && parcel.status !== "CUSTOMER" && (
          <Button
            onClick={handleKnockDoor}
            className="w-full h-14 text-lg uppercase tracking-widest"
          >
            <DoorOpen className="w-6 h-6" />
            {isAvailable ? "Tocar Puerta" : "Continuar Visita"}
          </Button>
        )}

        {parcel.status === "CUSTOMER" && (
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-sm text-primary font-medium">
              Cliente concretado
            </p>
          </div>
        )}
      </div>
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
