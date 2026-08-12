"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ArrowLeft, Upload, Phone, User, Loader2, FileText, X, CheckCircle, AlertTriangle, Save } from "lucide-react";
import { ContractModal } from "@/components/quote/ContractModal";
import { NotesPanel } from "@/components/lead/NotesPanel";
import { SlotPicker } from "@/components/calendar/SlotPicker";

interface Closer { id: number; name: string; email: string }
interface ProjectType { id: number; name: string; description?: string }
interface Visit {
  id: number; stage: string;
  parcel: { address: string; ownerName?: string; metadata?: string };
  bill?: { phone?: string; clientName?: string; clientEmail?: string; notes?: string; imageUrl?: string; additionalFileUrl?: string; additionalFileName?: string };
  projects?: { projectType: { id: number; name: string } }[];
  createdAt?: string;
}

function CelebrationOverlay({ onComplete }: { onComplete: () => void }) {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 10 + 6,
    rotation: Math.random() * 360, delay: Math.random() * 0.8, duration: Math.random() * 1.5 + 1.5,
    color: ["#fb7800","#FFD700","#FF6B6B","#4ECDC4","#A78BFA","#34D399","#60A5FA","#F472B6"][Math.floor(Math.random()*8)],
  }));
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onAnimationComplete={() => { setTimeout(onComplete, 1200); }}>
      {particles.map((p) => (
        <motion.div key={p.id} className="absolute rounded-full pointer-events-none"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, backgroundColor: p.color }}
          initial={{ scale: 0, rotate: 0, opacity: 1 }}
          animate={{ scale: [0,1.5,0], rotate: p.rotation + 360, opacity: [1,1,0], y: [0,-200-Math.random()*200], x: [0,(Math.random()-0.5)*150] }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }} />
      ))}
      <motion.div className="text-center relative z-10" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring", stiffness: 200 }}>
        <motion.div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl shadow-primary/40"
          animate={{ rotate: [0,10,-10,0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
        <motion.h2 className="mt-6 text-3xl font-headline font-bold text-white drop-shadow-lg" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          Proyecto Cerrado!
        </motion.h2>
        <motion.p className="mt-2 text-white/70 text-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          Excelente trabajo
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

const inputClass =
  "w-full h-12 pl-12 pr-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface";
const inputNoIcon =
  "w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface";
const labelClass = "text-xs font-semibold text-on-surface-variant uppercase tracking-wider";

export default function VisitPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const parcelId = params.parcelId as string;
  const role = session?.user?.role ?? "";

  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState("");
  const [billFile, setBillFile] = useState<File | null>(null);
  const [billPreview, setBillPreview] = useState("");

  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [selectedProjectTypes, setSelectedProjectTypes] = useState<number[]>([]);

  const [selectedScheduleDate, setSelectedScheduleDate] = useState("");
  const [selectedScheduleTime, setSelectedScheduleTime] = useState("");
  const [selectedCloserId, setSelectedCloserId] = useState("");
  const [closers, setClosers] = useState<Closer[]>([]);

  const [showCelebration, setShowCelebration] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const pendingUrlRef = useRef<string | null>(null);
  const navigationBlockedRef = useRef(false);

  const isSetter = role === "SETTER";
  const isSetterJr = role === "SETTER_JR";
  const isCloser = role === "CLOSER";
  const hasPanelSolar = projectTypes.some((pt) => selectedProjectTypes.includes(pt.id) && pt.name.toLowerCase().includes("panel solar"));
  // Setter Jr, Admin, y Trainee (SETTER) si tiene Panel Solar eligen closer
  const showCloserDropdown = isSetterJr || role === "ADMIN" || (isSetter && hasPanelSolar);
  // Trainee (SETTER) si no es Panel Solar y Closer siempre se autoasignan
  const isSelfAssigned = isCloser || (isSetter && !hasPanelSolar);
  const scheduleSelected = selectedScheduleDate && selectedScheduleTime;

  useEffect(() => { fetchData(); }, [parcelId]); // eslint-disable-line

  const allowNavigation = useCallback(() => {
    navigationBlockedRef.current = false;
    setShowLeaveWarning(false);
    if (pendingUrlRef.current) {
      router.push(pendingUrlRef.current);
      pendingUrlRef.current = null;
    }
  }, [router]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    const handleClick = (e: MouseEvent) => {
      if (navigationBlockedRef.current) return;
      const link = (e.target as HTMLElement).closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href === window.location.pathname) return;
      if (link.closest('[data-no-warn]')) return;
      e.preventDefault();
      e.stopPropagation();
      navigationBlockedRef.current = true;
      pendingUrlRef.current = href;
      setShowLeaveWarning(true);
    };
    document.addEventListener('click', handleClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  async function fetchData() {
    try {
      const [visitRes, ptRes, closersRes] = await Promise.all([
        fetch(`/api/visits/active?parcelId=${parcelId}`),
        fetch("/api/project-types"),
        isSetter || isSetterJr ? fetch("/api/closers") : Promise.resolve(null),
      ]);
      if (!visitRes.ok) { setLoading(false); return; }
      const visitData: Visit = await visitRes.json();
      const ptData: ProjectType[] = await ptRes.json();
      setVisit(visitData);
      setProjectTypes(ptData.filter((pt: ProjectType) => pt.name !== "Campos Comunes").sort((a, b) => a.name === "Otros" ? 1 : b.name === "Otros" ? -1 : 0));

      let name = visitData.bill?.clientName ?? "";
      let email = visitData.bill?.clientEmail ?? "";
      let tel = visitData.bill?.phone ?? "";
      if (visitData.parcel?.metadata) {
        try {
          const m = JSON.parse(visitData.parcel.metadata);
          if (m.isManual) {
            name = name || m.ownerName || ""; email = email || m.email || ""; tel = tel || m.phone || "";
          }
        } catch { /* */ }
      }
      if (!name) name = visitData.parcel?.ownerName ?? "";
      setClientName(name); setClientEmail(email); setPhone(tel);
      if (visitData.bill?.imageUrl) setBillPreview(visitData.bill.imageUrl);
      if (visitData.bill?.additionalFileUrl) setIdPreview(visitData.bill.additionalFileUrl);
      if (visitData.projects) setSelectedProjectTypes(visitData.projects.map((p) => p.projectType.id));
      if (closersRes) {
        const cData: Closer[] = await closersRes.json();
        setClosers(cData);
        if (cData.length === 1) setSelectedCloserId(String(cData[0].id));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function uploadFile(file: File) {
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) throw new Error("Error al subir archivo");
    return (await res.json()).url as string;
  }

  function makeBillData(billImageUrl: string, idDocUrl: string) {
    // Always preserve existing URLs if no new file was uploaded
    const existingUrl = billPreview || "";
    const existingId = idPreview || "";
    return {
      phone: phone.trim(), clientName: clientName.trim() || null, clientEmail: clientEmail.trim() || null,
      imageUrl: billFile ? billImageUrl : (existingUrl || null),
      notes: null,
      additionalFileUrl: idFile ? idDocUrl : (existingId || null),
      additionalFileName: idFile?.name || null,
    };
  }

  function fileChanged(setFile: (f: File) => void, setPreview: (p: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
    };
  }

  function toggleProjectType(id: number) {
    setSelectedProjectTypes((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  }

  async function handleSave(mode: 'lead' | 'potential') {
    if (!visit) return;
    if (mode === 'potential' && !phone.trim()) { toast.error("El telefono es requerido para crear un Lead Potencial"); return; }
    if (mode === 'potential') {
      if (!selectedScheduleDate || !selectedScheduleTime) { toast.error("Debes seleccionar fecha y hora para agendar"); return; }
      if (showCloserDropdown && !selectedCloserId) { toast.error("Debes seleccionar un Closer"); return; }
      if (selectedProjectTypes.length === 0) { toast.error("Debes seleccionar al menos un tipo de proyecto"); return; }
    }
    setSaving(true);
    try {
      let billUrl = billPreview, idUrl = idPreview;
      if (billFile) billUrl = await uploadFile(billFile);
      if (idFile) idUrl = await uploadFile(idFile);

      const billData = makeBillData(billUrl, idUrl);

      if (selectedProjectTypes.length > 0) {
        await fetch(`/api/visits/${visit.id}/projects`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitId: visit.id, projectTypeIds: selectedProjectTypes }),
        });
      }

      const patchBody: Record<string, unknown> = {
        bill: { upsert: { create: billData, update: billData } },
        ...(showCloserDropdown && selectedCloserId ? { closerId: Number(selectedCloserId) } : {}),
        ...(isSelfAssigned ? { closerId: Number(session?.user?.id) } : {}),
      };

      if (mode === 'potential') {
        patchBody.scheduledAt = new Date(`${selectedScheduleDate}T${selectedScheduleTime}:00`).toISOString();
        patchBody.stage = "PROPOSAL_ACCEPTED";
      }

      const patchRes = await fetch(`/api/visits/${visit.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });

      if (!patchRes.ok) {
        const errorData = await patchRes.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al actualizar el lead en el servidor");
      }

      toast.success(mode === 'potential' ? "Lead Potencial creado" : "Lead guardado");
      navigationBlockedRef.current = true;
      router.push(`/dashboard?highlight=${visit.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally { setSaving(false); }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!visit || !visit.id) {
    return (
      <motion.div className="text-center py-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-on-surface-variant">No se encontró visita activa</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard")}>Volver</Button>
      </motion.div>
    );
  }

  return (
    <>
      <div className="space-y-6 pb-8">
        <AnimatePresence>
        {showCelebration && <CelebrationOverlay onComplete={() => { setShowCelebration(false); router.push("/dashboard"); }} />}
      </AnimatePresence>
      <ContractModal isOpen={showContractModal} onClose={() => setShowContractModal(false)} visitId={visit.id} />

      <motion.header className="flex items-center gap-3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <button onClick={() => router.push("/dashboard")} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high">
          <ArrowLeft className="w-5 h-5 text-primary" />
        </button>
        <h1 className="font-headline text-xl font-bold text-primary">One Solutions</h1>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={() => setShowContractModal(true)} className="text-xs gap-1.5"><FileText className="w-4 h-4" /> Tipos de Contratos</Button>
      </motion.header>

      <motion.section className="glass-panel rounded-xl p-4 flex justify-between items-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary"><CheckCircle className="w-5 h-5" /></div>
          <div><h2 className="font-semibold text-on-surface">{visit.parcel.address}</h2><p className="text-sm text-on-surface-variant">Visita en curso</p></div>
        </div>
        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full border border-primary/20">Activa</span>
      </motion.section>

      <motion.div className="glass-panel rounded-xl p-6 space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="space-y-2">
          <label className={labelClass}>Nombre</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
            <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nombre del cliente" className={inputClass} />
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Correo (opcional)</label>
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="Correo electrónico" className={inputClass} />
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Teléfono *</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Número de teléfono" required className={inputClass} />
          </div>
        </div>

        <UploadField label="ID del Cliente (opcional)" preview={idPreview}
          onChange={fileChanged(setIdFile, setIdPreview)} onClear={() => { setIdFile(null); setIdPreview(""); }} />

        <UploadField label="Recibo de Luz (opcional)" preview={billPreview}
          onChange={fileChanged(setBillFile, setBillPreview)} onClear={() => { setBillFile(null); setBillPreview(""); }} />

        <div className="space-y-3">
          <label className={labelClass}>Tipos de Proyecto</label>
          <div className="flex flex-wrap gap-2">
            {projectTypes.map((pt) => (
              <motion.button key={pt.id} type="button" onClick={() => toggleProjectType(pt.id)} whileTap={{ scale: 0.95 }}
                className={`px-4 py-2.5 rounded-full border text-sm font-medium transition-all ${selectedProjectTypes.includes(pt.id) ? "bg-primary/10 border-primary text-primary shadow-sm" : "bg-surface-container-lowest border-outline-variant text-on-surface hover:border-primary/30"}`}>
                {pt.name}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <NotesPanel visitId={visit.id} visitCreatedAt={visit?.createdAt} />
        </div>

        <section className="space-y-4 border-t border-outline-variant pt-6">
          <label className={labelClass}>Agendar Visita</label>

          {role === "SETTER" && hasPanelSolar && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">
                Este lead será asignado al closer con capacidades de panel solar.
              </p>
            </div>
          )}

          {showCloserDropdown && (
            <select value={selectedCloserId} onChange={(e) => setSelectedCloserId(e.target.value)}
              className={`${inputNoIcon} px-4`} required>
              <option value="">-- Selecciona un Closer --</option>
              {closers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}

          {session?.user?.id && (!showCloserDropdown || selectedCloserId) && (
            <SlotPicker
              userId={showCloserDropdown ? Number(selectedCloserId) : Number(session.user.id)}
              selectedDate={selectedScheduleDate || undefined}
              selectedTime={selectedScheduleTime || undefined}
              onSelect={(date, time) => {
                setSelectedScheduleDate(date);
                setSelectedScheduleTime(time);
              }}
            />
          )}
        </section>
      </motion.div>

      <Button onClick={() => handleSave('potential')} disabled={saving || !phone.trim() || !scheduleSelected || (showCloserDropdown && !selectedCloserId) || selectedProjectTypes.length === 0} className="w-full h-14">
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Crear Lead Potencial"}
      </Button>
    </div>

    <div className="fixed bottom-24 right-6 z-[60]">
      <Button onClick={() => handleSave('lead')} disabled={saving} className="shadow-xl rounded-full px-6 py-3 gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Guardar
      </Button>
    </div>

    <Modal isOpen={showLeaveWarning} onClose={() => { setShowLeaveWarning(false); }} title="No pierdas los datos del lead">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-on-surface">
            Si sales en este momento se creará el lead pero se perderá el nombre e información del lead recién creado. Guarda o planifica.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { navigationBlockedRef.current = false; setShowLeaveWarning(false); }} className="flex-1">
            Quedarme
          </Button>
          <Button variant="danger" onClick={allowNavigation} className="flex-1">
            Salir sin guardar
          </Button>
        </div>
      </div>
    </Modal>
  </>
  );
}

function UploadField({ label, preview, onChange, onClear }: {
  label: string; preview: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onClear: () => void;
}) {
  if (preview) {
    return (
      <div className="space-y-2">
        <label className={labelClass}>{label}</label>
        <motion.div className="relative" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded-xl" />
          <button type="button" onClick={onClear} className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <label className={labelClass}>{label}</label>
      <label className="w-full h-24 border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center bg-surface-container-lowest hover:bg-primary/5 transition-colors cursor-pointer group">
        <Upload className="w-6 h-6 text-on-surface-variant group-hover:text-primary transition-colors" />
        <span className="text-xs text-on-surface-variant mt-1">Haz clic para subir archivo</span>
        <input type="file" accept="image/*,.pdf" onChange={onChange} className="hidden" />
      </label>
    </div>
  );
}
