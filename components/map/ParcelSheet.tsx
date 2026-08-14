"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { CreateLeadModal } from "@/components/leads/CreateLeadModal";
import { DoorOpen, X, User, Tag, Plus, Pencil, Trash2, DoorClosed, ThumbsDown, Clock, UserX, Home, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/lib/locale-context";

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
  visitHistory?: {
    id: number;
    visitedAt: string;
    status: string;
    notes?: string;
    setter?: { name: string; role: string };
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
  const { t } = useLocale();
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
    
    // Fetch from in-memory API
    if (parcel.id) {
      fetch(`/api/map-notes?parcelId=${parcel.id}`)
        .then(res => res.json())
        .then(data => setMapNotes(data.note || ""))
        .catch(() => setMapNotes(""));
    }
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
        if (data?.visitHistory) {
          // This will trigger a re-render with the updated parcel data containing visitHistory
          onParcelUpdated?.(data);
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
      await fetch(`/api/map-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parcelId: parcel.id, note: notes }),
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
  const closedVisits = parcel.visits?.filter(v => v.stage === "CLOSED") || [];
  const hasPriorProjects = closedVisits.length > 0;
  
  const latestVisit = parcel.visits?.[0];
  const hasActiveVisit = !!latestVisit && (latestVisit.stage !== "CLOSED" && latestVisit.stage !== "CANCELLED");
  const canCreateLead = canVisit && !hasActiveVisit && (isAvailable || hasPriorProjects || parcel.status === "CUSTOMER");
  const showActiveDetails = hasActiveVisit;

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
      if (isAvailable || hasPriorProjects) {
        const claimed = await onClaim(parcel.id);
        if (claimed) {
          navigateId = claimed.id;
        }
      }
      onVisitStarted();
      router.push(`/visit/${navigateId}`);
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

          {hasPriorProjects && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Historial de Proyectos
              </h3>
              {closedVisits.map((v) => (
                <div key={v.id} className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15 flex justify-between items-start">
                  <div className="text-sm">
                    <p className="font-medium text-on-surface">
                      Cerrado por {v.setter?.name || "Desconocido"}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Proyectos: {v.projects?.map(p => p.projectType.name).join(", ") || "N/A"}
                    </p>
                    {v.createdAt && (
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {new Date(v.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {userRole !== "SETTER_JR" && (userRole !== "SETTER" && userRole !== "TRAINEE" || v.setter?.id === parseInt(userId)) && (
                    <Link href={`/lead/${v.id}`} target="_blank" className="text-primary text-xs hover:underline shrink-0 ml-2">
                      Ver
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Historial de Etiquetas / Notas */}
          {!hasActiveVisit && parcel.visitHistory && parcel.visitHistory.length > 0 && (
            <div className="space-y-2 mt-4">
              <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Historial de Etiquetas
              </h3>
              <div className="flex flex-col gap-2">
                {parcel.visitHistory.map((h) => {
                  const tagInfo = notAvailTags.find(t => t.name === h.status) || { color: "#888", name: h.status };
                  return (
                    <div key={h.id} className="p-3 rounded-xl border border-glass-border bg-white/40 dark:bg-black/20 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span 
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          style={{ backgroundColor: tagInfo.color + "20", color: tagInfo.color }}
                        >
                          {tagInfo.name}
                        </span>
                        <span className="text-xs text-on-surface-variant">
                          {new Date(h.visitedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-end mt-2">
                        <p className="text-on-surface italic text-xs leading-relaxed max-w-[70%]">
                          {h.notes ? `"${h.notes}"` : "Sin notas adicionales"}
                        </p>
                        <p className="text-xs font-medium text-on-surface-variant">
                          - {h.setter?.name || "Usuario"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
                parcel.status === "CUSTOMER" ? t.map.customer :
                (tags.length > 0 ? tags[0].name : t.map.available)
              }
            />
          </div>

          {canVisit && isAvailable && !hasPriorProjects && parcel.status !== "CUSTOMER" && (
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
                  onChange={(e) => { 
                    setMapNotes(e.target.value); 
                    debouncedSaveNotes(e.target.value); 
                  }}
                  placeholder="Notas..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-glass-border bg-white/40 dark:bg-black/20 text-on-surface text-sm placeholder:text-on-surface-variant/60 resize-none outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors"
                />
              </div>
            </>
          )}

          {parcel.status === "CUSTOMER" && (
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-sm text-primary font-medium">
                {t.map.completedCustomer}
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

          {canCreateLead && (
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleKnockDoor}
                disabled={claiming}
                className="w-full bg-brand-green hover:bg-brand-green/90 text-white py-6 text-lg rounded-xl shadow-md"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                {t.map.knockDoor}
              </Button>

              <Button variant="ghost" onClick={onClose} className="w-full mt-2">
                {t.common.close}
              </Button>
            </div>
          )}

          {showActiveDetails && (
            <>
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-surface-container-low border border-outline-variant/30">
                <span className="w-3 h-3 rounded-full bg-green-500 inline-block shrink-0" />
                <span className="text-sm text-on-surface-variant">{t.map.takenBy}</span>
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
                  disabled={userRole === "SETTER_JR" || ((userRole === "SETTER" || userRole === "TRAINEE") && !isTakenByMe)}
                  className="w-full mt-4 bg-brand-green hover:bg-brand-green/90 text-white shadow-md py-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ver detalles
                </Button>
              )}

              <Button variant="outline" onClick={onClose} className="w-full mt-3">
                {t.common.close}
              </Button>
            </>
          )}

          {canVisit && !hasActiveVisit && !canCreateLead && (
            <Button variant="outline" onClick={onClose} className="w-full">
              {t.common.close}
            </Button>
          )}

          {/* Leyenda en el Drawer */}
          <div className="mt-6 pt-4 border-t border-glass-border">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 mb-3 ml-1">
              Leyenda de Etiquetas
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-1.5 rounded-lg">
                <div className="w-3 h-3 rounded-full shrink-0 bg-[#ef4444]" />
                <span className="text-[10px] font-semibold text-on-surface-variant">No abrio</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded-lg">
                <div className="w-3 h-3 rounded-full shrink-0 bg-[#f97316]" />
                <span className="text-[10px] font-semibold text-on-surface-variant">No le interesa</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded-lg">
                <div className="w-3 h-3 rounded-full shrink-0 bg-[#3b82f6]" />
                <span className="text-[10px] font-semibold text-on-surface-variant">Pasar luego</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded-lg">
                <div className="w-3 h-3 rounded-full shrink-0 bg-[#a855f7]" />
                <span className="text-[10px] font-semibold text-on-surface-variant">No esta prop.</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded-lg">
                <div className="w-3 h-3 rounded-full shrink-0 bg-[#eab308]" />
                <span className="text-[10px] font-semibold text-on-surface-variant">No vive prop.</span>
              </div>
            </div>
          </div>
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
  const { t } = useLocale();
  const colors = {
    AVAILABLE: "bg-error/10 text-error",
    LEAD: "bg-secondary-container/20 text-secondary",
    CUSTOMER: "bg-primary/10 text-primary",
  };

  const labels = {
    AVAILABLE: t.map.available,
    LEAD: t.map.lead,
    CUSTOMER: t.map.customer,
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
