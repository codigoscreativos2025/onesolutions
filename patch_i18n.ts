import fs from 'fs';

const i18nPath = 'lib/i18n.ts';
let content = fs.readFileSync(i18nPath, 'utf8');

const esAdditions = `
    adminUsers: {
      search: "Buscar por nombre o email...",
      allRoles: "Todos los roles",
      newUser: "Nuevo Usuario",
      name: "NOMBRE",
      role: "ROL",
      team: "EQUIPO",
      status: "ESTADO",
      gpsValidation: "VALIDACIÓN GPS",
      actions: "ACCIONES",
      active: "Activo",
      inactive: "Inactivo",
      noTeam: "—",
      editUser: "Editar Usuario",
      createUser: "Crear Usuario",
    },
    adminInvoices: {
      generateInvoice: "Generar Factura",
      invoiceData: "Datos de la Factura",
      invoiceNumber: "Nro Factura",
      date: "Fecha",
      dueDate: "Vencimiento",
      paid: "Pagado ($)",
      billTo: "Facturar A (Bill To)",
      contacts: "Contactos",
      nameCompany: "Nombre / Empresa",
      phone: "Telefono",
      email: "Email",
      address: "Direccion",
      invoiceFrom: "Desde (Invoice From)",
      items: "Items",
      addBtn: "Agregar Item",
      history: "Historial de Facturas",
      exportExcel: "Exportar Excel",
      filterNumber: "Filtrar por Nro Factura...",
      filterBillTo: "Filtrar por Facturar A...",
      total: "Total",
      balance: "Balance",
      totals: "TOTALES:",
      statistics: "Estadísticas",
      qty: "Cant:",
      price: "Precio:",
      normal: "Normal",
    },
    adminEmails: {
      compose: "Redactar Correo",
      from: "De",
      to: "Para",
      subject: "Asunto",
      subjectPlaceholder: "Asunto del correo",
      attach: "Adjuntar",
      send: "Enviar",
      maxFiles: "Max 5 archivos • 5MB c/u • 10MB total",
    },`;

const enAdditions = `
    adminUsers: {
      search: "Search by name or email...",
      allRoles: "All roles",
      newUser: "New User",
      name: "NAME",
      role: "ROLE",
      team: "TEAM",
      status: "STATUS",
      gpsValidation: "GPS VALIDATION",
      actions: "ACTIONS",
      active: "Active",
      inactive: "Inactive",
      noTeam: "—",
      editUser: "Edit User",
      createUser: "Create User",
    },
    adminInvoices: {
      generateInvoice: "Generate Invoice",
      invoiceData: "Invoice Data",
      invoiceNumber: "Invoice No",
      date: "Date",
      dueDate: "Due Date",
      paid: "Paid ($)",
      billTo: "Bill To",
      contacts: "Contacts",
      nameCompany: "Name / Company",
      phone: "Phone",
      email: "Email",
      address: "Address",
      invoiceFrom: "Invoice From",
      items: "Items",
      addBtn: "Add Item",
      history: "Invoice History",
      exportExcel: "Export Excel",
      filterNumber: "Filter by Invoice No...",
      filterBillTo: "Filter by Bill To...",
      total: "Total",
      balance: "Balance",
      totals: "TOTALS:",
      statistics: "Statistics",
      qty: "Qty:",
      price: "Price:",
      normal: "Normal",
    },
    adminEmails: {
      compose: "Compose Email",
      from: "From",
      to: "To",
      subject: "Subject",
      subjectPlaceholder: "Email subject",
      attach: "Attach",
      send: "Send",
      maxFiles: "Max 5 files • 5MB ea • 10MB total",
    },`;

// Split content by language sections
const esStart = content.indexOf('es: {');
const enStart = content.indexOf('en: {');

const esSection = content.substring(esStart, enStart);
const enSection = content.substring(enStart);

const updatedEs = esSection.replace('    adminBadges: {', esAdditions + '\n    adminBadges: {');
const updatedEn = enSection.replace('    adminBadges: {', enAdditions + '\n    adminBadges: {');

fs.writeFileSync(i18nPath, content.substring(0, esStart) + updatedEs + updatedEn, 'utf8');
console.log('i18n.ts patched');
