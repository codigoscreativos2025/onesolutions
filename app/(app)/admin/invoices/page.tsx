"use client";

import { useLocale } from "@/lib/locale-context";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Trash2, FileDown, Eye, Send, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { toast } from "sonner";

interface Item {
  id: number;
  description: string;
  detail: string;
  quantity: number;
  unitPrice: number;
  isDiscount: boolean;
}

interface FrequentContact {
  id: number;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

interface GeneratedInvoice {
  id: number;
  invoiceNum: string;
  date: string;
  billToName: string;
  billToEmail: string | null;
  total: number;
  paid: number;
  balance: number;
  html: string;
  createdAt: string;
}

export default function AdminInvoicesPage() {
  const { t } = useLocale();

  const { data: session } = useSession();
  const previewRef = useRef<HTMLDivElement>(null);

  const [invoiceNum, setInvoiceNum] = useState("INV0026");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("On receipt");
  const [billToName, setBillToName] = useState("");
  const [billToPhone, setBillToPhone] = useState("");
  const [billToEmail, setBillToEmail] = useState("");
  const [billToAddress, setBillToAddress] = useState("");
  const [fromName, setFromName] = useState("One Solutions Companies LLC");
  const [fromPhone, setFromPhone] = useState("(407) 785-4304");
  const [fromEmail, setFromEmail] = useState("payments@onesolutionscompanies.com");
  const [fromAddress, setFromAddress] = useState("2419 Lake Orange Dr Suite 5, Orlando FL 32837");
  const [paid, setPaid] = useState(0);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [sendToEmail, setSendToEmail] = useState("");
  const [items, setItems] = useState<Item[]>([
    { id: 1, description: "Servicio de instalacion", detail: "Incluye materiales y mano de obra", quantity: 1, unitPrice: 0, isDiscount: false },
  ]);

  const [contacts, setContacts] = useState<FrequentContact[]>([]);
  const [showContactsManager, setShowContactsManager] = useState(false);

  const [editingContactId, setEditingContactId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const [newName, setNewName] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAddress, setNewAddress] = useState("");

  const [invoices, setInvoices] = useState<GeneratedInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [viewInvoiceHtml, setViewInvoiceHtml] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const [showStats, setShowStats] = useState(false);

  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterNum, setFilterNum] = useState("");
  const [filterBillTo, setFilterBillTo] = useState("");

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const invDate = new Date(inv.date);
      let matchDate = true;
      if (filterDateFrom) {
        matchDate = matchDate && invDate >= new Date(filterDateFrom);
      }
      if (filterDateTo) {
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59, 999);
        matchDate = matchDate && invDate <= toDate;
      }
      
      const matchNum = filterNum ? inv.invoiceNum.toLowerCase().includes(filterNum.toLowerCase()) : true;
      const matchBillTo = filterBillTo ? inv.billToName.toLowerCase().includes(filterBillTo.toLowerCase()) : true;
      return matchDate && matchNum && matchBillTo;
    });
  }, [invoices, filterDateFrom, filterDateTo, filterNum, filterBillTo]);

  const totalHistorial = filteredInvoices.reduce((acc, inv) => acc + inv.total, 0);
  const totalPagado = filteredInvoices.reduce((acc, inv) => acc + inv.paid, 0);
  const totalBalance = filteredInvoices.reduce((acc, inv) => acc + inv.balance, 0);

  useEffect(() => {
    fetch("/api/admin/frequent-contacts")
      .then((r) => r.json())
      .then((data) => setContacts(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const res = await fetch("/api/invoices");
      setInvoices(await res.json());
    } catch {
      toast.error("Error al cargar historial de facturas");
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleExportExcel = () => {
    const headers = ["Nro Factura", "Fecha", "Facturar A", "Total", "Pagado", "Balance"];
    const rows = filteredInvoices.map(inv => {
      const d = new Date(inv.date);
      const formattedDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
      return [
        inv.invoiceNum,
        formattedDate,
        `"${inv.billToName.replace(/"/g, '""')}"`,
        inv.total.toFixed(2),
        inv.paid.toFixed(2),
        inv.balance.toFixed(2)
      ];
    });
    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "historial_facturas.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchContacts = async () => {
    try {
      const res = await fetch("/api/admin/frequent-contacts");
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch {}
  };

  const handleCreateContact = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch("/api/admin/frequent-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          company: newCompany.trim() || null,
          phone: newPhone.trim() || null,
          email: newEmail.trim() || null,
          address: newAddress.trim() || null,
        }),
      });
      if (res.ok) {
        toast.success("Contacto creado");
        setNewName("");
        setNewCompany("");
        setNewPhone("");
        setNewEmail("");
        setNewAddress("");
        fetchContacts();
      } else {
        toast.error("Error al crear contacto");
      }
    } catch {
      toast.error("Error al crear contacto");
    }
  };

  const handleUpdateContact = async (id: number) => {
    if (!editName.trim()) return;
    try {
      const res = await fetch(`/api/admin/frequent-contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          company: editCompany.trim() || null,
          phone: editPhone.trim() || null,
          email: editEmail.trim() || null,
          address: editAddress.trim() || null,
        }),
      });
      if (res.ok) {
        toast.success("Contacto actualizado");
        setEditingContactId(null);
        fetchContacts();
      } else {
        toast.error("Error al actualizar contacto");
      }
    } catch {
      toast.error("Error al actualizar contacto");
    }
  };

  const handleDeleteContact = async (id: number) => {
    if (!confirm("¿Eliminar este contacto?")) return;
    try {
      const res = await fetch(`/api/admin/frequent-contacts/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Contacto eliminado");
        fetchContacts();
      } else {
        toast.error("Error al eliminar contacto");
      }
    } catch {
      toast.error("Error al eliminar contacto");
    }
  };

  const startEditContact = (c: FrequentContact) => {
    setEditingContactId(c.id);
    setEditName(c.name);
    setEditCompany(c.company || "");
    setEditPhone(c.phone || "");
    setEditEmail(c.email || "");
    setEditAddress(c.address || "");
  };

  const addItem = () => {
    setItems([...items, { id: Date.now(), description: "", detail: "", quantity: 1, unitPrice: 0, isDiscount: false }]);
  };

  const removeItem = (id: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (id: number, field: keyof Item, value: string | number | boolean) => {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const subtotal = items.reduce((sum, i) => sum + (i.isDiscount ? 0 : i.quantity * i.unitPrice), 0);
  const discounts = items.filter((i) => i.isDiscount).reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const total = subtotal - discounts;
  const balance = total - paid;

  const getPreviewHtml = useCallback(() => {
    if (!previewRef.current) return "";
    return previewRef.current.outerHTML;
  }, []);

  const saveInvoiceToHistory = async () => {
    if (!billToName) return;
    try {
      await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNum,
          date,
          billToName,
          billToEmail: billToEmail || null,
          billToAddress: billToAddress || null,
          total,
          paid,
          balance,
          html: getPreviewHtml(),
        }),
      });
    } catch {
    }
  };

  const resetForm = () => {
    // Attempt to increment invoice number if possible
    let nextInvNum = "INV0001";
    const numMatch = invoiceNum.match(/^(\D+)(\d+)$/);
    if (numMatch) {
      const prefix = numMatch[1];
      const num = parseInt(numMatch[2], 10) + 1;
      nextInvNum = `${prefix}${num.toString().padStart(numMatch[2].length, "0")}`;
    } else {
      nextInvNum = "";
    }

    setInvoiceNum(nextInvNum);
    setDate(new Date().toISOString().split("T")[0]);
    setDueDate("On receipt");
    setBillToName("");
    setBillToPhone("");
    setBillToEmail("");
    setBillToAddress("");
    setPaid(0);
    setItems([{ id: Date.now(), description: "", detail: "", quantity: 1, unitPrice: 0, isDiscount: false }]);
  };

  const downloadPDF = async () => {
    if (!previewRef.current) return;
    const { default: jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(previewRef.current, { scale: 1.5, backgroundColor: "#ffffff" });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(img, "PNG", 0, 0, w, h);
    pdf.save(`Invoice_${invoiceNum}.pdf`);
  };

  const handleGenerarFactura = async () => {
    if (!billToName.trim() || !invoiceNum.trim()) {
      toast.error("Complete los datos requeridos (Nro Factura y Cliente)");
      return;
    }
    await saveInvoiceToHistory();
    fetchInvoices();
    toast.success("Factura generada y guardada exitosamente");
    resetForm();
  };

  const generatePdfFromHtml = async (htmlContent: string) => {
    const { default: jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas");
    
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "-9999px";
    container.style.width = "800px";
    container.style.backgroundColor = "white";
    container.innerHTML = htmlContent;
    document.body.appendChild(container);
    
    try {
      await new Promise(r => setTimeout(r, 100)); // allow rendering
      const canvas = await html2canvas(container, { scale: 1.5, backgroundColor: "#ffffff" });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(img, "PNG", 0, 0, w, h);
      return { pdf, base64: pdf.output("datauristring").split(",")[1] };
    } finally {
      document.body.removeChild(container);
    }
  };

  const downloadHistoryPDF = async (inv: GeneratedInvoice) => {
    toast.info("Generando PDF...");
    try {
      const { pdf } = await generatePdfFromHtml(inv.html);
      pdf.save(`Invoice_${inv.invoiceNum}.pdf`);
    } catch {
      toast.error("Error al generar PDF");
    }
  };

  const sendHistoryEmail = async (inv: GeneratedInvoice) => {
    const email = prompt("Email destinatario:", inv.billToEmail || "");
    if (!email) return;

    toast.info("Enviando email...");
    try {
      const { base64 } = await generatePdfFromHtml(inv.html);
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject: `Factura ${inv.invoiceNum}`,
          html: `<p>Adjunto encontrara la factura ${inv.invoiceNum}.</p>`,
          pdfBase64: base64,
          pdfFilename: `Factura_${inv.invoiceNum}.pdf`,
        }),
      });
      if (res.ok) {
        toast.success("Factura enviada exitosamente");
      } else {
        toast.error("Error al enviar el email");
      }
    } catch {
      toast.error("Error al enviar el email");
    }
  };

  const generatePdfBase64 = async (): Promise<string> => {
    if (!previewRef.current) throw new Error("No preview");
    const { default: jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(previewRef.current, { scale: 1.5, backgroundColor: "#ffffff" });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(img, "PNG", 0, 0, w, h);
    return pdf.output("datauristring").split(",")[1];
  };

  const handleSendEmail = async () => {
    const email = sendToEmail || billToEmail;
    if (!email) {
      toast.error("Ingresa un email para enviar");
      return;
    }
    setSendingEmail(true);
    try {
      const pdfBase64 = await generatePdfBase64();
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject: `Factura ${invoiceNum}`,
          html: `<p>Adjunto encontrara la factura ${invoiceNum}.</p>`,
          pdfBase64,
          pdfFilename: `Factura_${invoiceNum}.pdf`,
        }),
      });
      if (res.ok) {
        toast.success("Factura enviada por email");
        setShowEmailInput(false);
        await saveInvoiceToHistory();
        fetchInvoices();
      } else {
        toast.error("Error al enviar el email");
      }
    } catch {
      toast.error("Error al enviar el email");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleViewInvoice = async (id: number) => {
    try {
      const res = await fetch(`/api/invoices/${id}`);
      const data = await res.json();
      if (data.html) {
        setViewInvoiceHtml(data.html);
        setShowViewModal(true);
      }
    } catch {
      toast.error("Error al cargar la factura");
    }
  };

  const handleDeleteInvoice = async (id: number) => {
    if (!confirm("¿Eliminar esta factura del historial?")) return;
    const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Factura eliminada");
      fetchInvoices();
    } else {
      toast.error("Error al eliminar");
    }
  };

  const stats = useMemo(() => {
    const totalInvoices = invoices.length;
    const totalBilled = invoices.reduce((s, i) => s + i.total, 0);
    const totalPaid = invoices.reduce((s, i) => s + i.paid, 0);

    const clientMap = new Map<string, { count: number; totalAmount: number }>();
    invoices.forEach((i) => {
      const existing = clientMap.get(i.billToName) || { count: 0, totalAmount: 0 };
      existing.count++;
      existing.totalAmount += i.total;
      clientMap.set(i.billToName, existing);
    });
    const topClients = Array.from(clientMap.entries())
      .sort((a, b) => b[1].totalAmount - a[1].totalAmount)
      .slice(0, 5);

    const now = new Date();
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    const weeklyData = invoices.filter((i) => new Date(i.date) >= fourWeeksAgo);
    const monthlyData = invoices.filter((i) => new Date(i.date) >= sixMonthsAgo);

    const weeklyGroups = new Map<string, number>();
    weeklyData.forEach((i) => {
      const d = new Date(i.date);
      const weekStart = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
      const key = weekStart.toISOString().split("T")[0];
      weeklyGroups.set(key, (weeklyGroups.get(key) || 0) + i.total);
    });

    const monthlyGroups = new Map<string, number>();
    monthlyData.forEach((i) => {
      const d = new Date(i.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyGroups.set(key, (monthlyGroups.get(key) || 0) + i.total);
    });

    return { totalInvoices, totalBilled, totalPaid, topClients, weeklyGroups, monthlyGroups };
  }, [invoices]);

  if (session?.user?.role !== "ADMIN") {
    return <div className="p-8 text-center">Acceso restringido a administradores.</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface"> {t.adminInvoices?.invoices || "Facturas / Invoices"} </h1>
          <p className="text-on-surface-variant">Genera facturas personalizadas y descargalas en PDF</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleGenerarFactura} className="gap-2 bg-primary text-on-primary">
            <Plus className="w-4 h-4" /> {t.adminInvoices?.generateInvoice || "Generar Factura"} </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* FORM */}
        <div className="space-y-4 glass-panel rounded-xl p-6 lg:w-[45%] lg:shrink-0">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Eye className="w-5 h-5" /> {t.adminInvoices?.invoiceData || "Datos de la Factura"} </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-on-surface-variant"> {t.adminInvoices?.invoiceNumber || "Nro Factura"} </label>
              <Input value={invoiceNum} onChange={(e) => setInvoiceNum(e.target.value)} className="h-10" />
            </div>
            <div>
              <label className="text-xs font-medium text-on-surface-variant"> {t.adminInvoices?.date || "Fecha"} </label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10" min="1900-01-01" max="2100-12-31" onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Fecha fuera de rango")} onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-on-surface-variant"> {t.adminInvoices?.dueDate || "Vencimiento"} </label>
              <Input value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-10" placeholder="On receipt" />
            </div>
            <div>
              <label className="text-xs font-medium text-on-surface-variant"> {t.adminInvoices?.paid || "Pagado ($)"} </label>
              <Input type="number" value={paid} onChange={(e) => setPaid(Number(e.target.value))} className="h-10" inputMode="decimal" step="0.01" min="0" />
            </div>
          </div>

          <div className="border-t border-outline-variant pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Facturar A (Bill To)</h3>
              <button
                onClick={() => setShowContactsManager(!showContactsManager)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                {showContactsManager ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                Contactos
              </button>
            </div>

            {showContactsManager && (
              <div className="space-y-3 border border-outline-variant rounded-xl p-4 mb-3">
                {contacts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-on-surface-variant">Seleccionar o editar</h4>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {contacts.map((c) =>
                        editingContactId === c.id ? (
                          <div key={c.id} className="space-y-1.5 p-2 rounded-lg bg-surface-container-low border border-outline-variant">
                            <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nombre" className="w-full h-8 px-2 text-xs rounded border border-outline-variant bg-surface-container-low" />
                            <input value={editCompany} onChange={(e) => setEditCompany(e.target.value)} placeholder="Empresa" className="w-full h-8 px-2 text-xs rounded border border-outline-variant bg-surface-container-low" />
                            <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder={t.adminInvoices?.phone || "Telefono"} className="w-full h-8 px-2 text-xs rounded border border-outline-variant bg-surface-container-low" />
                            <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder={t.adminInvoices?.email || "Email"} className="w-full h-8 px-2 text-xs rounded border border-outline-variant bg-surface-container-low" />
                            <input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder={t.adminInvoices?.address || "Direccion"} className="w-full h-8 px-2 text-xs rounded border border-outline-variant bg-surface-container-low" />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleUpdateContact(c.id)}>Guardar</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingContactId(null)}>Cancelar</Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            key={c.id}
                            onClick={() => {
                              setBillToName(c.name);
                              if (c.phone) setBillToPhone(c.phone);
                              if (c.email) setBillToEmail(c.email);
                              if (c.address) setBillToAddress(c.address);
                            }}
                            className="w-full flex items-center justify-between p-2 rounded-lg bg-surface-container-low border border-outline-variant hover:bg-surface-container-high text-left"
                          >
                            <div className="text-xs space-y-0.5 min-w-0">
                              <p className="font-medium truncate">{c.name}{c.company ? ` — ${c.company}` : ""}</p>
                              <p className="text-on-surface-variant truncate">{c.phone || "-"} | {c.email || "-"}</p>
                            </div>
                            <div className="flex gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                              <Button size="sm" variant="outline" onClick={() => startEditContact(c)}>
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDeleteContact(c.id)} className="text-red-500 border-red-200 hover:bg-red-50">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

                <div className="border-t border-outline-variant pt-3 space-y-2">
                  <h4 className="text-xs font-semibold text-on-surface-variant">Nuevo Contacto</h4>
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre *" className="w-full h-9 px-3 text-sm rounded-lg border border-outline-variant bg-surface-container-low" />
                  <input value={newCompany} onChange={(e) => setNewCompany(e.target.value)} placeholder="Empresa" className="w-full h-9 px-3 text-sm rounded-lg border border-outline-variant bg-surface-container-low" />
                  <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder={t.adminInvoices?.phone || "Telefono"} className="w-full h-9 px-3 text-sm rounded-lg border border-outline-variant bg-surface-container-low" />
                  <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder={t.adminInvoices?.email || "Email"} className="w-full h-9 px-3 text-sm rounded-lg border border-outline-variant bg-surface-container-low" />
                  <input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder={t.adminInvoices?.address || "Direccion"} className="w-full h-9 px-3 text-sm rounded-lg border border-outline-variant bg-surface-container-low" />
                  <Button onClick={handleCreateContact} size="sm" className="w-full" disabled={!newName.trim()}>
                    Guardar Contacto
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Input value={billToName} onChange={(e) => setBillToName(e.target.value)} placeholder={t.adminInvoices?.nameCompany || "Nombre / Empresa"} />
              <Input value={billToPhone} onChange={(e) => setBillToPhone(e.target.value)} placeholder={t.adminInvoices?.phone || "Telefono"} inputMode="tel" pattern="[0-9\-\+\(\) ]*" />
              <Input value={billToEmail} onChange={(e) => setBillToEmail(e.target.value)} placeholder={t.adminInvoices?.email || "Email"} type="email" />
              <Input value={billToAddress} onChange={(e) => setBillToAddress(e.target.value)} placeholder={t.adminInvoices?.address || "Direccion"} />
            </div>
          </div>

          <div className="border-t border-outline-variant pt-4">
            <h3 className="text-sm font-semibold mb-2">Desde (Invoice From)</h3>
            <div className="space-y-2">
              <Input value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="Nombre" />
              <Input value={fromPhone} onChange={(e) => setFromPhone(e.target.value)} placeholder={t.adminInvoices?.phone || "Telefono"} inputMode="tel" pattern="[0-9\-\+\(\) ]*" />
              <Input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} placeholder={t.adminInvoices?.email || "Email"} type="email" />
              <Input value={fromAddress} onChange={(e) => setFromAddress(e.target.value)} placeholder={t.adminInvoices?.address || "Direccion"} />
            </div>
          </div>

          <div className="border-t border-outline-variant pt-4">
            <h3 className="text-sm font-semibold mb-2">Items</h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="glass-panel rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(item.id, "description", e.target.value)}
                      placeholder="Descripcion del item"
                      className="flex-1 h-9 text-sm"
                      maxLength={200}
                    />
                    <Input
                      value={item.detail}
                      onChange={(e) => updateItem(item.id, "detail", e.target.value)}
                      placeholder="Detalle extra"
                      className="flex-1 h-9 text-sm"
                      maxLength={200}
                    />
                    <button onClick={() => removeItem(item.id)} className="p-2 text-error hover:bg-error/10 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs w-16">Cant:</label>
                    <Input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", Math.max(1, Number(e.target.value)))} className="w-20 h-9 text-sm" inputMode="numeric" min="1" />
                    <label className="text-xs w-16">Precio:</label>
                    <Input type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value))} className="w-28 h-9 text-sm" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" min="0" step="0.01" />
                    <label className="text-xs">Total: ${(item.quantity * item.unitPrice).toFixed(2)}</label>
                    <button
                      onClick={() => updateItem(item.id, "isDiscount", !item.isDiscount)}
                      className={`px-2 py-1 rounded text-xs font-medium ${item.isDiscount ? "bg-error/20 text-error" : "bg-surface-container-highest text-on-surface-variant"}`}
                    >
                      {item.isDiscount ? "Descuento" : "Normal"}
                    </button>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addItem} className="w-full gap-2">
                <Plus className="w-4 h-4" /> {t.adminInvoices?.addBtn || "Agregar Item"} </Button>
            </div>
          </div>
        </div>

        {/* PREVIEW */}
        <div className="flex-1 lg:min-w-0 max-h-[90vh] sticky top-4">
          <div ref={previewRef} className="bg-white shadow-lg" style={{ fontFamily: "Arial, sans-serif", minWidth: "400px" }}>
            <div style={{ display: "flex", minHeight: 160 }}>
              <div style={{ backgroundColor: "#ffffff", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                <svg viewBox="0 0 300 400" style={{ width: "100px", height: "auto" }}>
                  <polygon points="30,100 150,30 270,100 270,120 150,50 30,120" fill="#f48221"/>
                  <polygon points="210,115 235,95 255,115 230,135" fill="#1d1d1b"/>
                  <circle cx="150" cy="180" r="65" fill="none" stroke="#1d1d1b" strokeWidth="18"/>
                  <text x="150" y="228" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="130" textAnchor="middle" fill="#1d1d1b">S</text>
                  <g fill="#f48221">
                    <text x="150" y="325" fontFamily="'Arial Black', Impact, sans-serif" fontWeight="900" fontSize="95" textAnchor="middle" letterSpacing="1">ONE</text>
                    <rect x="73" y="240" width="6" height="90" fill="#ffffff"/>
                    <rect x="135" y="240" width="6" height="90" fill="#ffffff" transform="skewX(-25)"/>
                    <rect x="228" y="240" width="8" height="90" fill="#ffffff"/>
                  </g>
                  <text x="150" y="375" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="36" textAnchor="middle" fill="#000000" letterSpacing="2">SOLUTIONS</text>
                </svg>
              </div>
              <div style={{ backgroundColor: "#dfe26a", color: "white", flex: 1, textAlign: "right", display: "flex", flexDirection: "column", justifyContent: "center", paddingRight: 50 }}>
                <h1 style={{ margin: 0, fontSize: 28, textTransform: "uppercase", fontWeight: "bold", letterSpacing: 1 }}>Invoice</h1>
                <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.9)" }}>
                  Number: {invoiceNum}<br />Date: {new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}<br />Due date: {dueDate}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", padding: 25, gap: 30 }}>
              <div style={{ flex: 1, fontSize: 13, color: "#777", lineHeight: 1.6 }}>
                <div style={{ color: "#f19e38", fontSize: 11, fontWeight: "bold", textTransform: "uppercase", marginBottom: 12 }}>BILL TO:</div>
                {billToName && <div style={{ fontWeight: "bold", color: "#222", fontSize: 14, marginBottom: 5 }}>{billToName}</div>}
                {billToPhone && <div>{billToPhone}</div>}
                {billToEmail && <div>{billToEmail}</div>}
                {billToAddress && <div>{billToAddress}</div>}
                {!billToName && <div style={{ color: "#ccc", fontStyle: "italic" }}>Nombre del cliente...</div>}
              </div>
              <div style={{ flex: 1, fontSize: 13, color: "#777", lineHeight: 1.6 }}>
                <div style={{ color: "#f19e38", fontSize: 11, fontWeight: "bold", textTransform: "uppercase", marginBottom: 12 }}>INVOICE FROM:</div>
                <div style={{ fontWeight: "bold", color: "#222", fontSize: 14, marginBottom: 5 }}>{fromName}</div>
                <div>{fromPhone}</div>
                <div>{fromEmail}</div>
                <div>{fromAddress}</div>
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ backgroundColor: "#f19e38", color: "white", textAlign: "left", padding: "12px 20px", fontSize: 13, fontWeight: "bold" }}>Description</th>
                  <th style={{ backgroundColor: "#eec15b", color: "white", textAlign: "right", padding: "12px 20px", fontSize: 13, fontWeight: "bold" }}>Quantity</th>
                  <th style={{ backgroundColor: "#eec15b", color: "white", textAlign: "right", padding: "12px 20px", fontSize: 13, fontWeight: "bold" }}>Unit price</th>
                  <th style={{ backgroundColor: "#eec15b", color: "white", textAlign: "right", padding: "12px 20px", fontSize: 13, fontWeight: "bold" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ padding: "12px 20px", fontSize: 13, color: "#444", borderBottom: "1px solid #f0f0f0", verticalAlign: "top", fontStyle: item.isDiscount ? "italic" : "normal" }}>
                      <div style={{ fontWeight: "bold", color: "#222", fontSize: 13 }}>{item.description || "Sin descripcion"} {item.isDiscount && "(Descuento)"}</div>
                      {item.detail && <div style={{ color: "#999", fontSize: 12, marginTop: 8 }}>{item.detail}</div>}
                    </td>
                    <td style={{ padding: "12px 20px", fontSize: 13, color: "#444", borderBottom: "1px solid #f0f0f0", textAlign: "right", verticalAlign: "top" }}>{item.quantity}</td>
                    <td style={{ padding: "12px 20px", fontSize: 13, color: "#444", borderBottom: "1px solid #f0f0f0", textAlign: "right", verticalAlign: "top" }}>${item.unitPrice.toFixed(2)}</td>
                    <td style={{ padding: "12px 20px", fontSize: 13, color: item.isDiscount ? "#c00" : "#444", borderBottom: "1px solid #f0f0f0", textAlign: "right", verticalAlign: "top" }}>
                      {item.isDiscount ? "-" : ""}${(item.quantity * item.unitPrice).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: 40, textAlign: "center", color: "#ccc" }}>Agrega items a la factura</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div style={{ display: "flex", justifyContent: "flex-end", padding: "30px 50px 0" }}>
              <table style={{ width: 280, fontSize: 13 }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "10px 15px", border: "none", fontWeight: "bold", textAlign: "left" }}>SUBTOTAL:</td>
                    <td style={{ padding: "10px 15px", border: "none", textAlign: "right", color: "#333" }}>${subtotal.toFixed(2)}</td>
                  </tr>
                  {discounts > 0 && (
                    <tr>
                      <td style={{ padding: "10px 15px", border: "none", fontWeight: "bold", textAlign: "left", color: "#c00" }}>DESCUENTOS:</td>
                      <td style={{ padding: "10px 15px", border: "none", textAlign: "right", color: "#c00" }}>-${discounts.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ padding: "10px 15px", border: "none", fontWeight: "bold", textAlign: "left" }}>TOTAL:</td>
                    <td style={{ padding: "10px 15px", border: "none", textAlign: "right", color: "#333" }}>${total.toFixed(2)}</td>
                  </tr>
                  {paid > 0 && (
                    <tr>
                      <td style={{ padding: "10px 15px", border: "none", fontWeight: "bold", textAlign: "left" }}>PAID:</td>
                      <td style={{ padding: "10px 15px", border: "none", textAlign: "right", color: "#333" }}>${paid.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr style={{ backgroundColor: "#444" }}>
                    <td style={{ padding: "15px", border: "none", fontWeight: "bold", textAlign: "left", color: "white", fontSize: 14 }}>BALANCE DUE</td>
                    <td style={{ padding: "15px", border: "none", textAlign: "right", color: "white", fontWeight: "bold", fontSize: 14 }}>${balance.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice History */}
      <div className="glass-panel rounded-2xl p-6 border-outline-variant">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 className="font-headline text-lg font-bold text-on-surface"> {t.adminInvoices?.history || "Historial de Facturas"} </h2>
          <Button onClick={handleExportExcel} variant="outline" className="flex items-center gap-2 bg-surface-container-high border-outline-variant hover:bg-surface-variant">
            <FileDown className="w-4 h-4" /> {t.adminInvoices?.exportExcel || "Exportar Excel"} </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 flex gap-2">
            <Input 
              type="date"
              placeholder="Desde..." 
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full text-sm"
            />
            <Input 
              type="date"
              placeholder="Hasta..." 
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full text-sm"
            />
          </div>
          <Input 
            placeholder={t.adminInvoices?.filterNumber || "Filtrar por Nro Factura..."} 
            value={filterNum}
            onChange={(e) => setFilterNum(e.target.value)}
            className="flex-1"
          />
          <Input 
            placeholder={t.adminInvoices?.filterBillTo || "Filtrar por Facturar A..."} 
            value={filterBillTo}
            onChange={(e) => setFilterBillTo(e.target.value)}
            className="flex-1"
          />
        </div>

        {loadingInvoices ? (
          <p className="text-center py-8 text-on-surface-variant">Cargando...</p>
        ) : invoices.length === 0 ? (
          <p className="text-center py-8 text-on-surface-variant">
            No hay facturas generadas. Descarga una factura para verla aqui.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="text-left py-2 px-3 font-semibold">Nro Factura</th>
                  <th className="text-left py-2 px-3 font-semibold">Fecha</th>
                  <th className="text-left py-2 px-3 font-semibold">Facturar A</th>
                  <th className="text-right py-2 px-3 font-semibold"> {t.adminInvoices?.total || "Total"} </th>
                  <th className="text-right py-2 px-3 font-semibold">Pagado</th>
                  <th className="text-right py-2 px-3 font-semibold"> {t.adminInvoices?.balance || "Balance"} </th>
                  <th className="text-center py-2 px-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-outline-variant/50 hover:bg-surface-container-low">
                    <td className="py-2 px-3 font-medium">{inv.invoiceNum}</td>
                    <td className="py-2 px-3 text-on-surface-variant">{new Date(inv.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td className="py-2 px-3">{inv.billToName}</td>
                    <td className="py-2 px-3 text-right">${inv.total.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right">${inv.paid.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-medium">${inv.balance.toFixed(2)}</td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => downloadHistoryPDF(inv)}
                          className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors"
                          title="Descargar PDF"
                        >
                          <FileDown className="w-4 h-4 text-green-600" />
                        </button>
                        <button
                          onClick={() => sendHistoryEmail(inv)}
                          className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors"
                          title="Enviar PDF"
                        >
                          <Send className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleViewInvoice(inv.id)}
                          className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors"
                          title="Ver"
                        >
                          <Eye className="w-4 h-4 text-on-surface-variant" />
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="p-1.5 rounded-lg hover:bg-error-container transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-error" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredInvoices.length > 0 && (
                  <tr className="border-t-2 border-outline-variant font-bold bg-surface-container-low/50">
                    <td colSpan={3} className="py-3 px-3 text-right">TOTALES:</td>
                    <td className="py-3 px-3 text-right text-primary">${totalHistorial.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right text-green-600">${totalPagado.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right text-orange-600">${totalBalance.toFixed(2)}</td>
                    <td></td>
                  </tr>
                )}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-on-surface-variant">
                      No hay resultados para los filtros actuales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="glass-panel rounded-2xl border-outline-variant overflow-hidden">
        <button
          onClick={() => setShowStats(!showStats)}
          className="w-full p-6 flex items-center justify-between"
        >
          <h2 className="font-headline text-lg font-bold text-on-surface">
            Estadísticas
          </h2>
          {showStats ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        {showStats && (
          <div className="px-6 pb-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-surface-container-low rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-primary">{stats.totalInvoices}</p>
                <p className="text-sm text-on-surface-variant">Facturas generadas</p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-primary">${stats.totalBilled.toFixed(2)}</p>
                <p className="text-sm text-on-surface-variant">Total facturado</p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-primary">${stats.totalPaid.toFixed(2)}</p>
                <p className="text-sm text-on-surface-variant">Total pagado</p>
              </div>
            </div>

            {stats.topClients.length > 0 && (
              <div>
                <h3 className="font-semibold text-on-surface mb-2">Top Clientes</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-outline-variant">
                        <th className="text-left py-2 font-semibold">Cliente</th>
                        <th className="text-right py-2 font-semibold">Facturas</th>
                        <th className="text-right py-2 font-semibold"> {t.adminInvoices?.total || "Total"} </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topClients.map(([name, data]) => (
                        <tr key={name} className="border-b border-outline-variant/50">
                          <td className="py-2">{name}</td>
                          <td className="py-2 text-right">{data.count}</td>
                          <td className="py-2 text-right font-medium">${data.totalAmount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.weeklyGroups.size > 0 && (
                <div>
                  <h3 className="font-semibold text-on-surface mb-2">Totales semanales</h3>
                  <div className="space-y-1">
                    {Array.from(stats.weeklyGroups.entries()).sort().map(([week, amount]) => (
                      <div key={week} className="flex justify-between text-sm py-1 px-2 rounded bg-surface-container-low">
                        <span>Semana {week}</span>
                        <span className="font-medium">${amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {stats.monthlyGroups.size > 0 && (
                <div>
                  <h3 className="font-semibold text-on-surface mb-2">Totales mensuales</h3>
                  <div className="space-y-1">
                    {Array.from(stats.monthlyGroups.entries()).sort().map(([month, amount]) => (
                      <div key={month} className="flex justify-between text-sm py-1 px-2 rounded bg-surface-container-low">
                        <span>{month}</span>
                        <span className="font-medium">${amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* View Invoice Modal */}
      {showViewModal && viewInvoiceHtml && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowViewModal(false)}>
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold">Vista de Factura</h3>
              <button onClick={() => setShowViewModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4" dangerouslySetInnerHTML={{ __html: viewInvoiceHtml }} />
          </div>
        </div>
      )}
    </div>
  );
}
