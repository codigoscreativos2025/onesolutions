const fs = require('fs');
let code = fs.readFileSync('components/chat/ChatInterface.tsx', 'utf8');

code = code.replace(
  /\{selectedRoom\.personalUser\?\.phone && \([\s\S]*?<\/div>\s*\)\}/,
  `<div>\n                            <p className="text-xs text-on-surface-variant mb-1 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Teléfono</p>\n                            <p className="text-sm">{selectedRoom.personalUser?.phone || "No registrado"}</p>\n                          </div>`
);

fs.writeFileSync('components/chat/ChatInterface.tsx', code, 'utf8');
console.log("Fixed phone field");
