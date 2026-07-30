"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Upload, Phone, User, Loader2, FileText, X, CheckCircle } from "lucide-react";
import { QuoteModal } from "@/components/quote/QuoteModal";
import { ContractModal } from "@/components/quote/ContractModal";
import { SlotPicker } from "@/components/calendar/SlotPicker";

interface Closer { id: number; name: string; email: string }
interface ProjectType { id: number; name: string; description?: string }
interface Visit {
  id: number; stage: string;
  parcel: { address: string; ownerName?: string; metadata?: string };
  bill?: { phone?: string; clientName?: string; clientEmail?: string; notes?: string; imageUrl?: string; additionalFileUrl?: string; additionalFileName?: string };
  projects?: { projectType: { id: number; name: string } }[];
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
  const [notes, setNotes] = useState("");

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
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);

  const isSetter = role === "SETTER";
  const isSetterJr = role === "SETTER_JR";
  const isCloser = role === "CLOSER";
  const hasPanelSolar = projectTypes.some((pt) => selectedProjectTypes.includes(pt.id) && pt.name.toLowerCase().includes("panel solar"));
  const showCloserDropdown = isSetterJr || (isSetter && hasPanelSolar);
  const isSelfAssigned = isCloser || (isSetter && !hasPanelSolar);

  useEffect(() => { fetchData(); }, [parcelId]); // eslint-disable-line

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
      setProjectTypes(ptData);

      let name = visitData.bill?.clientName ?? "";
      let email = visitData.bill?.clientEmail ?? "";
      let tel = visitData.bill?.phone ?? "";
      let nts = visitData.bill?.notes ?? "";
      if (visitData.parcel?.metadata) {
        try {
          const m = JSON.parse(visitData.parcel.metadata);
          if (m.isManual) {
            name = name || m.ownerName || ""; email = email || m.email || ""; tel = tel || m.phone || ""; nts = nts || m.notes || "";
          }
        } catch { /* */ }
      }
      if (!name) name = visitData.parcel?.ownerName ?? "";
      setClientName(name); setClientEmail(email); setPhone(tel); setNotes(nts);
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
    return {
      phone: phone.trim(), clientName: clientName.trim() || null, clientEmail: clientEmail.trim() || null,
      imageUrl: billImageUrl || null, notes: notes.trim() || null,
      additionalFileUrl: idDocUrl || null, additionalFileName: idFile?.name || null,
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

  async function handleSaveAndSchedule() {
    if (!visit) return;
    if (!phone.trim()) { toast.error("El teléfono es requerido"); return; }
    if (!selectedScheduleDate || !selectedScheduleTime) { toast.error("Debes seleccionar fecha y hora para agendar"); return; }
    if (showCloserDropdown && !selectedCloserId) { toast.error("Debes seleccionar un Closer"); return; }
    setSaving(true);
    try {
      let billUrl = billPreview, idUrl = idPreview;
      if (billFile) billUrl = await uploadFile(billFile);
      if (idFile) idUrl = await uploadFile(idFile);

      const scheduledAt = new Date(`${selectedScheduleDate}T${selectedScheduleTime}:00`).toISOString();
      const billData = makeBillData(billUrl, idUrl);

      await fetch(`/api/visits/${visit.id}/projects`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId: visit.id, projectTypeIds: selectedProjectTypes }),
      });

      await fetch(`/api/visits/${visit.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: notes.trim() || null, scheduledAt, stage: "PROPOSAL_ACCEPTED",
          ...(showCloserDropdown && selectedCloserId ? { closerId: Number(selectedCloserId) } : {}),
          ...(isSelfAssigned ? { closerId: Number(session?.user?.id) } : {}),
          bill: { upsert: { create: billData, update: billData } },
        }),
      });

      toast.success("Visita agendada");
      router.push(`/dashboard?highlight=${visit.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al agendar");
    } finally { setSaving(false); }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!visit) {
    return (
      <motion.div className="text-center py-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-on-surface-variant">No se encontró visita activa</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard")}>Volver</Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <AnimatePresence>
        {showCelebration && <CelebrationOverlay onComplete={() => { setShowCelebration(false); router.push("/dashboard"); }} />}
      </AnimatePresence>
      <QuoteModal isOpen={showQuoteModal} onClose={() => setShowQuoteModal(false)} visitId={visit.id} />
      <ContractModal isOpen={showContractModal} onClose={() => setShowContractModal(false)} visitId={visit.id} />

      <motion.header className="flex items-center gap-3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <button onClick={() => router.push("/dashboard")} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high">
          <ArrowLeft className="w-5 h-5 text-primary" />
        </button>
        <h1 className="font-headline text-xl font-bold text-primary">One Solutions</h1>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={() => setShowQuoteModal(true)} className="text-xs gap-1.5"><FileText className="w-4 h-4" /> Cotización</Button>
        <Button variant="ghost" size="sm" onClick={() => setShowContractModal(true)} className="text-xs gap-1.5"><FileText className="w-4 h-4" /> Documentos</Button>
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

        <div className="space-y-2">
          <label className={labelClass}>Notas (opcional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas adicionales..."
            className="w-full min-h-[80px] bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-xl p-4 resize-none text-on-surface" />
        </div>

        <section className="space-y-4 border-t border-outline-variant pt-6">
          <label className={labelClass}>Agendar Visita</label>

          {showCloserDropdown && (
            <select value={selectedCloserId} onChange={(e) => setSelectedCloserId(e.target.value)}
              className={`${inputNoIcon} px-4`} required>
              <option value="">-- Selecciona un Closer --</option>
              {closers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}

          {session?.user?.id && (
            <SlotPicker
              userId={showCloserDropdown && selectedCloserId ? Number(selectedCloserId) : Number(session.user.id)}
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

      <Button onClick={handleSaveAndSchedule} disabled={saving || !phone.trim()} className="w-full h-14">
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar y Agendar"}
      </Button>
    </div>
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
