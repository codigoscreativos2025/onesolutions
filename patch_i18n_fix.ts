import fs from 'fs';

const i18nPath = 'lib/i18n.ts';
let content = fs.readFileSync(i18nPath, 'utf8');

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

// Remove the wrongly inserted block from admin (in English section)
content = content.replace('\\n' + enInvoicesAdditions, '');

// Insert it correctly into adminInvoices (in English section)
content = content.replace('    adminInvoices: {\\n      invoices: "Invoices",', '    adminInvoices: {\\n      invoices: "Invoices",' + '\\n' + enInvoicesAdditions);

fs.writeFileSync(i18nPath, content, 'utf8');
