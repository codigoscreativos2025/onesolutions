import fs from 'fs';

const replaceInFile = (filePath: string, replacements: [RegExp | string, string][]) => {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [search, replace] of replacements) {
    content = content.replace(search, replace);
  }
  fs.writeFileSync(filePath, content, 'utf8');
};

replaceInFile('app/(app)/admin/invoices/page.tsx', [
  [/<th className="text-left py-2 px-3 font-semibold">Nro Factura<\/th>/g, '<th className="text-left py-2 px-3 font-semibold">{t.adminInvoices?.invoiceNumber || "Nro Factura"}</th>'],
  [/<th className="text-left py-2 px-3 font-semibold">Fecha<\/th>/g, '<th className="text-left py-2 px-3 font-semibold">{t.adminInvoices?.date || "Fecha"}</th>'],
  [/<th className="text-left py-2 px-3 font-semibold">Facturar A<\/th>/g, '<th className="text-left py-2 px-3 font-semibold">{t.adminInvoices?.billTo || "Facturar A"}</th>'],
  [/<th className="text-right py-2 px-3 font-semibold">Pagado<\/th>/g, '<th className="text-right py-2 px-3 font-semibold">{t.adminInvoices?.paid || "Pagado"}</th>'],
  [/<td colSpan=\{3\} className="py-3 px-3 text-right">TOTALES:<\/td>/g, '<td colSpan={3} className="py-3 px-3 text-right">{t.adminInvoices?.totals || "TOTALES:"}</td>']
]);
console.log("patched!");
