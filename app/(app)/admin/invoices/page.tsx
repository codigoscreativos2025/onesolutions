"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Trash2, FileDown, Eye } from "lucide-react";

interface Item {
  id: number;
  description: string;
  detail: string;
  quantity: number;
  unitPrice: number;
  isDiscount: boolean;
}

export default function AdminInvoicesPage() {
  const { data: session } = useSession();
  const previewRef = useRef<HTMLDivElement>(null);

  const [invoiceNum, setInvoiceNum] = useState("INV0026");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("On receipt");
  const [billToName, setBillToName] = useState("");
  const [billToPhone, setBillToPhone] = useState("");
  const [billToEmail, setBillToEmail] = useState("");
  const [fromName, setFromName] = useState("One Solutions Companies LLC");
  const [fromPhone, setFromPhone] = useState("(407) 785-4304");
  const [fromEmail, setFromEmail] = useState("payments@onesolutionscompanies.com");
  const [fromAddress, setFromAddress] = useState("2419 Lake Orange Dr Suite 5, Orlando FL 32837");
  const [paid, setPaid] = useState(0);
  const [items, setItems] = useState<Item[]>([
    { id: 1, description: "Servicio de instalacion", detail: "Incluye materiales y mano de obra", quantity: 1, unitPrice: 0, isDiscount: false },
  ]);

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

  const downloadPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas");

    if (!previewRef.current) return;
    const canvas = await html2canvas(previewRef.current, { scale: 2, backgroundColor: "#ffffff" });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(img, "PNG", 0, 0, w, h);
    pdf.save(`Invoice_${invoiceNum}.pdf`);
  };

  if (session?.user?.role !== "ADMIN") {
    return <div className="p-8 text-center">Acceso restringido a administradores.</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Facturas / Invoices</h1>
          <p className="text-on-surface-variant">Genera facturas personalizadas y descargalas en PDF</p>
        </div>
        <Button onClick={downloadPDF} className="gap-2">
          <FileDown className="w-5 h-5" />
          Descargar PDF
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* FORM */}
          <div className="space-y-4 glass-panel rounded-xl p-6 lg:w-[45%] lg:shrink-0">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Eye className="w-5 h-5" /> Datos de la Factura
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-on-surface-variant">Nro Factura</label>
              <Input value={invoiceNum} onChange={(e) => setInvoiceNum(e.target.value)} className="h-10" />
            </div>
            <div>
              <label className="text-xs font-medium text-on-surface-variant">Fecha</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-on-surface-variant">Vencimiento</label>
              <Input value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-10" placeholder="On receipt" />
            </div>
            <div>
              <label className="text-xs font-medium text-on-surface-variant">Pagado ($)</label>
              <Input type="number" value={paid} onChange={(e) => setPaid(Number(e.target.value))} className="h-10" />
            </div>
          </div>

          <div className="border-t border-outline-variant pt-4">
            <h3 className="text-sm font-semibold mb-2">Facturar A (Bill To):</h3>
            <div className="space-y-2">
              <Input value={billToName} onChange={(e) => setBillToName(e.target.value)} placeholder="Nombre / Empresa" />
              <Input value={billToPhone} onChange={(e) => setBillToPhone(e.target.value)} placeholder="Telefono" />
              <Input value={billToEmail} onChange={(e) => setBillToEmail(e.target.value)} placeholder="Email" />
            </div>
          </div>

          <div className="border-t border-outline-variant pt-4">
            <h3 className="text-sm font-semibold mb-2">Desde (Invoice From):</h3>
            <div className="space-y-2">
              <Input value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="Nombre" />
              <Input value={fromPhone} onChange={(e) => setFromPhone(e.target.value)} placeholder="Telefono" />
              <Input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} placeholder="Email" />
              <Input value={fromAddress} onChange={(e) => setFromAddress(e.target.value)} placeholder="Direccion" />
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
                    />
                    <Input
                      value={item.detail}
                      onChange={(e) => updateItem(item.id, "detail", e.target.value)}
                      placeholder="Detalle extra"
                      className="flex-1 h-9 text-sm"
                    />
                    <button onClick={() => removeItem(item.id)} className="p-2 text-error hover:bg-error/10 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs w-16">Cant:</label>
                    <Input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", Math.max(1, Number(e.target.value)))} className="w-20 h-9 text-sm" />
                    <label className="text-xs w-16">Precio:</label>
                    <Input type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value))} className="w-28 h-9 text-sm" />
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
                <Plus className="w-4 h-4" />
                Agregar Item
              </Button>
            </div>
          </div>
        </div>

        {/* PREVIEW - matches MuestraInvoice.html design */}
          <div className="flex-1 lg:min-w-0 max-h-[90vh] sticky top-4">
          <div ref={previewRef} className="bg-white shadow-lg" style={{ fontFamily: "Arial, sans-serif", minWidth: "400px" }}>
            {/* Header */}
            <div style={{ display: "flex", minHeight: 160 }}>
              <div style={{ backgroundColor: "#f19e38", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                <div style={{ textAlign: "center", color: "black" }}>
                  <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1, border: "4px solid black", borderRadius: "50%", width: 50, height: 50, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 5 }}>S</div>
                  <div style={{ fontWeight: 900, fontSize: 24, letterSpacing: 1, lineHeight: 1 }}>ONE</div>
                  <div style={{ fontSize: 9, letterSpacing: 1.5, fontWeight: 600, marginTop: 4 }}>SOLUTIONS</div>
                </div>
              </div>
              <div style={{ backgroundColor: "#dfe26a", color: "white", flex: 1, textAlign: "right", display: "flex", flexDirection: "column", justifyContent: "center", paddingRight: 50 }}>
                <h1 style={{ margin: 0, fontSize: 28, textTransform: "uppercase", fontWeight: "bold", letterSpacing: 1 }}>Invoice</h1>
                <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.9)" }}>
                  Number: {invoiceNum}<br />Date: {new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}<br />Due date: {dueDate}
                </p>
              </div>
            </div>

            {/* Addresses */}
            <div style={{ display: "flex", padding: 25, gap: 30 }}>
              <div style={{ flex: 1, fontSize: 13, color: "#777", lineHeight: 1.6 }}>
                <div style={{ color: "#f19e38", fontSize: 11, fontWeight: "bold", textTransform: "uppercase", marginBottom: 12 }}>BILL TO:</div>
                {billToName && <div style={{ fontWeight: "bold", color: "#222", fontSize: 14, marginBottom: 5 }}>{billToName}</div>}
                {billToPhone && <div>{billToPhone}</div>}
                {billToEmail && <div>{billToEmail}</div>}
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

            {/* Items Table */}
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

            {/* Totals */}
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
    </div>
  );
}
