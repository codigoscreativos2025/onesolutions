"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { CreateLeadModal } from "@/components/leads/CreateLeadModal";
import { DoorOpen, X, User, Tag, Plus, Pencil, Trash2, DoorClosed, ThumbsDown, Clock, UserX, Home } from "lucide-react";
import { toast } from "sonner";

interface TagObject {
  name: string;
  color: string;
  date: string;
}

interface NotAvailTag {
  id: number;
  name: string;
  color: string;
}

interface Parcel {
  id: string;
  address: string;
  ownerName?: string;
  status: "AVAILABLE" | "LEAD" | "CUSTOMER";
  metadata?: string;
  geometry?: string;
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
    createdAt?: string;
    setter?: { id: number; name: string };
    projects?: { projectType: { name: string } }[];
  }[];
}

interface ParcelSheetProps {
  parcel: Parcel | null;
  onClose: () => void;
  onClaim: (parcelId: string) => Promise<{ id: string } | void>;
  onVisitStarted: () => void;
  onParcelUpdated?: (updated: Parcel) => void;
  onQuickTagApplied?: () => void;
  userRole: string;
  userId: string;
}

export function ParcelSheet({
  parcel,
  onClose,
  onClaim,
  onVisitStarted,
  onParcelUpdated,
  onQuickTagApplied,
  userRole,
  userId,
}: ParcelSheetProps) {
  const router = useRouter();
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [showTagsMenu, setShowTagsMenu] = useState(false);
  const [customTagName, setCustomTagName] = useState("");
  const [customTagColor, setCustomTagColor] = useState("#6366f1");
  const [localNotes, setLocalNotes] = useState("");
  const [editingTagIdx, setEditingTagIdx] = useState<number | null>(null);
  const [editTagName, setEditTagName] = useState("");
  const [editTagColor, setEditTagColor] = useState("#6366f1");

  const [notAvailTags, setNotAvailTags] = useState<NotAvailTag[]>([]);
  const [selectedNotAvailTagIds, setSelectedNotAvailTagIds] = useState<number[]>([]);

  const [showLeadModal, setShowLeadModal] = useState(false);
  const [visitNotAvailTags, setVisitNotAvailTags] = useState<NotAvailTag[]>([]);
  const [quickTagMessage, setQuickTagMessage] = useState<{ name: string; color: string } | null>(null);
  const [mapNotes, setMapNotes] = useState("");

  const noteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  const isAdmin = userRole === "ADMIN";

  useEffect(() => {
    setQuickTagMessage(null);
    if (!parcel) {
      setVisitNotAvailTags([]);
      return;
    }
    setMapNotes(parcel.parcelNotes || localStorage.getItem(`map_notes_${parcel.id}`) || "");
    const pId = parcel.id;
    if (!pId) return;
    const isRegridParcel = pId.includes("-") && pId.length > 30;
    if (isRegridParcel) return;
    fetch(`/api/parcels/${pId}`)
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        const latestVisit = data?.visits?.[0];
        if (latestVisit?.notAvailableTags) {
          setVisitNotAvailTags(
            latestVisit.notAvailableTags.map((vt: { tag: NotAvailTag; notes?: string }) => ({
              ...vt.tag,
            }))
          );
        } else {
          setVisitNotAvailTags([]);
        }
        if (data?.parcelNotes) {
          setLocalNotes(data.parcelNotes);
        }
      })
      .catch(() => {});
  }, [parcel?.id]);

  useEffect(() => {
    setLocalNotes(parcel?.parcelNotes || "");
  }, [parcel?.id, parcel?.parcelNotes]);

  useEffect(() => {
    fetch("/api/not-available-tags")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setNotAvailTags(d); })
      .catch(() => {});
  }, []);

  const saveTagsAuto = useCallback(async (newTags: TagObject[]) => {
    if (!parcel || isSavingRef.current) return;
    // Optimistic update - update parent immediately for instant visual feedback
    const prevParcel = { ...parcel };
    const updatedParcel = { ...parcel, parcelTags: JSON.stringify(newTags) };
    onParcelUpdated?.(updatedParcel as typeof parcel);
    
    isSavingRef.current = true;
    try {
      const res = await fetch(`/api/parcels/${parcel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parcelTags: JSON.stringify(newTags), address: parcel.address, geometry: parcel.geometry }),
      });
      if (res.ok) {
        const updated = await res.json();
        if (onParcelUpdated) onParcelUpdated({ ...parcel, parcelTags: updated.parcelTags });
      } else {
        onParcelUpdated?.(prevParcel as typeof parcel);
      }
    } catch { onParcelUpdated?.(prevParcel as typeof parcel); }
    finally { isSavingRef.current = false; }
  }, [parcel, onParcelUpdated]);

  const saveNotesAuto = useCallback(async (notes: string) => {
    if (!parcel) return;
    try {
      await fetch(`/api/parcels/${parcel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parcelNotes: notes }),
      });
    } catch { /* ignore */ }
  }, [parcel]);

  const debouncedSaveNotes = useCallback((notes: string) => {
    if (noteTimerRef.current) clearTimeout(noteTimerRef.current);
    noteTimerRef.current = setTimeout(() => {
      saveNotesAuto(notes);
    }, 800);
  }, [saveNotesAuto]);

  useEffect(() => {
    return () => {
      if (noteTimerRef.current) clearTimeout(noteTimerRef.current);
    };
  }, []);

  if (!parcel) return null;

  const STAGE_MAP: Record<string, string> = {
    IN_PROGRESS: "Lead",
    PROPOSAL_ACCEPTED: "Lead Potencial",
    PROJECT: "En Proyecto",
    CLOSED: "Proyecto Cerrado",
    CANCELLED: "Cancelado",
  };

  const getStageLabel = (p: Parcel): string => {
    const latestVisit = p.visits?.[0];
    return latestVisit?.stage ? (STAGE_MAP[latestVisit.stage] || "Lead") : "Lead";
  };

  const metadata = parcel.metadata ? JSON.parse(parcel.metadata) : {};
  const canVisit = userRole === "SETTER" || userRole === "SETTER_JR" || userRole === "CLOSER";
  const isTakenByMe = parcel.setter?.id === parseInt(userId);
  const isAvailable = parcel.status === "AVAILABLE";

  const tags: TagObject[] = (() => {
    try {
      return parcel.parcelTags ? JSON.parse(parcel.parcelTags) : [];
    } catch {
      return [];
    }
  })();

  const fullAddress = [parcel.city || metadata.city, parcel.state || metadata.state, parcel.zipCode || metadata.zipCode]
    .filter(Boolean)
    .join(", ");

  const toggleNotAvailTag = (tagId: number) => {
    const tag = notAvailTags.find((t) => t.id === tagId);
    if (!tag) return;

    const already = tags.some((t) => t.name === tag.name);
    let newTags: TagObject[];
    if (already) {
      newTags = tags.filter((t) => t.name !== tag.name);
    } else {
      newTags = [...tags, { name: tag.name, color: tag.color, date: new Date().toISOString() }];
    }
    saveTagsAuto(newTags);
  };

  const removeTag = (tagName: string) => {
    saveTagsAuto(tags.filter((t) => t.name !== tagName));
  };

  const startEditTag = (idx: number) => {
    setEditingTagIdx(idx);
    setEditTagName(tags[idx].name);
    setEditTagColor(tags[idx].color);
  };

  const saveEditTag = () => {
    if (editingTagIdx === null || !editTagName.trim()) return;
    const newTags = [...tags];
    newTags[editingTagIdx] = { ...newTags[editingTagIdx], name: editTagName.trim(), color: editTagColor };
    saveTagsAuto(newTags);
    setEditingTagIdx(null);
  };

  const cancelEditTag = () => {
    setEditingTagIdx(null);
  };

  const handleQuickTag = async (name: string, color: string) => {
    const newTags = [{ name, color, date: new Date().toISOString() }];
    await saveTagsAuto(newTags);
    setQuickTagMessage({ name, color });
    onQuickTagApplied?.();
  };

  const addCustomTagToParcel = () => {
    if (!customTagName.trim()) return;
    const exists = tags.some((t) => t.name === customTagName.trim());
    if (exists) {
      toast.error("Esa etiqueta ya existe");
      return;
    }
    const newTag: TagObject = { name: customTagName.trim(), color: customTagColor, date: new Date().toISOString() };
    saveTagsAuto([...tags, newTag]);
    setCustomTagName("");
    setCustomTagColor("#6366f1");
    setShowTagsMenu(false);
  };

  const handleAdminAddPresetTag = async () => {
    if (!customTagName.trim()) return;
    try {
      const res = await fetch("/api/admin/not-available-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: customTagName.trim(), color: customTagColor }),
      });
      if (res.ok) {
        const created = await res.json();
        setNotAvailTags((prev) => [...prev, created]);
        toast.success("Tag creado");
        setCustomTagName("");
        setCustomTagColor("#6366f1");
      } else {
        toast.error("Error al crear tag");
      }
    } catch {
      toast.error("Error al crear tag");
    }
  };

  const handleAdminDeletePresetTag = async (tagId: number) => {
    try {
      const res = await fetch(`/api/admin/not-available-tags/${tagId}`, { method: "DELETE" });
      if (res.ok) {
        setNotAvailTags((prev) => prev.filter((t) => t.id !== tagId));
        toast.success("Tag eliminado");
      } else {
        toast.error("Error al eliminar tag");
      }
    } catch {
      toast.error("Error al eliminar tag");
    }
  };

  const handleAdminUpdatePresetTag = async (tagId: number, name: string, color: string) => {
    try {
      const res = await fetch(`/api/admin/not-available-tags/${tagId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });
      if (res.ok) {
        const updated = await res.json();
        setNotAvailTags((prev) => prev.map((t) => (t.id === tagId ? updated : t)));
        toast.success("Tag actualizado");
      } else {
        toast.error("Error al actualizar");
      }
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const handleNotesChange = (val: string) => {
    setLocalNotes(val);
    debouncedSaveNotes(val);
  };

  const handleKnockDoor = async () => {
    if (claiming) return;
    setClaimError("");
    setClaiming(true);
    try {
      let navigateId = parcel.id;
      if (isAvailable) {
        const claimed = await onClaim(parcel.id);
        if (claimed) {
          navigateId = claimed.id;
        }
      }
      onVisitStarted();
      // If lead already has visits beyond IN_PROGRESS, go to lead details
      const latestVisit = parcel.visits?.[0];
      if (latestVisit && latestVisit.stage && latestVisit.stage !== 'IN_PROGRESS') {
        router.push(`/lead/${latestVisit.id}`);
      } else {
        router.push(`/visit/${navigateId}`);
      }
    } catch (e) {
      setClaimError(e instanceof Error ? e.message : "Error al reclamar parcela");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <>
      <div className="fixed inset-y-0 right-0 z-[1000] w-full sm:w-96 glass-panel border-l border-glass-border shadow-[-10px_0_40px_rgba(0,0,0,0.1)] flex flex-col max-h-screen sm:max-h-none animate-slide-in-right pb-16">
        <div className="flex justify-between items-center p-4 border-b border-glass-border">
          <div className="flex items-center gap-2">
            <StatusBadge status={parcel.status} />
            {parcel.setter && (
              <span className="text-on-surface-variant text-xs">
                {" "}
                <Link href={`/profile/${parcel.setter.id}`} className="hover:underline">
                  {parcel.setter.name}
                </Link>
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
            <h2 className="font-headline text-xl font-bold text-on-surface mb-1">
              {parcel.address}
            </h2>
            {fullAddress && (
              <p className="text-on-surface-variant text-sm">{fullAddress}</p>
            )}
            {parcel.ownerName && (
              <p className="text-on-surface-variant flex items-center gap-2 mt-1">
                <User className="w-4 h-4" />
                {parcel.ownerName}
              </p>
            )}

          </div>

          {quickTagMessage && (
            <div
              className="p-4 rounded-xl border flex items-center gap-3"
              style={{ backgroundColor: quickTagMessage.color + "15", borderColor: quickTagMessage.color + "40" }}
            >
              <span
                className="w-6 h-6 rounded-full shrink-0 border-2 border-white shadow"
                style={{ backgroundColor: quickTagMessage.color }}
              />
              <span className="text-sm font-semibold" style={{ color: quickTagMessage.color }}>
                {quickTagMessage.name}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {metadata.owner && <InfoCard label="Propietario" value={metadata.owner} />}
            {metadata.property_class && <InfoCard label="Clase" value={metadata.property_class} />}
            {metadata.acreage && <InfoCard label="Acres" value={metadata.acreage} />}
            {metadata.land_value && <InfoCard label="Valor terreno" value={`$${Number(metadata.land_value).toLocaleString()}`} />}
            {metadata.building_value && <InfoCard label="Valor constr." value={`$${Number(metadata.building_value).toLocaleString()}`} />}
            {metadata.roofAge && <InfoCard label="Edad del techo" value={metadata.roofAge} />}
            {metadata.utility && <InfoCard label="Est. Luz" value={metadata.utility} />}
            {metadata.solarPotential && <InfoCard label="Potencial solar" value={metadata.solarPotential} />}
            {parcel.ownerOccupied !== undefined && (
              <InfoCard label="Tipo" value={parcel.ownerOccupied ? "Dueño" : "Rentado"} />
            )}
            <InfoCard
              label="Estado"
              value={
                parcel.status === "LEAD" ? getStageLabel(parcel) :
                parcel.status === "CUSTOMER" ? "Cliente" :
                (tags.length > 0 ? tags[0].name : "Disponible")
              }
            />
          </div>

          {canVisit && isAvailable && parcel.status !== "CUSTOMER" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => handleQuickTag("NO ABRIO", "#ef4444")} className="text-white text-xs hover:opacity-90 border-transparent" style={{ backgroundColor: "#ef4444" }}><DoorClosed className="w-3.5 h-3.5 mr-1" />No abrio</Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickTag("NO LE INTERESA", "#f97316")} className="text-white text-xs hover:opacity-90 border-transparent" style={{ backgroundColor: "#f97316" }}><ThumbsDown className="w-3.5 h-3.5 mr-1" />No le interesa</Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickTag("PASAR LUEGO", "#3b82f6")} className="text-white text-xs hover:opacity-90 border-transparent" style={{ backgroundColor: "#3b82f6" }}><Clock className="w-3.5 h-3.5 mr-1" />Pasar luego</Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickTag("No esta el propietario", "#a855f7")} className="text-white text-xs hover:opacity-90 border-transparent" style={{ backgroundColor: "#a855f7" }}><UserX className="w-3.5 h-3.5 mr-1" />No esta el propietario</Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickTag("NO VIVE EL PROPIETARIO", "#eab308")} className="text-white text-xs hover:opacity-90 border-transparent" style={{ backgroundColor: "#eab308" }}><Home className="w-3.5 h-3.5 mr-1" />No vive el propietario</Button>
              </div>

              <div className="space-y-1">
                <textarea
                  value={mapNotes}
                  onChange={(e) => { setMapNotes(e.target.value); localStorage.setItem(`map_notes_${parcel.id}`, e.target.value); debouncedSaveNotes(e.target.value); }}
                  placeholder="Notas..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-glass-border bg-white/40 dark:bg-black/20 text-on-surface text-sm placeholder:text-on-surface-variant/60 resize-none outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors"
                />
              </div>
            </>
          )}

          {!isAvailable && !isTakenByMe && parcel.setter && (
            <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20">
              <p className="text-sm text-secondary font-medium">
                Esta parcela ya fue tomada por{" "}
                <Link href={`/profile/${parcel.setter.id}`} className="hover:underline">
                  {parcel.setter.name}
                </Link>
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

          {visitNotAvailTags.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Historial de Visita
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {visitNotAvailTags.map((vt, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{ backgroundColor: vt.color + "20", color: vt.color, border: `1px solid ${vt.color}40` }}
                  >
                    {vt.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-glass-border space-y-3">
          {claimError && (
            <p className="text-sm text-error bg-error/10 px-3 py-2 rounded-lg">
              {claimError}
            </p>
          )}

          {canVisit && isAvailable && parcel.status !== "CUSTOMER" && (
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleKnockDoor}
                disabled={claiming}
                className="w-full bg-brand-green hover:bg-brand-green/90 text-white py-6 text-lg rounded-xl shadow-md"
              >
                <DoorOpen className="w-5 h-5 mr-2" />
                Crear Lead
              </Button>

              <Button variant="ghost" onClick={onClose} className="w-full mt-2">
                Cerrar
              </Button>
            </div>
          )}

          {!isAdmin && !isAvailable && parcel.status !== "CUSTOMER" && (
            <>
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-surface-container-low border border-outline-variant/30">
                <span className="w-3 h-3 rounded-full bg-green-500 inline-block shrink-0" />
                <span className="text-sm text-on-surface-variant">Parcela tomada</span>
              </div>
              
              <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 my-2">
                <div className="flex items-center gap-2 text-sm text-on-surface">
                  <User className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium">{parcel.visits?.[0]?.setter?.name || "Desconocido"}</span>
                  <span className="text-on-surface-variant">|</span>
                  <span className="text-on-surface-variant">
                    {parcel.visits?.[0]?.createdAt
                      ? new Date(parcel.visits[0].createdAt).toLocaleDateString("es-MX", { year: "numeric", month: "numeric", day: "numeric" })
                      : "Fecha desconocida"}
                  </span>
                </div>
                {parcel.visits?.[0]?.projects && parcel.visits[0].projects.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {parcel.visits[0].projects.map((p, idx) => (
                      <span key={idx} className="text-xs font-semibold text-green-700 bg-green-100 dark:bg-green-500/10 dark:text-green-400 px-2.5 py-1 rounded-md">
                        {p.projectType.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {parcel.visits?.[0]?.id && (
                <Button 
                  onClick={() => router.push(`/lead/${parcel.visits?.[0]?.id}`)} 
                  className="w-full mt-4 bg-brand-green hover:bg-brand-green/90 text-white shadow-md py-6 rounded-xl"
                >
                  Ver detalles
                </Button>
              )}

              <Button variant="outline" onClick={onClose} className="w-full mt-3">
                Cerrar
              </Button>
            </>
          )}

          {canVisit && parcel.status === "CUSTOMER" && (
            <Button variant="outline" onClick={onClose} className="w-full">
              Cerrar
            </Button>
          )}
        </div>
      </div>

      <CreateLeadModal
        isOpen={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        onSuccess={() => {
          setShowLeadModal(false);
          onClose();
        }}
        initialAddress={parcel.address}
        initialOwnerName={parcel.ownerName}
      />
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    AVAILABLE: "bg-error/10 text-error",
    LEAD: "bg-secondary-container/20 text-secondary",
    CUSTOMER: "bg-primary/10 text-primary",
  };

  const labels = {
    AVAILABLE: "Disponible para visitar",
    LEAD: "Lead",
    CUSTOMER: "Cliente",
  };

  const tooltips = {
    AVAILABLE: "Esta parcela aun no ha sido visitada por ningun representante",
    LEAD: "",
    CUSTOMER: "",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
        colors[status as keyof typeof colors]
      }`}
      title={tooltips[status as keyof typeof tooltips] || undefined}
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
