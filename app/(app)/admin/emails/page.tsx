"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { emailTemplates } from "@/lib/email-templates";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mail, Send, Eye, Users, Loader2, RefreshCw } from "lucide-react";

type TemplateKey = keyof typeof emailTemplates | "custom";

function wrapCustomHtml(body: string): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f6;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f6;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
<tr><td style="padding:32px 40px;text-align:center;">
<svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg" style="width:80px;height:106px;">
<polygon points="30,100 150,30 270,100 270,120 150,50 30,120" fill="#f48221"/>
<polygon points="210,115 235,95 255,115 230,135" fill="#1d1d1b"/>
<circle cx="150" cy="180" r="65" fill="none" stroke="#1d1d1b" stroke-width="18"/>
<text x="150" y="228" font-family="Arial,sans-serif" font-weight="900" font-size="130" text-anchor="middle" fill="#1d1d1b">S</text>
<g fill="#f48221"><text x="150" y="325" font-family="Arial Black,Impact,sans-serif" font-weight="900" font-size="95" text-anchor="middle" letter-spacing="1">ONE</text>
<rect x="73" y="240" width="6" height="90" fill="#fff"/>
<rect x="135" y="240" width="6" height="90" fill="#fff" transform="skewX(-25)"/>
<rect x="228" y="240" width="8" height="90" fill="#fff"/></g>
<text x="150" y="375" font-family="Arial,sans-serif" font-weight="900" font-size="36" text-anchor="middle" fill="#000" letter-spacing="2">SOLUTIONS</text>
</svg>
</td></tr>
<tr><td style="padding:0 40px 32px;">${body}</td></tr>
<tr><td style="padding:24px 40px;background:#1d1d1b;text-align:center;">
<p style="margin:0;color:#aaa;font-size:11px;">&copy; ${new Date().getFullYear()} One Solutions Companies. Todos los derechos reservados.</p>
</td></tr></table></td></tr></table></body></html>`;
}

const templateMeta: { key: TemplateKey; label: string; desc: string; fields: { name: string; label: string; placeholder: string }[] }[] = [
  {
    key: "custom", label: "Personalizado", desc: "Escribe tu propio asunto y contenido sin plantilla predefinida.",
    fields: [],
  },
  {
    key: "onboarding", label: "Bienvenida (Onboarding)", desc: "Se envía al crear un usuario para que configure su contraseña.",
    fields: [
      { name: "name", label: "Nombre del usuario", placeholder: "Juan Pérez" },
      { name: "setupLink", label: "Link de configuración", placeholder: "https://..." },
    ],
  },
  {
    key: "contractToClient", label: "Contrato al Cliente", desc: "Notifica al cliente que se le ha enviado un contrato.",
    fields: [
      { name: "clientName", label: "Nombre del cliente", placeholder: "María García" },
      { name: "contractName", label: "Nombre del contrato", placeholder: "Contrato de Techo" },
    ],
  },
  {
    key: "invoice", label: "Factura", desc: "Acompaña el envío de una factura al cliente.",
    fields: [
      { name: "clientName", label: "Nombre del cliente", placeholder: "Carlos López" },
      { name: "invoiceNum", label: "Número de factura", placeholder: "INV-0026" },
    ],
  },
  {
    key: "reminderVisit", label: "Recordatorio de Visita", desc: "Recuerda al cliente una visita agendada.",
    fields: [
      { name: "repName", label: "Nombre del representante", placeholder: "Ana Martínez" },
      { name: "clientName", label: "Nombre del cliente", placeholder: "Roberto Díaz" },
      { name: "date", label: "Fecha", placeholder: "15/01/2026" },
      { name: "time", label: "Hora (opcional)", placeholder: "10:00 AM" },
    ],
  },
  {
    key: "projectProgress", label: "Progreso de Proyecto", desc: "Notifica un cambio de etapa en el proyecto.",
    fields: [
      { name: "repName", label: "Nombre del representante", placeholder: "Pedro Sánchez" },
      { name: "clientName", label: "Nombre del cliente", placeholder: "Laura Fernández" },
      { name: "stage", label: "Etapa del proyecto", placeholder: "Proyecto Cerrado" },
    ],
  },
  {
    key: "leadExpiring", label: "Lead por Vencer", desc: "Alerta al representante que un lead está por expirar.",
    fields: [
      { name: "repName", label: "Nombre del representante", placeholder: "Diego Torres" },
      { name: "leadAddress", label: "Dirección del lead", placeholder: "123 Main St" },
      { name: "daysLeft", label: "Días restantes", placeholder: "3" },
    ],
  },
  {
    key: "projectClosed", label: "Proyecto Cerrado", desc: "Notifica a los administradores que se cerró un proyecto.",
    fields: [
      { name: "repName", label: "Nombre del representante", placeholder: "Sofía Ramírez" },
      { name: "clientName", label: "Nombre del cliente", placeholder: "Andrés Mora" },
      { name: "amount", label: "Monto del proyecto", placeholder: "$15,000" },
    ],
  },
  {
    key: "welcomeRep", label: "Bienvenida Representante", desc: "Da la bienvenida a un nuevo representante.",
    fields: [
      { name: "repName", label: "Nombre del representante", placeholder: "Nuevo Trainee" },
      { name: "loginLink", label: "Link de acceso", placeholder: "https://my.onesolutionscompanies.com" },
    ],
  },
];

interface UserRecipient {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function AdminEmailsPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserRecipient[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>("onboarding");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [recipients, setRecipients] = useState<UserRecipient[]>([]);
  const [sending, setSending] = useState(false);
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);

  const activeMeta = templateMeta.find((m) => m.key === selectedTemplate)!;
  const roles = ["ALL", "ADMIN", "SETTER", "SETTER_JR", "CLOSER", "PARTNER"];

  useEffect(() => {
    setLoadingUsers(true);
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : data.users || [];
        setUsers(arr.filter((u: UserRecipient) => u.email));
      })
      .catch(() => toast.error("Error al cargar usuarios"))
      .finally(() => setLoadingUsers(false));
  }, []);

  const filteredUsers = useMemo(() => {
    return roleFilter === "ALL"
      ? users
      : users.filter((u) => u.role === roleFilter);
  }, [users, roleFilter]);

  const toggleRecipient = (user: UserRecipient) => {
    setRecipients((prev) =>
      prev.find((r) => r.id === user.id)
        ? prev.filter((r) => r.id !== user.id)
        : [...prev, user]
    );
  };

  const selectAll = () => setRecipients([...filteredUsers]);
  const clearAll = () => setRecipients([]);

  const isCustom = selectedTemplate === "custom";

  useEffect(() => {
    if (isCustom && editorRef.current) {
      editorRef.current.innerHTML = customBody;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCustom]);

  const templateFn = isCustom ? undefined : emailTemplates[selectedTemplate as keyof typeof emailTemplates];
  const previewHtml = useMemo(() => {
    if (isCustom) {
      if (!customBody) return "<p style='color:#888;text-align:center;padding:40px;'>Escribe el contenido del correo...</p>";
      return wrapCustomHtml(customBody);
    }
    try {
      const args = activeMeta.fields.map((f) => fieldValues[f.name] || `[${f.label}]`);
      return (templateFn as (...a: string[]) => string)(...args);
    } catch {
      return "<p>Completa los campos para previsualizar</p>";
    }
  }, [isCustom, customBody, selectedTemplate, fieldValues, activeMeta, templateFn]);

  const handleSend = async () => {
    if (recipients.length === 0) {
      toast.error("Selecciona al menos un destinatario");
      return;
    }
    if (isCustom && (!customSubject.trim() || !customBody.trim())) {
      toast.error("Define el asunto y contenido del correo");
      return;
    }
    setSending(true);
    let sent = 0;
    let failed = 0;
    for (const recipient of recipients) {
      try {
        const subject = isCustom ? customSubject : `One Solutions - ${activeMeta.label}`;
        const res = await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: recipient.email,
            subject,
            html: previewHtml,
          }),
        });
        if (res.ok) sent++;
        else failed++;
      } catch {
        failed++;
      }
    }
    setSending(false);
    if (failed === 0) toast.success(`Enviado a ${sent} destinatario(s)`);
    else toast.error(`${sent} enviados, ${failed} fallaron`);
  };

  const updateField = (name: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [name]: value }));
  };

  if (session?.user?.role !== "ADMIN") {
    return <div className="p-8 text-center text-on-surface-variant">Acceso restringido a administradores.</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="w-7 h-7" style={{ color: "#f48221" }} />
            Correos
          </h1>
          <p className="text-on-surface-variant mt-1">Envía correos personalizados usando plantillas predeterminadas</p>
        </div>
        <Button onClick={handleSend} disabled={sending || recipients.length === 0} className="gap-2" style={{ backgroundColor: "#f48221" }}>
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Enviar ({recipients.length})
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Template + Fields + Recipients */}
        <div className="lg:col-span-1 space-y-4">
          {/* Template selector */}
          <div className="glass-panel rounded-xl p-4">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">
              Plantilla
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => { setSelectedTemplate(e.target.value as TemplateKey); setFieldValues({}); }}
              className="w-full h-10 rounded-lg bg-surface-container-low border border-outline-variant px-3 text-sm text-on-surface"
            >
              {templateMeta.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
            <p className="text-xs text-on-surface-variant mt-2">{activeMeta.desc}</p>
          </div>

          {/* Variable fields or Custom form */}
          <div className="glass-panel rounded-xl p-4 space-y-3">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block">
              {isCustom ? "Correo Personalizado" : "Variables"}
            </label>
            {isCustom ? (
              <>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Asunto</label>
                  <Input
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Asunto del correo..."
                    className="h-10 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Contenido</label>
                  <div className="rounded-lg border border-outline-variant overflow-hidden">
                    <div className="flex gap-1 p-2 border-b border-outline-variant/30 bg-surface-container-low">
                      <button
                        type="button"
                        onClick={() => document.execCommand("bold")}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-container-high text-sm font-bold"
                        title="Negrita"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => document.execCommand("italic")}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-container-high text-sm italic"
                        title="Cursiva"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() => document.execCommand("underline")}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-container-high text-sm underline"
                        title="Subrayado"
                      >
                        U
                      </button>
                      <div className="w-px bg-outline-variant/30 mx-1" />
                      <button
                        type="button"
                        onClick={() => document.execCommand("insertUnorderedList")}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-container-high text-sm"
                        title="Lista"
                      >
                        •
                      </button>
                      <button
                        type="button"
                        onClick={() => document.execCommand("insertOrderedList")}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-container-high text-sm"
                        title="Lista numerada"
                      >
                        1.
                      </button>
                      <div className="w-px bg-outline-variant/30 mx-1" />
                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt("URL:");
                          if (url) document.execCommand("createLink", false, url);
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-container-high text-sm"
                        title="Enlace"
                      >
                        🔗
                      </button>
                    </div>
                    <div
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={(e) => setCustomBody(e.currentTarget.innerHTML)}
                      className="w-full min-h-[200px] rounded-b-lg bg-surface-container-low p-3 text-sm text-on-surface focus:outline-none"
                    />
                  </div>
                </div>
              </>
            ) : (
              activeMeta.fields.map((f) => (
                <div key={f.name}>
                  <label className="text-xs text-on-surface-variant mb-1 block">{f.label}</label>
                  <Input
                    value={fieldValues[f.name] || ""}
                    onChange={(e) => updateField(f.name, e.target.value)}
                    placeholder={f.placeholder}
                    className="h-10 text-sm"
                  />
                </div>
              ))
            )}
          </div>

          {/* Recipients */}
          <div className="glass-panel rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3 h-3" /> Destinatarios
              </label>
              <div className="flex gap-1">
                <button onClick={selectAll} className="text-xs text-primary hover:underline">Todos</button>
                <span className="text-xs text-on-surface-variant">|</span>
                <button onClick={clearAll} className="text-xs text-on-surface-variant hover:underline">Ninguno</button>
              </div>
            </div>

            {/* Role filter */}
            <div className="flex gap-1 flex-wrap">
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                    roleFilter === r ? "bg-primary text-white" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {r === "ALL" ? "Todos" : r === "SETTER_JR" ? "Setter" : r === "PARTNER" ? "Partner" :
                   r === "SETTER" ? "Trainee" : r === "CLOSER" ? "Closer" : r}
                </button>
              ))}
            </div>

            {/* User list */}
            <div className="max-h-64 overflow-y-auto space-y-1 pr-2">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="text-xs text-on-surface-variant text-center py-4">Sin usuarios en este filtro</p>
              ) : (
                filteredUsers.map((u) => {
                  const isSelected = recipients.some((r) => r.id === u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => toggleRecipient(u)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                        isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-surface-container-low text-on-surface"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? "bg-primary border-primary" : "border-outline-variant"
                      }`}>
                        {isSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm">{u.name || "Sin nombre"}</div>
                        <div className="text-xs text-on-surface-variant truncate">{u.email}</div>
                      </div>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant flex-shrink-0">
                        {u.role === "SETTER_JR" ? "Setter" : u.role === "SETTER" ? "Trainee" : u.role === "PARTNER" ? "Partner" : u.role}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Preview */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
              <Eye className="w-3 h-3" /> Vista Previa
            </label>
            <button onClick={() => setFieldValues({})} className="text-xs text-on-surface-variant hover:text-primary flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>
          <div className="glass-panel rounded-xl overflow-hidden border border-outline-variant">
            <div className="bg-surface-container-low px-4 py-2 border-b border-outline-variant flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-xs text-on-surface-variant ml-2">
                {activeMeta.label} — Vista previa del email
              </span>
            </div>
            <iframe
              srcDoc={previewHtml}
              className="w-full h-[60vh] border-0"
              title="Email preview"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
