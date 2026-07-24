const fs = require('fs');
let code = fs.readFileSync('c:/Users/hende/Desktop/pasantia/onesolutions/lib/contract-templates.ts', 'utf8');

// Fix escaped template literals
code = code.replace(/\\\$\{/g, '${');
code = code.replace(/\\\`/g, '`');

fs.writeFileSync('c:/Users/hende/Desktop/pasantia/onesolutions/lib/contract-templates.ts', code);
console.log('Fixed syntax errors');
