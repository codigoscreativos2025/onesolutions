import fs from 'fs';

const i18nPath = 'lib/i18n.ts';
let i18nContent = fs.readFileSync(i18nPath, 'utf8');

const esTemplatesAdditions = `
    adminTemplates: {
      templatesAvailable: "Plantillas Disponibles",
      noTemplates: "No hay plantillas disponibles",
      createTemplate: "Crear Plantilla",
      editTemplate: "Editar Plantilla",
      sendTemplate: "Enviar Plantilla",
      templateTitle: "Título",
      templateTitlePlaceholder: "Ej: Bienvenida al cliente",
      templateContent: "Contenido",
      attachments: "Archivos adjuntos",
      uploading: "Subiendo...",
      attachFile: "Adjuntar archivo",
      roles: "Roles que pueden usarla",
      color: "Color (identificador visual)",
      sendTo: "Enviar Plantilla a...",
      dispatchModeProject: "Proyecto / Chat Específico",
      dispatchModeUser: "Usuario Directo",
      dispatchModeBroadcast: "Notificación Masiva (Broadcast)",
      searchChat: "Buscar chat (cliente o dirección)...",
      searchUser: "Buscar usuario...",
      broadcastTo: "Enviar a todos los usuarios",
      sending: "Enviando...",
      active: "Activa",
      inactive: "Inactiva",
      cancel: "Cancelar",
      save: "Guardar",
      send: "Enviar",
    },
`;

const enTemplatesAdditions = `
    adminTemplates: {
      templatesAvailable: "Available Templates",
      noTemplates: "No templates available",
      createTemplate: "Create Template",
      editTemplate: "Edit Template",
      sendTemplate: "Send Template",
      templateTitle: "Title",
      templateTitlePlaceholder: "Ex: Welcome to client",
      templateContent: "Content",
      attachments: "Attachments",
      uploading: "Uploading...",
      attachFile: "Attach file",
      roles: "Roles that can use it",
      color: "Color (visual identifier)",
      sendTo: "Send Template to...",
      dispatchModeProject: "Project / Specific Chat",
      dispatchModeUser: "Direct User",
      dispatchModeBroadcast: "Mass Notification (Broadcast)",
      searchChat: "Search chat (client or address)...",
      searchUser: "Search user...",
      broadcastTo: "Send to all users",
      sending: "Sending...",
      active: "Active",
      inactive: "Inactive",
      cancel: "Cancel",
      save: "Save",
      send: "Send",
    },
`;

// Insert in ES
const esStart = i18nContent.indexOf('adminInvoices: {');
i18nContent = i18nContent.substring(0, esStart) + esTemplatesAdditions + i18nContent.substring(esStart);

// Insert in EN
const enStart = i18nContent.lastIndexOf('adminInvoices: {');
i18nContent = i18nContent.substring(0, enStart) + enTemplatesAdditions + i18nContent.substring(enStart);

fs.writeFileSync(i18nPath, i18nContent, 'utf8');

const replaceInFile = (filePath: string, replacements: [RegExp | string, string][]) => {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [search, replace] of replacements) {
    content = content.replace(search, replace);
  }
  fs.writeFileSync(filePath, content, 'utf8');
};

// Patch ChatInterface.tsx
replaceInFile('components/chat/ChatInterface.tsx', [
  [/title="Plantillas Disponibles"/g, 'title={t.adminTemplates?.templatesAvailable || "Plantillas Disponibles"}'],
  [/No hay plantillas disponibles/g, '{t.adminTemplates?.noTemplates || "No hay plantillas disponibles"}']
]);

