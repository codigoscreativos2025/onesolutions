import fs from 'fs';

const i18nPath = 'lib/i18n.ts';
let i18nContent = fs.readFileSync(i18nPath, 'utf8');

const esInvoicesAdditions = `
      invoicesSubtitle: "Genera facturas personalizadas y descargalas en PDF",
      contactSelectEdit: "Seleccionar o editar",
      contactNew: "Nuevo Contacto",
      name: "Nombre",
      company: "Empresa",
      save: "Guardar",
      cancel: "Cancelar",
      saveContact: "Guardar Contacto",
      itemDesc: "Descripcion del item",
      itemDetail: "Detalle extra",
      discount: "Descuento",
      noInvoices: "No hay facturas generadas. Descarga una factura para verla aqui.",
      noResults: "No hay resultados para los filtros actuales.",
      loading: "Cargando...",
      invoicesGenerated: "Facturas generadas",
      totalBilled: "Total facturado",
      totalPaidLabel: "Total pagado",
      topClients: "Top Clientes",
      client: "Cliente",
      invoiceCount: "Facturas",
      weeklyTotals: "Totales semanales",
      week: "Semana",
      monthlyTotals: "Totales mensuales",
      invoiceView: "Vista de Factura",
      actionsTitle: "Acciones",
      dateFrom: "Desde...",
      dateTo: "Hasta...",
`;

const enInvoicesAdditions = `
      invoicesSubtitle: "Generate custom invoices and download as PDF",
      contactSelectEdit: "Select or edit",
      contactNew: "New Contact",
      name: "Name",
      company: "Company",
      save: "Save",
      cancel: "Cancel",
      saveContact: "Save Contact",
      itemDesc: "Item description",
      itemDetail: "Extra detail",
      discount: "Discount",
      noInvoices: "No invoices generated. Download an invoice to view it here.",
      noResults: "No results for the current filters.",
      loading: "Loading...",
      invoicesGenerated: "Invoices generated",
      totalBilled: "Total billed",
      totalPaidLabel: "Total paid",
      topClients: "Top Clients",
      client: "Client",
      invoiceCount: "Invoices",
      weeklyTotals: "Weekly totals",
      week: "Week",
      monthlyTotals: "Monthly totals",
      invoiceView: "Invoice View",
      actionsTitle: "Actions",
      dateFrom: "From...",
      dateTo: "To...",
`;

i18nContent = i18nContent.replace('      invoices: "Facturas / Invoices",', '      invoices: "Facturas / Invoices",' + '\n' + esInvoicesAdditions);
i18nContent = i18nContent.replace('      invoices: "Invoices",', '      invoices: "Invoices",' + '\n' + enInvoicesAdditions);

fs.writeFileSync(i18nPath, i18nContent, 'utf8');

const replaceInFile = (filePath: string, replacements: [RegExp | string, string][]) => {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [search, replace] of replacements) {
    content = content.replace(search, replace);
  }
  fs.writeFileSync(filePath, content, 'utf8');
};

