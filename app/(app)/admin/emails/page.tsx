"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import {
  Send,
  Paperclip,
  X,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const MAX_FILE_SIZE_MB = 5;
const MAX_TOTAL_SIZE_MB = 10;
const MAX_FILES = 5;

interface AttachedFile {
  name: string;
  size: number;
  base64: string;
  type: string;
}

const EMAIL_HEADER = `<table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:2px solid #e0e0e0;padding-bottom:20px;margin-bottom:20px;">
  <tr>
    <td style="vertical-align:middle;width:90px;">
      <div style="text-align:center;line-height:1;">
        <div style="display:inline-block;width:50px;height:50px;border-radius:50%;border:4px solid #1d1d1b;text-align:center;line-height:46px;font-size:32px;font-weight:900;font-family:Arial,sans-serif;color:#1d1d1b;">S</div>
        <div style="font-size:24px;font-weight:900;color:#f48221;font-family:Arial,sans-serif;letter-spacing:1px;margin-top:5px;">ONE</div>
        <div style="font-size:9px;font-weight:900;color:#1d1d1b;font-family:Arial,sans-serif;letter-spacing:2px;margin-top:2px;">SOLUTIONS</div>
      </div>
    </td>
    <td style="vertical-align:middle;text-align:right;font-size:13px;color:#555;">
      <strong style="color:#1d1d1b;font-size:15px;display:block;margin-bottom:5px;">ONE SOLUTIONS COMPANIES LLC</strong>
      2419 Lake Orange Dr<br>
      Suite 120<br>
      Orlando, Florida 32837
    </td>
  </tr>
</table><br><br>`;

