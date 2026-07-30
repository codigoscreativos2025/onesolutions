"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { CreateLeadModal } from "@/components/leads/CreateLeadModal";
import { DoorOpen, X, User, Tag, Plus, ChevronDown, ChevronUp, Save } from "lucide-react";
import { toast } from "sonner";

const PRESET_TAGS = [
  { name: "No abrió", color: "#ef4444" },
  { name: "Pasar después", color: "#f59e0b" },
  { name: "Ya tiene paneles", color: "#10b981" },
  { name: "Interesado", color: "#3b82f6" },
  { name: "No molestar", color: "#6b7280" },
];

interface TagObject {
  name: string;
  color: string;
  date: string;
}

interface ObjectionItem {
  id: number;
  name: string;
  color: string;
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

interface ParcelSheetProps {
  parcel: Parcel | null;
  onClose: () => void;
  onClaim: (parcelId: string) => Promise<{ id: string } | void>;
  onVisitStarted: () => void;
  onParcelUpdated?: (updated: Parcel) => void;
  userRole: string;
  userId: string;
}

export function ParcelSheet({
  parcel,
  onClose,
  onClaim,
  onVisitStarted,
  onParcelUpdated,
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
  const [saving, setSaving] = useState(false);

  const [showActivity, setShowActivity] = useState(false);
  const [objections, setObjections] = useState<ObjectionItem[]>([]);
  const [notAvailTags, setNotAvailTags] = useState<NotAvailTag[]>([]);
  const [selectedObjectionIds, setSelectedObjectionIds] = useState<number[]>([]);
  const [selectedNotAvailTagIds, setSelectedNotAvailTagIds] = useState<number[]>([]);
  const [activityNotes, setActivityNotes] = useState("");

  const [showLeadModal, setShowLeadModal] = useState(false);
  const [visitObjections, setVisitObjections] = useState<ObjectionItem[]>([]);
  const [visitNotAvailTags, setVisitNotAvailTags] = useState<NotAvailTag[]>([]);

  useEffect(() => {
    if (!parcel) {
      setVisitObjections([]);
      setVisitNotAvailTags([]);
      return;
    }
    const pId = parcel.id;
    if (!pId) return;
    fetch(`/api/parcels/${pId}`)
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        const latestVisit = data?.visits?.[0];
        if (latestVisit?.objections) {
          setVisitObjections(
            latestVisit.objections.map((vo: { objection: ObjectionItem; notes?: string }) => ({
              ...vo.objection,
            }))
          );
        } else {
          setVisitObjections([]);
        }
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
          setActivityNotes(data.parcelNotes);
        }
      })
      .catch(() => {});
  }, [parcel?.id]);

  useEffect(() => {
    setLocalNotes(parcel?.parcelNotes || "");
  }, [parcel?.id, parcel?.parcelNotes]);

  useEffect(() => {
    if (parcel && showActivity) {
      fetch("/api/objections")
        .then((r) => r.json())
        .then((d) => { if (Array.isArray(d)) setObjections(d); })
        .catch(() => {});
      fetch("/api/not-available-tags")
        .then((r) => r.json())
        .then((d) => { if (Array.isArray(d)) setNotAvailTags(d); })
        .catch(() => {});
    }
  }, [showActivity, parcel?.id]);

  const saveTags = useCallback(async (newTags: TagObject[]) => {
    if (!parcel) return;
    try {
      const res = await fetch(`/api/parcels/${parcel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parcelTags: JSON.stringify(newTags) }),
      });
      if (res.ok) {
        const updated = await res.json();
        if (onParcelUpdated) onParcelUpdated({ ...parcel, parcelTags: updated.parcelTags });
        toast.success("Etiqueta guardada");
      }
    } catch {
      toast.error("Error al guardar etiqueta");
    }
  }, [parcel, onParcelUpdated]);

  const saveNotes = useCallback(async (notes: string) => {
    if (!parcel) return;
    try {
      await fetch(`/api/parcels/${parcel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parcelNotes: notes }),
      });
    } catch { /* ignore */ }
  }, [parcel]);

  if (!parcel) return null;

  const metadata = parcel.metadata ? JSON.parse(parcel.metadata) : {};
  const canVisit = userRole === "SETTER" || userRole === "SETTER_JR" || userRole === "CLOSER" || userRole === "ADMIN";
  const isTakenByMe = parcel.setter?.id === parseInt(userId);
  const isAvailable = parcel.status === "AVAILABLE";
  const isClaimedByMySetter = userRole === "CLOSER" && parcel.status === "LEAD" && parcel.setter;

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

  const addTag = (tag: TagObject) => {
    const exists = tags.some((t) => t.name === tag.name);
    if (exists) {
      toast.error("Esa etiqueta ya existe");
      return;
    }
    const newTag = { ...tag, date: new Date().toISOString() };
    saveTags([...tags, newTag]);
    setShowTagsMenu(false);
  };

  const removeTag = (tagName: string) => {
    saveTags(tags.filter((t) => t.name !== tagName));
  };

  const addCustomTag = () => {
    if (!customTagName.trim()) return;
    addTag({ name: customTagName.trim(), color: customTagColor, date: "" });
    setCustomTagName("");
    setCustomTagColor("#6366f1");
  };

  const handleNotesBlur = () => {
    if (localNotes !== (parcel.parcelNotes || "")) {
      saveNotes(localNotes);
    }
  };

  const toggleObjection = (id: number) => {
    setSelectedObjectionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleNotAvailTag = (id: number) => {
    setSelectedNotAvailTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
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
      router.push(`/visit/${navigateId}`);
    } catch (e) {
      setClaimError(e instanceof Error ? e.message : "Error al reclamar parcela");
    } finally {
      setClaiming(false);
    }
  };

  const handleSaveActivity = async () => {
    setSaving(true);
    try {
      const selectedTags: TagObject[] = [
        ...selectedObjectionIds.map((id) => {
          const obj = objections.find((o) => o.id === id);
          return { name: obj?.name || `Objecion #${id}`, color: obj?.color || "#fb7800", date: new Date().toISOString() };
        }),
        ...selectedNotAvailTagIds.map((id) => {
          const tag = notAvailTags.find((t) => t.id === id);
          return { name: tag?.name || `Tag #${id}`, color: tag?.color || "#fb7800", date: new Date().toISOString() };
        }),
      ];

      const combinedTags = selectedTags.length > 0
        ? [...tags, ...selectedTags]
        : tags;

      const res = await fetch(`/api/parcels/${parcel.id}/save-activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parcelTags: JSON.stringify(combinedTags),
          parcelNotes: activityNotes || localNotes || null,
          address: parcel.address,
          ownerName: parcel.ownerName,
          geometry: JSON.stringify({ type: "Point", coordinates: [0, 0] }),
          metadata: parcel.metadata || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al guardar");
      }

      toast.success("Actividad guardada");
      setShowActivity(false);
      setSelectedObjectionIds([]);
      setSelectedNotAvailTagIds([]);
      setActivityNotes("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
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
                •{" "}
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
                parcel.status === "AVAILABLE"
                  ? "Disponible"
                  : parcel.status === "LEAD"
                  ? "Lead"
                  : "Cliente"
              }
            />
          </div>

          {/* Etiquetas section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-on-surface-variant" />
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Etiquetas
                </span>
              </div>
              <button
                onClick={() => setShowTagsMenu(!showTagsMenu)}
                className="w-7 h-7 rounded-full bg-surface-container-highest flex items-center justify-center active:scale-90"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {showTagsMenu && (
              <div className="mb-3 p-3 rounded-xl border border-glass-border bg-white/60 dark:bg-black/20 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_TAGS.map((t) => (
                    <button
                      key={t.name}
                      onClick={() => addTag({ name: t.name, color: t.color, date: "" })}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white active:scale-95 transition-transform"
                      style={{ backgroundColor: t.color }}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={customTagName}
                    onChange={(e) => setCustomTagName(e.target.value)}
                    placeholder="Etiqueta personalizada..."
                    className="flex-1 h-8 px-3 text-xs rounded-lg border border-glass-border bg-white dark:bg-black/20 text-on-surface outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addCustomTag();
                    }}
                  />
                  <input
                    type="color"
                    value={customTagColor}
                    onChange={(e) => setCustomTagColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                  />
                  <button
                    onClick={addCustomTag}
                    className="px-2 py-1 text-xs rounded-lg bg-primary text-on-primary font-semibold"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t, i) => (
                  <span
                    key={`${t.name}-${i}`}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                    style={{ backgroundColor: t.color }}
                  >
                    {t.name}
                    <button
                      onClick={() => removeTag(t.name)}
                      className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notas section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Notas
              </span>
            </div>
            <textarea
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Agregar notas..."
              className="w-full h-20 px-3 py-2 rounded-lg border border-glass-border bg-white/40 dark:bg-black/20 text-on-surface text-sm outline-none resize-none focus:border-primary"
            />
          </div>

          <div className="sticky bottom-0 pt-3 border-t border-glass-border">
            <Button variant="outline" onClick={onClose} className="w-full">
              Cerrar
            </Button>
          </div>

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

          {(visitObjections.length > 0 || visitNotAvailTags.length > 0) && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Historial de Visita
              </h3>
              {visitObjections.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {visitObjections.map((o, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary/10 text-secondary border border-secondary/20"
                    >
                      {o.name}
                    </span>
                  ))}
                </div>
              )}
              {visitNotAvailTags.length > 0 && (
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
              )}
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

          {canVisit && (isAvailable || isTakenByMe || isClaimedByMySetter) && parcel.status !== "CUSTOMER" && (
            <>
              {/* Collapsible "Actividad de Puerta" section */}
              <button
                onClick={() => setShowActivity(!showActivity)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors"
              >
                <span className="text-sm font-semibold text-on-surface uppercase tracking-wider">
                  Actividad de Puerta
                </span>
                {showActivity ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showActivity && (
                <div className="p-3 rounded-xl border border-glass-border bg-white/40 dark:bg-black/20 space-y-3">
                  {notAvailTags.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                        No Disponible
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {notAvailTags.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => toggleNotAvailTag(t.id)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                              selectedNotAvailTagIds.includes(t.id)
                                ? "text-white ring-2 ring-offset-1 ring-offset-transparent ring-white/40"
                                : "text-white/70 hover:text-white"
                            }`}
                            style={{ backgroundColor: t.color }}
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {objections.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                        Objeciones
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {objections.map((o) => (
                          <button
                            key={o.id}
                            onClick={() => toggleObjection(o.id)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                              selectedObjectionIds.includes(o.id)
                                ? "text-white ring-2 ring-offset-1 ring-offset-transparent ring-white/40"
                                : "text-white/70 hover:text-white"
                            }`}
                            style={{ backgroundColor: o.color }}
                          >
                            {o.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <textarea
                    value={activityNotes}
                    onChange={(e) => setActivityNotes(e.target.value)}
                    placeholder="Notas de la visita..."
                    className="w-full h-16 px-3 py-2 rounded-lg border border-glass-border bg-white dark:bg-black/20 text-on-surface text-xs outline-none resize-none"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveActivity}
                  disabled={saving}
                  variant="outline"
                  className="flex-1 h-12 text-sm uppercase tracking-widest"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Guardando..." : "Guardar Actividad"}
                </Button>

                {isAvailable ? (
                  <Button
                    onClick={handleKnockDoor}
                    disabled={claiming}
                  >
                    <DoorOpen className="w-4 h-4" />
                    Crear Lead
                  </Button>
                ) : (isTakenByMe || isClaimedByMySetter) ? (
                  <Button
                    onClick={handleKnockDoor}
                    disabled={claiming}
                    className="flex-1 h-12 text-sm uppercase tracking-widest"
                  >
                    <DoorOpen className="w-4 h-4" />
                    {claiming ? "..." : "Continuar Visita"}
                  </Button>
                ) : null}
              </div>

              <Button variant="outline" onClick={onClose} className="w-full">
                Cerrar
              </Button>
            </>
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
    AVAILABLE: "Esta parcela aún no ha sido visitada por ningún representante",
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
