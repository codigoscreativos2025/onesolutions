const fs = require('fs');

let p = 'app/(app)/admin/users/page.tsx';
let s = fs.readFileSync(p, 'utf8');

// The replacement logic
s = s.replace(
  'title={editingUser ? "Editar Usuario" : "Nuevo Usuario"}',
  'title={editingUser ? t.adminUsers?.editUser || "Editar Usuario" : t.adminUsers?.newUser || "Nuevo Usuario"}'
);

s = s.replace(
  'Sin foto',
  '{t.adminUsers?.noPhoto || "Sin foto"}'
);

s = s.replace(
  'Cambiar foto" : "Subir foto',
  'Cambiar foto" : "Subir foto' // Wait, I need a better regex for this.
);
s = s.replace(
  'profilePhotoPreview ? "Cambiar foto" : "Subir foto"',
  'profilePhotoPreview ? t.adminUsers?.changePhoto || "Cambiar foto" : t.adminUsers?.uploadPhoto || "Subir foto"'
);

s = s.replace(
  'Eliminar foto',
  '{t.adminUsers?.deletePhoto || "Eliminar foto"}'
);

s = s.replace(
  'label="Nombre"',
  'label={t.adminUsers?.nameLabel || "Nombre"}'
);

s = s.replace(
  'label="Email"',
  'label={t.adminUsers?.emailLabel || "Email"}'
);

s = s.replace(
  'label={editingUser ? "Nueva contraseña (opcional)" : "Contraseña"}',
  'label={editingUser ? t.adminUsers?.passwordOptional || "Nueva contraseña (opcional)" : t.adminUsers?.passwordLabel || "Contraseña"}'
);

s = s.replace(
  'label="Rol"',
  'label={t.adminUsers?.roleLabel || "Rol"}'
);

s = s.replace(
  'label="Closer asignado"',
  'label={t.adminUsers?.closerLabel || "Closer asignado"}'
);

s = s.replace(
  'Información Adicional',
  '{t.adminUsers?.additionalInfo || "Información Adicional"}'
);

s = s.replace(
  'label="Teléfono"',
  'label={t.adminUsers?.phoneLabel || "Teléfono"}'
);

s = s.replace(
  'label="Dirección"',
  'label={t.adminUsers?.addressLabel || "Dirección"}'
);

s = s.replace(
  'label="Fecha de Nacimiento"',
  'label={t.adminUsers?.dobLabel || "Fecha de Nacimiento"}'
);

s = s.replace(
  'label="SSN (Social Security Number)"',
  'label={t.adminUsers?.ssnLabel || "SSN (Social Security Number)"}'
);

s = s.replace(
  'label="Nombre del Banco"',
  'label={t.adminUsers?.bankName || "Nombre del Banco"}'
);

s = s.replace(
  'label="Routing Number"',
  'label={t.adminUsers?.routingNumber || "Routing Number"}'
);

s = s.replace(
  'label="Zelle"',
  'label={t.adminUsers?.zelle || "Zelle"}'
);

s = s.replace(
  'label="Número de Cuenta"',
  'label={t.adminUsers?.accountNumber || "Número de Cuenta"}'
);

s = s.replace(
  'Estos datos son privados. Solo el usuario y el administrador\\n              pueden verlos desde el perfil.',
  '{t.adminUsers?.privateDataNote || "Estos datos son privados. Solo el usuario y el administrador pueden verlos desde el perfil."}'
);

s = s.replace(
  'Usuario activo',
  '{t.adminUsers?.isActiveUser || "Usuario activo"}'
);

s = s.replace(
  'Enviar email de configuración de cuenta',
  '{t.adminUsers?.sendOnboarding || "Enviar email de configuración de cuenta"}'
);

s = s.replace(
  'label: "Sin closer"',
  'label: t.adminUsers?.noCloser || "Sin closer"'
);

fs.writeFileSync(p, s);
console.log('Appended modal fields');
