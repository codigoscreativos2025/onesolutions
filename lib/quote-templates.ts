import { jsPDF } from "jspdf";

interface QuoteProjectType {
  name: string;
  description?: string | null;
}

interface QuoteParcel {
  address: string;
  ownerName?: string | null;
}

interface QuoteBill {
  clientName?: string | null;
  clientEmail?: string | null;
  phone?: string | null;
}

interface QuoteData {
  parcel: QuoteParcel;
  bill?: QuoteBill | null;
  projects: { projectType: QuoteProjectType }[];
}

interface ContractData extends QuoteData {
  projectDetails: {
    clientName?: string | null;
    clientEmail?: string | null;
    address?: string | null;
    closingDate?: string | null;
    paymentMethod?: string | null;
    solarFinancier?: string | null;
    systemSize?: string | null;
    hoaInfo?: string | null;
    ppwSold?: string | null;
    umbrella?: string | null;
    mpuPanels?: string | null;
    siteSurveyDate?: string | null;
    panelsUp?: boolean;
    panelsDown?: boolean;
    roofType?: string | null;
    roofCostPrice?: number | null;
    roofSalePrice?: number | null;
    roofCommission?: number | null;
    waterSystemType?: string | null;
    waterCostPrice?: number | null;
    waterSalePrice?: number | null;
    waterCommission?: number | null;
    primaryRep?: string | null;
    primaryRepCommPct?: number | null;
    secondaryRep?: string | null;
    secondaryRepCommPct?: number | null;
    tertiaryRep?: string | null;
    tertiaryRepCommPct?: number | null;
    otherCostPrice?: number | null;
    otherSalePrice?: number | null;
    otherCommission?: number | null;
  };
}

interface BusinessSettings {
  logoUrl?: string | null;
  watermarkedEnabled?: boolean;
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "";
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  try {
    const d = new Date(value);
    return d.toLocaleDateString("es-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return value;
  }
}

function addHeader(doc: jsPDF, businessSettings?: BusinessSettings | null) {
  if (businessSettings?.logoUrl) {
    try {
      doc.addImage(businessSettings.logoUrl, "PNG", 14, 10, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("One Solutions", 50, 28);
    } catch {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("One Solutions", 14, 28);
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("One Solutions", 14, 28);
  }
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 36, 196, 36);
}

function addFooter(doc: jsPDF, text: string) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(text, 14, 290, { maxWidth: 182 });
    doc.text(`Pagina ${i} de ${pageCount}`, 196, 290, { align: "right" });
  }
}

