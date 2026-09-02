import fs from 'fs';

const replaceInFile = (filePath: string, replacements: [RegExp | string, string][]) => {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [search, replace] of replacements) {
    content = content.replace(search, replace);
  }
  fs.writeFileSync(filePath, content, 'utf8');
};

replaceInFile('app/(app)/admin/users/page.tsx', [
  [/placeholder="Buscar por nombre o email\.\.\."/g, 'placeholder={t.adminUsers.search || "Buscar por nombre o email..."}'],
  [/<option value="all">Todos los roles<\/option>/g, '<option value="all">{t.adminUsers.allRoles || "Todos los roles"}</option>'],
  [/<Button onClick=\{openNewUserModal\}>\s*<Plus className="w-5 h-5 mr-2" \/>\s*Nuevo Usuario\s*<\/Button>/g, '<Button onClick={openNewUserModal}>\n            <Plus className="w-5 h-5 mr-2" />\n            {t.adminUsers.newUser || "Nuevo Usuario"}\n          </Button>'],
  [/<th className="px-6 py-4 font-semibold text-xs text-on-surface-variant uppercase tracking-wider">\s*NOMBRE\s*<\/th>/g, '<th className="px-6 py-4 font-semibold text-xs text-on-surface-variant uppercase tracking-wider">\n                  {t.adminUsers.name || "NOMBRE"}\n                </th>'],
  [/<th className="px-6 py-4 font-semibold text-xs text-on-surface-variant uppercase tracking-wider">\s*ROL\s*<\/th>/g, '<th className="px-6 py-4 font-semibold text-xs text-on-surface-variant uppercase tracking-wider">\n                  {t.adminUsers.role || "ROL"}\n                </th>'],
  [/<th className="px-6 py-4 font-semibold text-xs text-on-surface-variant uppercase tracking-wider">\s*EQUIPO\s*<\/th>/g, '<th className="px-6 py-4 font-semibold text-xs text-on-surface-variant uppercase tracking-wider">\n                  {t.adminUsers.team || "EQUIPO"}\n                </th>'],
  [/<th className="px-6 py-4 font-semibold text-xs text-on-surface-variant uppercase tracking-wider">\s*ESTADO\s*<\/th>/g, '<th className="px-6 py-4 font-semibold text-xs text-on-surface-variant uppercase tracking-wider">\n                  {t.adminUsers.status || "ESTADO"}\n                </th>'],
  [/<th className="px-6 py-4 font-semibold text-xs text-on-surface-variant uppercase tracking-wider text-center">\s*VALIDACIÓN GPS\s*<\/th>/g, '<th className="px-6 py-4 font-semibold text-xs text-on-surface-variant uppercase tracking-wider text-center">\n                  {t.adminUsers.gpsValidation || "VALIDACIÓN GPS"}\n                </th>'],
  [/<th className="px-6 py-4 font-semibold text-xs text-on-surface-variant uppercase tracking-wider text-right">\s*ACCIONES\s*<\/th>/g, '<th className="px-6 py-4 font-semibold text-xs text-on-surface-variant uppercase tracking-wider text-right">\n                  {t.adminUsers.actions || "ACCIONES"}\n                </th>'],
  [/<span className="text-emerald-700 dark:text-emerald-300 font-medium text-sm">\s*Activo\s*<\/span>/g, '<span className="text-emerald-700 dark:text-emerald-300 font-medium text-sm">\n                          {t.adminUsers.active || "Activo"}\n                        </span>'],
  [/<span className="text-red-700 dark:text-red-300 font-medium text-sm">\s*Inactivo\s*<\/span>/g, '<span className="text-red-700 dark:text-red-300 font-medium text-sm">\n                          {t.adminUsers.inactive || "Inactivo"}\n                        </span>'],
  [/>\s*—\s*<\/span>/g, '> {t.adminUsers.noTeam || "—"} </span>'],
  [/>\s*Editar Usuario\s*<\/h3>/g, '> {t.adminUsers.editUser || "Editar Usuario"} </h3>'],
  [/>\s*Crear Usuario\s*<\/h3>/g, '> {t.adminUsers.createUser || "Crear Usuario"} </h3>'],
  [/\{editingUser \? t\.common\.save \: "Crear"\}/g, '{editingUser ? t.common.save : (t.adminUsers.createUser || "Crear")}']
]);