// Patch Templates page
replaceInFile('app/(app)/admin/templates/page.tsx', [
  [/<h1 className="font-headline text-2xl font-bold text-on-surface">\s*Plantillas\s*<\/h1>/g, '<h1 className="font-headline text-2xl font-bold text-on-surface">\n            {t.admin?.templates || "Plantillas"}\n          </h1>'],
  [/<p className="text-on-surface-variant">\s*Crea y gestiona plantillas para tu equipo\s*<\/p>/g, '<p className="text-on-surface-variant">{t.admin?.templatesDesc || "Crea y gestiona plantillas para tu equipo"}</p>'],
  [/>\s*<Plus className="w-5 h-5 mr-2" \/>\s*Crear Plantilla\s*<\/Button>/g, '>\n            <Plus className="w-5 h-5 mr-2" /> {t.adminTemplates?.createTemplate || "Crear Plantilla"} </Button>'],
  [/\{tmpl\.isActive \? "Activa" \: "Inactiva"\}/g, '{tmpl.isActive ? (t.adminTemplates?.active || "Activa") : (t.adminTemplates?.inactive || "Inactiva")}'],
  [/>\s*Enviar Plantilla\s*<\/Button>/g, '>{t.adminTemplates?.sendTemplate || "Enviar Plantilla"}</Button>'],
  [/title=\{editingTemplate \? "Editar Plantilla" \: "Crear Plantilla"\}/g, 'title={editingTemplate ? (t.adminTemplates?.editTemplate || "Editar Plantilla") : (t.adminTemplates?.createTemplate || "Crear Plantilla")}'],
  [/<label className="text-sm font-medium text-on-surface-variant">Título<\/label>/g, '<label className="text-sm font-medium text-on-surface-variant">{t.adminTemplates?.templateTitle || "Título"}</label>'],
  [/placeholder="Ej: Bienvenida al cliente"/g, 'placeholder={t.adminTemplates?.templateTitlePlaceholder || "Ej: Bienvenida al cliente"}'],
  [/<label className="text-sm font-medium text-on-surface-variant">Contenido<\/label>/g, '<label className="text-sm font-medium text-on-surface-variant">{t.adminTemplates?.templateContent || "Contenido"}</label>'],
  [/<h3 className="text-sm font-medium text-on-surface-variant mb-2">Archivos adjuntos<\/h3>/g, '<h3 className="text-sm font-medium text-on-surface-variant mb-2">{t.adminTemplates?.attachments || "Archivos adjuntos"}</h3>'],
  [/\{isUploading \? "Subiendo\.\.\." \: "Adjuntar archivo"\}/g, '{isUploading ? (t.adminTemplates?.uploading || "Subiendo...") : (t.adminTemplates?.attachFile || "Adjuntar archivo")}'],
  [/<h3 className="text-sm font-medium text-on-surface-variant mb-2">Roles que pueden usarla<\/h3>/g, '<h3 className="text-sm font-medium text-on-surface-variant mb-2">{t.adminTemplates?.roles || "Roles que pueden usarla"}</h3>'],
  [/<h3 className="text-sm font-medium text-on-surface-variant mb-2">Color \(identificador visual\)<\/h3>/g, '<h3 className="text-sm font-medium text-on-surface-variant mb-2">{t.adminTemplates?.color || "Color (identificador visual)"}</h3>'],
  [/>\s*Cancelar\s*<\/Button>/g, '>{t.adminTemplates?.cancel || "Cancelar"}</Button>'],
  [/>\s*Guardar\s*<\/Button>/g, '>{t.adminTemplates?.save || "Guardar"}</Button>'],
  [/title="Enviar Plantilla a\.\.\."/g, 'title={t.adminTemplates?.sendTo || "Enviar Plantilla a..."}'],
  [/>\s*Proyecto \/ Chat Específico\s*<\/button>/g, '>{t.adminTemplates?.dispatchModeProject || "Proyecto / Chat Específico"}</button>'],
  [/>\s*Usuario Directo\s*<\/button>/g, '>{t.adminTemplates?.dispatchModeUser || "Usuario Directo"}</button>'],
  [/>\s*Notificación Masiva \(Broadcast\)\s*<\/button>/g, '>{t.adminTemplates?.dispatchModeBroadcast || "Notificación Masiva (Broadcast)"}</button>'],
  [/placeholder="Buscar chat \(cliente o dirección\)\.\.\."/g, 'placeholder={t.adminTemplates?.searchChat || "Buscar chat (cliente o dirección)..."}'],
  [/placeholder="Buscar usuario\.\.\."/g, 'placeholder={t.adminTemplates?.searchUser || "Buscar usuario..."}'],
  [/>\s*Enviar a todos los usuarios\s*<\/p>/g, '>{t.adminTemplates?.broadcastTo || "Enviar a todos los usuarios"}</p>'],
  [/\{sending \? "Enviando\.\.\." \: "Enviar"\}/g, '{sending ? (t.adminTemplates?.sending || "Enviando...") : (t.adminTemplates?.send || "Enviar")}']
]);
console.log("Templates patched");