export default function AdminEmailsPage() {
  const editorRef = useRef<HTMLDivElement>(null);

  const [to, setTo] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [cc, setCc] = useState("");
  const [showBcc, setShowBcc] = useState(false);
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [sending, setSending] = useState(false);

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  const execCmd = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML.trim()) {
      editorRef.current.innerHTML = EMAIL_HEADER;
    }
  }, []);

  const handleInsertLink = () => {
    const url = prompt("Ingresa la URL:");
    if (url) execCmd("createLink", url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const fileEntries: { file: File; name: string; size: number; type: string }[] = [];
    let sizeError = false;
    let countError = false;
    let runningTotal = totalSize;

    for (let i = 0; i < selectedFiles.length; i++) {
      const f = selectedFiles[i];
      if (files.length + fileEntries.length >= MAX_FILES) {
        countError = true;
        break;
      }
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        sizeError = true;
        continue;
      }
      if (runningTotal + f.size > MAX_TOTAL_SIZE_MB * 1024 * 1024) {
        sizeError = true;
        continue;
      }
      runningTotal += f.size;
      fileEntries.push({ file: f, name: f.name, size: f.size, type: f.type });
    }

    if (countError) toast.error(`Máximo ${MAX_FILES} archivos`);
    if (sizeError) toast.error(`Máximo ${MAX_FILE_SIZE_MB}MB por archivo, ${MAX_TOTAL_SIZE_MB}MB total`);

    const promises = fileEntries.map(
      (entry) =>
        new Promise<AttachedFile>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve({
              name: entry.name,
              size: entry.size,
              base64: result.split(",")[1] || "",
              type: entry.type,
            });
          };
          reader.readAsDataURL(entry.file);
        })
    );

    Promise.all(promises).then((newFiles) => {
      setFiles((prev) => [...prev, ...newFiles]);
    });

    e.target.value = "";
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const handleSend = async () => {
    const toList = to
      .split(/[,;\n]+/)
      .map((e) => e.trim())
      .filter(Boolean);
    if (toList.length === 0) {
      toast.error("Ingresa al menos un destinatario");
      return;
    }
    if (!subject.trim()) {
      if (!confirm("¿Enviar sin asunto?")) return;
    }

    const htmlBody =
      editorRef.current?.innerHTML || "";

    const attachments = files
      .filter((f) => f.base64)
      .map((f) => ({
        filename: f.name,
        content: f.base64,
        contentType: f.type,
      }));

    setSending(true);
    let sent = 0;
    let failed = 0;

    for (const recipient of toList) {
      try {
        const res = await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: recipient,
            subject: subject.trim() || "(sin asunto)",
            html: htmlBody,
            attachments,
          }),
        });
        if (res.ok) sent++;
        else failed++;
      } catch {
        failed++;
      }
    }

    setSending(false);
    if (failed === 0) {
      toast.success(`Correo enviado a ${sent} destinatario(s)`);
      setTo("");
      setSubject("");
      if (editorRef.current) editorRef.current.innerHTML = EMAIL_HEADER;
      setFiles([]);
    } else {
      toast.error(`${sent} enviado(s), ${failed} fallido(s)`);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-on-surface mb-6">Redactar Correo</h1>

      <div className="glass-panel rounded-2xl overflow-hidden">
        {/* From */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-outline-variant/30">
          <span className="text-sm font-medium text-on-surface-variant w-16 shrink-0">De</span>
          <span className="text-sm text-on-surface">service@onesolutions.com</span>
        </div>

        {/* To */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-outline-variant/30">
          <span className="text-sm font-medium text-on-surface-variant w-16 shrink-0">Para</span>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="email1@ejemplo.com, email2@ejemplo.com"
            className="flex-1 outline-none text-sm bg-transparent text-on-surface placeholder:text-on-surface-variant/50"
          />
          <div className="flex gap-1 shrink-0">
            {!showCc && (
              <button onClick={() => setShowCc(true)} className="text-xs text-primary hover:underline px-1">
                CC
              </button>
            )}
            {!showBcc && (
              <button onClick={() => setShowBcc(true)} className="text-xs text-primary hover:underline px-1">
                CCO
              </button>
            )}
          </div>
        </div>

        {/* CC */}
        {showCc && (
          <div className="flex items-center gap-3 px-4 py-2 border-b border-outline-variant/30">
            <span className="text-sm font-medium text-on-surface-variant w-16 shrink-0">CC</span>
            <input
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="email@ejemplo.com"
              className="flex-1 outline-none text-sm bg-transparent text-on-surface placeholder:text-on-surface-variant/50"
            />
            <button onClick={() => { setShowCc(false); setCc(""); }} className="text-on-surface-variant hover:text-on-surface">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* BCC */}
        {showBcc && (
          <div className="flex items-center gap-3 px-4 py-2 border-b border-outline-variant/30">
            <span className="text-sm font-medium text-on-surface-variant w-16 shrink-0">CCO</span>
            <input
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              placeholder="email@ejemplo.com"
              className="flex-1 outline-none text-sm bg-transparent text-on-surface placeholder:text-on-surface-variant/50"
            />
            <button onClick={() => { setShowBcc(false); setBcc(""); }} className="text-on-surface-variant hover:text-on-surface">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Subject */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-outline-variant/30">
          <span className="text-sm font-medium text-on-surface-variant w-16 shrink-0">Asunto</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Asunto del correo"
            className="flex-1 outline-none text-sm bg-transparent text-on-surface placeholder:text-on-surface-variant/50"
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-0.5 px-2 py-1 border-b border-outline-variant/20 bg-surface-container-low overflow-x-auto">
          <button onClick={() => execCmd("bold")} className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface" title="Negrita">
            <Bold className="w-4 h-4" />
          </button>
          <button onClick={() => execCmd("italic")} className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface" title="Cursiva">
            <Italic className="w-4 h-4" />
          </button>
          <button onClick={() => execCmd("underline")} className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface" title="Subrayado">
            <Underline className="w-4 h-4" />
          </button>
          <span className="w-px h-5 bg-outline-variant/40 mx-1" />
          <button onClick={() => execCmd("insertUnorderedList")} className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface" title="Lista">
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => execCmd("insertOrderedList")} className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface" title="Lista numerada">
            <ListOrdered className="w-4 h-4" />
          </button>
          <span className="w-px h-5 bg-outline-variant/40 mx-1" />
          <button onClick={handleInsertLink} className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface" title="Insertar enlace">
            <Link className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="min-h-[300px] p-4 outline-none text-sm text-on-surface bg-transparent"
          data-placeholder="Escribe tu correo aquí..."
          style={{
            minHeight: "300px",
          }}
          onKeyDown={(e) => {
            if (e.key === "Tab") {
              e.preventDefault();
              execCmd("indent");
            }
          }}
        />

        {/* Attachments */}
        {files.length > 0 && (
          <div className="px-4 py-2 border-t border-outline-variant/20 space-y-1">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-on-surface-variant">
                <Paperclip className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1 truncate">{f.name}</span>
                <span className="text-xs text-on-surface-variant/60 shrink-0">{formatSize(f.size)}</span>
                <button onClick={() => removeFile(i)} className="text-on-surface-variant hover:text-error shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <div className="text-xs text-on-surface-variant/50">
              {formatSize(totalSize)} / {MAX_TOTAL_SIZE_MB} MB
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant/30 bg-surface-container-low">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface cursor-pointer text-sm transition-colors">
              <Paperclip className="w-4 h-4" />
              Adjuntar
              <input type="file" multiple className="hidden" onChange={handleFileSelect} />
            </label>
            <span className="text-xs text-on-surface-variant/50">
              Max {MAX_FILES} archivos · {MAX_FILE_SIZE_MB}MB c/u · {MAX_TOTAL_SIZE_MB}MB total
            </span>
          </div>
          <Button onClick={handleSend} disabled={sending} className="gap-2 px-6">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