replaceInFile('app/(app)/admin/invoices/page.tsx', [
  [/>\s*Facturas \/ Invoices\s*<\/h1>/g, '> {t.adminInvoices?.invoices || "Facturas / Invoices"} </h1>'],
  [/>\s*Genera facturas personalizadas y descargas en PDF\s*<\/p>/g, '> {t.admin?.invoicesDesc || "Genera facturas personalizadas y descargas en PDF"} </p>'],
  [/>\s*Generar Factura\s*<\/Button>/g, '> {t.adminInvoices?.generateInvoice || "Generar Factura"} </Button>'],
  [/>\s*Datos de la Factura\s*<\/h2>/g, '> {t.adminInvoices?.invoiceData || "Datos de la Factura"} </h2>'],
  [/>\s*Nro Factura\s*<\/label>/g, '> {t.adminInvoices?.invoiceNumber || "Nro Factura"} </label>'],
  [/>\s*Fecha\s*<\/label>/g, '> {t.adminInvoices?.date || "Fecha"} </label>'],
  [/>\s*Vencimiento\s*<\/label>/g, '> {t.adminInvoices?.dueDate || "Vencimiento"} </label>'],
  [/>\s*Pagado \(\$\)\s*<\/label>/g, '> {t.adminInvoices?.paid || "Pagado ($)"} </label>'],
  [/>\s*Facturar A \(Bill To\)\s*<\/label>/g, '> {t.adminInvoices?.billTo || "Facturar A (Bill To)"} </label>'],
  [/>\s*Contactos\s*<\/span>/g, '> {t.adminInvoices?.contacts || "Contactos"} </span>'],
  [/placeholder="Nombre \/ Empresa"/g, 'placeholder={t.adminInvoices?.nameCompany || "Nombre / Empresa"}'],
  [/placeholder="Telefono"/g, 'placeholder={t.adminInvoices?.phone || "Telefono"}'],
  [/placeholder="Email"/g, 'placeholder={t.adminInvoices?.email || "Email"}'],
  [/placeholder="Direccion"/g, 'placeholder={t.adminInvoices?.address || "Direccion"}'],
  [/>\s*Desde \(Invoice From\)\s*<\/label>/g, '> {t.adminInvoices?.invoiceFrom || "Desde (Invoice From)"} </label>'],
  [/>\s*Items\s*<\/label>/g, '> {t.adminInvoices?.items || "Items"} </label>'],
  [/>\s*Agregar Item\s*<\/Button>/g, '> {t.adminInvoices?.addBtn || "Agregar Item"} </Button>'],
  [/>\s*Historial de Facturas\s*<\/h2>/g, '> {t.adminInvoices?.history || "Historial de Facturas"} </h2>'],
  [/>\s*Exportar Excel\s*<\/Button>/g, '> {t.adminInvoices?.exportExcel || "Exportar Excel"} </Button>'],
  [/placeholder="Filtrar por Nro Factura\.\.\."/g, 'placeholder={t.adminInvoices?.filterNumber || "Filtrar por Nro Factura..."}'],
  [/placeholder="Filtrar por Facturar A\.\.\."/g, 'placeholder={t.adminInvoices?.filterBillTo || "Filtrar por Facturar A..."}'],
  [/>\s*Total\s*<\/th>/g, '> {t.adminInvoices?.total || "Total"} </th>'],
  [/>\s*Balance\s*<\/th>/g, '> {t.adminInvoices?.balance || "Balance"} </th>'],
  [/>\s*TOTALES:\s*<\/span>/g, '> {t.adminInvoices?.totals || "TOTALES:"} </span>'],
  [/>\s*Estadísticas\s*<\/span>/g, '> {t.adminInvoices?.statistics || "Estadísticas"} </span>'],
  [/>\s*Cant:\s*<\/span>/g, '> {t.adminInvoices?.qty || "Cant:"} </span>'],
  [/>\s*Precio:\s*<\/span>/g, '> {t.adminInvoices?.price || "Precio:"} </span>'],
  [/>\s*Normal\s*<\/span>/g, '> {t.adminInvoices?.normal || "Normal"} </span>'],
]);

replaceInFile('app/(app)/admin/emails/page.tsx', [
  [/>\s*Redactar Correo\s*<\/h1>/g, '> {t.adminEmails?.compose || "Redactar Correo"} </h1>'],
  [/>\s*De\s*<\/span>/g, '> {t.adminEmails?.from || "De"} </span>'],
  [/>\s*Para\s*<\/span>/g, '> {t.adminEmails?.to || "Para"} </span>'],
  [/>\s*Asunto\s*<\/span>/g, '> {t.adminEmails?.subject || "Asunto"} </span>'],
  [/placeholder="Asunto del correo"/g, 'placeholder={t.adminEmails?.subjectPlaceholder || "Asunto del correo"}'],
  [/>\s*Adjuntar\s*<\/span>/g, '> {t.adminEmails?.attach || "Adjuntar"} </span>'],
  [/>\s*Max 5 archivos • 5MB c\/u • 10MB total\s*<\/span>/g, '> {t.adminEmails?.maxFiles || "Max 5 archivos • 5MB c/u • 10MB total"} </span>'],
  [/>\s*Enviar\s*<\/Button>/g, '> {t.adminEmails?.send || "Enviar"} </Button>'],
]);

console.log('React files patched');
