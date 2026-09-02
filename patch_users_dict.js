const fs = require('fs');

function patchDictionary(content, lang, dictObj) {
  const start = content.indexOf("const " + lang + " = {");
  if (start === -1) return content;
  
  const target = 'adminUsers: {';
  const blockStart = content.indexOf(target, start);
  if (blockStart === -1) return content;
  
  const endBlock = content.indexOf('},', blockStart);
  
  let newFields = '\\n';
  for (const [k, v] of Object.entries(dictObj)) {
    newFields += '      ' + k + ': "' + v + '",\\n';
  }
  
  return content.substring(0, endBlock) + newFields + content.substring(endBlock);
}

let s = fs.readFileSync('lib/i18n.ts', 'utf8');

const newEs = {
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
  noCloser: "Sin closer"
};

const newEn = {
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
  noCloser: "No closer"
};

s = patchDictionary(s, 'es', newEs);
s = patchDictionary(s, 'en', newEn);

fs.writeFileSync('lib/i18n.ts', s);
console.log('Dictionaries patched');
