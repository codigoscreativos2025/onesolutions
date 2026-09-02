const fs = require('fs');

let s = fs.readFileSync('lib/i18n.ts', 'utf8');

const newEs = `adminUsers: {
      nameLabel: "Nombre",
      emailLabel: "Email",
      passwordOptional: "Nueva contraseña (opcional)",
      passwordLabel: "Contraseña",
      roleLabel: "Rol",
      closerLabel: "Closer asignado",
      additionalInfo: "Información Adicional",
      phoneLabel: "Teléfono",
      addressLabel: "Dirección",
      dobLabel: "Fecha de Nacimiento",
      ssnLabel: "SSN (Social Security Number)",
      bankName: "Nombre del Banco",
      routingNumber: "Routing Number",
      zelle: "Zelle",
      accountNumber: "Número de Cuenta",
      privateDataNote: "Estos datos son privados. Solo el usuario y el administrador pueden verlos desde el perfil.",
      isActiveUser: "Usuario activo",
      sendOnboarding: "Enviar email de configuración de cuenta",
      noPhoto: "Sin foto",
      changePhoto: "Cambiar foto",
      uploadPhoto: "Subir foto",
      deletePhoto: "Eliminar foto",
      noCloser: "Sin closer",`;

const newEn = `adminUsers: {
      nameLabel: "Name",
      emailLabel: "Email",
      passwordOptional: "New password (optional)",
      passwordLabel: "Password",
      roleLabel: "Role",
      closerLabel: "Assigned closer",
      additionalInfo: "Additional Information",
      phoneLabel: "Phone",
      addressLabel: "Address",
      dobLabel: "Date of Birth",
      ssnLabel: "SSN (Social Security Number)",
      bankName: "Bank Name",
      routingNumber: "Routing Number",
      zelle: "Zelle",
      accountNumber: "Account Number",
      privateDataNote: "These data are private. Only the user and admin can see them from the profile.",
      isActiveUser: "Active user",
      sendOnboarding: "Send account setup email",
      noPhoto: "No photo",
      changePhoto: "Change photo",
      uploadPhoto: "Upload photo",
      deletePhoto: "Delete photo",
      noCloser: "No closer",`;

let idxEs = s.indexOf('adminUsers:', s.indexOf('const es = {'));
s = s.substring(0, idxEs) + newEs + s.substring(s.indexOf('{', idxEs) + 1);

let idxEn = s.indexOf('adminUsers:', s.indexOf('const en = {'));
s = s.substring(0, idxEn) + newEn + s.substring(s.indexOf('{', idxEn) + 1);

fs.writeFileSync('lib/i18n.ts', s);
console.log('Dictionaries patched');
