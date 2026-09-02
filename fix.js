const fs = require('fs');
let content = fs.readFileSync('lib/i18n.ts', 'utf8');
const searchEN = '      invoicesSubtitle: "Generate custom invoices and download as PDF",';
const blockStart = content.indexOf(searchEN);
if (blockStart !== -1) {
  // Find where this block ends
  const blockEnd = content.indexOf('dateTo: "To...",', blockStart) + 'dateTo: "To...",'.length;
  if (blockEnd > blockStart) {
    const block = content.substring(blockStart, blockEnd) + '\n';
    content = content.replace(block, ''); // remove it from admin
    
    // add it to adminInvoices
    const adminInvoicesENStart = content.lastIndexOf('    adminInvoices: {');
    const insertionPoint = content.indexOf('invoices: "Invoices",', adminInvoicesENStart) + 'invoices: "Invoices",'.length;
    content = content.substring(0, insertionPoint) + '\n' + block + content.substring(insertionPoint);
    fs.writeFileSync('lib/i18n.ts', content);
    console.log('Fixed correctly!');
  }
}