export function generateQuotePDF(
  data: QuoteData,
  businessSettings?: BusinessSettings | null
): jsPDF {
  const doc = new jsPDF({ format: "a4" });
  const margin = 14;
  let y = 44;

  addHeader(doc, businessSettings);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text("COTIZACION", margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Fecha: ${new Date().toLocaleDateString("es-US", { year: "numeric", month: "long", day: "numeric" })}`, margin, y);
  y += 4;
  doc.text("Cotizacion valida por 30 dias", margin, y);
  y += 12;

  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(245, 248, 250);
  doc.rect(margin, y - 6, 182, 32, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text("Datos del Cliente", margin + 4, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  const clientName = data.bill?.clientName || data.parcel.ownerName || "";
  const clientPhone = data.bill?.phone || "";
  const clientEmail = data.bill?.clientEmail || "";
  doc.text(`Nombre: ${clientName || "—"}`, margin + 4, y);
  y += 5;
  doc.text(`Direccion: ${data.parcel.address || "—"}`, margin + 4, y);
  y += 5;
  doc.text(`Telefono: ${clientPhone || "—"}`, margin + 4, y);
  y += 5;
  doc.text(`Email: ${clientEmail || "—"}`, margin + 4, y);
  y += 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text("Proyectos Seleccionados", margin, y);
  y += 8;

  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(240, 240, 240);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.rect(margin, y - 5, 90, 7, "F");
  doc.text("Proyecto", margin + 3, y);
  doc.rect(margin + 90, y - 5, 92, 7, "F");
  doc.text("Descripcion", margin + 93, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);

  if (data.projects.length === 0) {
    doc.text("No se seleccionaron proyectos", margin + 3, y);
    y += 6;
  } else {
    for (const p of data.projects) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(p.projectType.name || "—", margin + 3, y);
      doc.text(p.projectType.description || "", margin + 93, y, { maxWidth: 88 });
      y += 6;
    }
  }

  y += 10;
  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(255, 250, 240);
  doc.rect(margin, y - 6, 182, 12, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text("Total Estimado: A convenir", margin + 4, y);
  y += 18;

  addFooter(doc, "One Solutions — Cotizacion — Documento generado electronicamente");

  return doc;
}

export function generateContractPDF(
  data: ContractData,
  signatureDataUrl?: string | null,
  businessSettings?: BusinessSettings | null
): jsPDF {
  const doc = new jsPDF({ format: "a4" });
  const margin = 14;
  let y = 44;

  addHeader(doc, businessSettings);

  const details = data.projectDetails;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text("CONTRATO DE SERVICIO", margin, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Fecha de cierre: ${formatDate(details.closingDate) || "—"}`,
    margin,
    y
  );
  y += 12;

  function drawSectionHeader(text: string) {
    if (y > 265) { doc.addPage(); y = 20; }
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(245, 248, 250);
    doc.rect(margin, y - 5, 182, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text(text, margin + 3, y);
    y += 10;
  }

  function drawLine(label: string, value: string) {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`${label}:`, margin + 2, y);
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "bold");
    doc.text(value || "—", margin + 70, y, { maxWidth: 120 });
    doc.setFont("helvetica", "normal");
    y += 5;
  }

  drawSectionHeader("Datos del Cliente");
  drawLine("Nombre", details.clientName || data.bill?.clientName || data.parcel.ownerName || "");
  drawLine("Email", details.clientEmail || data.bill?.clientEmail || "");
  drawLine("Direccion", details.address || data.parcel.address || "");
  drawLine("Metodo de pago", details.paymentMethod || "");
  y += 4;

  drawSectionHeader("Datos del Proyecto Solar");
  drawLine("Financiera solar", details.solarFinancier || "");
  drawLine("Tamaño del sistema", details.systemSize || "");
  drawLine("HOA", details.hoaInfo || "");
  drawLine("PPW Vendido", details.ppwSold || "");
  drawLine("Umbrella", details.umbrella || "");
  drawLine("Paneles MPU", details.mpuPanels || "");
  drawLine("Paneles Arriba", details.panelsUp ? "Si" : "No");
  drawLine("Paneles Abajo", details.panelsDown ? "Si" : "No");
  drawLine("Fecha Site Survey", formatDate(details.siteSurveyDate));
  y += 4;

  if (details.roofType) {
    drawSectionHeader("Techo");
    drawLine("Tipo", details.roofType);
    drawLine("Costo", formatCurrency(details.roofCostPrice));
    drawLine("Precio de venta", formatCurrency(details.roofSalePrice));
    drawLine("Comision", formatCurrency(details.roofCommission));
    y += 4;
  }

  if (details.waterSystemType) {
    drawSectionHeader("Purificador de Agua");
    drawLine("Tipo", details.waterSystemType);
    drawLine("Costo", formatCurrency(details.waterCostPrice));
    drawLine("Precio de venta", formatCurrency(details.waterSalePrice));
    drawLine("Comision", formatCurrency(details.waterCommission));
    y += 4;
  }

  if (details.otherCostPrice || details.otherSalePrice) {
    drawSectionHeader("Otros Proyectos");
    drawLine("Costo", formatCurrency(details.otherCostPrice));
    drawLine("Precio de venta", formatCurrency(details.otherSalePrice));
    drawLine("Comision", formatCurrency(details.otherCommission));
    y += 4;
  }

  drawSectionHeader("Comisiones de Ventas");
  drawLine("Representante primario", details.primaryRep || "");
  drawLine("Comision primario", details.primaryRepCommPct != null ? `${details.primaryRepCommPct}%` : "");
  drawLine("Representante secundario", details.secondaryRep || "");
  drawLine("Comision secundario", details.secondaryRepCommPct != null ? `${details.secondaryRepCommPct}%` : "");
  drawLine("Representante terciario", details.tertiaryRep || "");
  drawLine("Comision terciario", details.tertiaryRepCommPct != null ? `${details.tertiaryRepCommPct}%` : "");
  y += 6;

  drawSectionHeader("Terminos y Condiciones");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  const terms = [
    "1. El presente contrato establece los terminos y condiciones del servicio contratado por el cliente.",
    "2. Los precios y montos indicados están sujetos a cambios por ajustes propios del proyecto.",
    "3. El cliente acepta los plazos de instalacion acordados, sujetos a disponibilidad y permisos locales.",
    "4. Las comisiones seran pagadas conforme a la politica interna de One Solutions.",
    "5. Cualquier modificacion al alcance del proyecto debera ser acordada por ambas partes por escrito.",
    "6. Este documento constituye el acuerdo completo entre las partes y sustituye cualquier acuerdo previo.",
  ];
  for (const term of terms) {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.text(term, margin + 2, y, { maxWidth: 180 });
    y += 4;
  }
  y += 8;

  if (signatureDataUrl) {
    if (y > 220) { doc.addPage(); y = 20; }
    drawSectionHeader("Firma Digital");
    try {
      doc.addImage(signatureDataUrl, "PNG", margin + 2, y, 80, 40);
    } catch {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text("Firma digital registrada", margin + 2, y + 10);
    }
    y += 50;
  } else {
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("Firma: _______________________________", margin + 2, y);
    y += 8;
    doc.text("Fecha: _______________________________", margin + 2, y);
    y += 16;
  }

  addFooter(doc, "One Solutions — Contrato de Servicio — Documento generado electronicamente");

  return doc;
}