replaceInFile('app/(app)/admin/invoices/page.tsx', [
  [/<p className="text-on-surface-variant">Genera facturas personalizadas y descargalas en PDF<\/p>/g, '<p className="text-on-surface-variant">{t.adminInvoices?.invoicesSubtitle || "Genera facturas personalizadas y descargalas en PDF"}</p>'],
  [/<h3 className="text-sm font-semibold">Facturar A \(Bill To\)<\/h3>/g, '<h3 className="text-sm font-semibold">{t.adminInvoices?.billTo || "Facturar A (Bill To)"}</h3>'],
  [/<h4 className="text-xs font-semibold text-on-surface-variant">Seleccionar o editar<\/h4>/g, '<h4 className="text-xs font-semibold text-on-surface-variant">{t.adminInvoices?.contactSelectEdit || "Seleccionar o editar"}</h4>'],
  [/<h4 className="text-xs font-semibold text-on-surface-variant">Nuevo Contacto<\/h4>/g, '<h4 className="text-xs font-semibold text-on-surface-variant">{t.adminInvoices?.contactNew || "Nuevo Contacto"}</h4>'],
  [/placeholder="Nombre"/g, 'placeholder={t.adminInvoices?.name || "Nombre"}'],
  [/placeholder="Nombre \*"/g, 'placeholder={(t.adminInvoices?.name || "Nombre") + " *"}'],
  [/placeholder="Empresa"/g, 'placeholder={t.adminInvoices?.company || "Empresa"}'],
  [/>Guardar<\/Button>/g, '>{t.adminInvoices?.save || "Guardar"}</Button>'],
  [/>Cancelar<\/Button>/g, '>{t.adminInvoices?.cancel || "Cancelar"}</Button>'],
  [/>\s*Guardar Contacto\s*<\/Button>/g, '>\n                    {t.adminInvoices?.saveContact || "Guardar Contacto"}\n                  </Button>'],
  [/placeholder="Descripcion del item"/g, 'placeholder={t.adminInvoices?.itemDesc || "Descripcion del item"}'],
  [/placeholder="Detalle extra"/g, 'placeholder={t.adminInvoices?.itemDetail || "Detalle extra"}'],
  [/\{item\.isDiscount \? "Descuento" \: "Normal"\}/g, '{item.isDiscount ? (t.adminInvoices?.discount || "Descuento") : (t.adminInvoices?.normal || "Normal")}'],
  [/<p className="text-center py-8 text-on-surface-variant">Cargando\.\.\.<\/p>/g, '<p className="text-center py-8 text-on-surface-variant">{t.adminInvoices?.loading || "Cargando..."}</p>'],
  [/No hay facturas generadas\. Descarga una factura para verla aqui\./g, '{t.adminInvoices?.noInvoices || "No hay facturas generadas. Descarga una factura para verla aqui."}'],
  [/No hay resultados para los filtros actuales\./g, '{t.adminInvoices?.noResults || "No hay resultados para los filtros actuales."}'],
  [/<th className="text-center py-2 px-3 font-semibold">Acciones<\/th>/g, '<th className="text-center py-2 px-3 font-semibold">{t.adminInvoices?.actionsTitle || "Acciones"}</th>'],
  [/Estadísticas/g, '{t.adminInvoices?.statistics || "Estadísticas"}'],
  [/<p className="text-sm text-on-surface-variant">Facturas generadas<\/p>/g, '<p className="text-sm text-on-surface-variant">{t.adminInvoices?.invoicesGenerated || "Facturas generadas"}</p>'],
  [/<p className="text-sm text-on-surface-variant">Total facturado<\/p>/g, '<p className="text-sm text-on-surface-variant">{t.adminInvoices?.totalBilled || "Total facturado"}</p>'],
  [/<p className="text-sm text-on-surface-variant">Total pagado<\/p>/g, '<p className="text-sm text-on-surface-variant">{t.adminInvoices?.totalPaidLabel || "Total pagado"}</p>'],
  [/Top Clientes/g, '{t.adminInvoices?.topClients || "Top Clientes"}'],
  [/<th className="text-left py-2 font-semibold">Cliente<\/th>/g, '<th className="text-left py-2 font-semibold">{t.adminInvoices?.client || "Cliente"}</th>'],
  [/<th className="text-right py-2 font-semibold">Facturas<\/th>/g, '<th className="text-right py-2 font-semibold">{t.adminInvoices?.invoiceCount || "Facturas"}</th>'],
  [/Totales semanales/g, '{t.adminInvoices?.weeklyTotals || "Totales semanales"}'],
  [/<span>Semana \{week\}<\/span>/g, '<span>{t.adminInvoices?.week || "Semana"} {week}</span>'],
  [/Totales mensuales/g, '{t.adminInvoices?.monthlyTotals || "Totales mensuales"}'],
  [/Vista de Factura/g, '{t.adminInvoices?.invoiceView || "Vista de Factura"}'],
  [/placeholder="Desde\.\.\."/g, 'placeholder={t.adminInvoices?.dateFrom || "Desde..."}'],
  [/placeholder="Hasta\.\.\."/g, 'placeholder={t.adminInvoices?.dateTo || "Hasta..."}']
]);
console.log("patched!");
