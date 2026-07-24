const fs = require('fs');
let code = fs.readFileSync('c:/Users/hende/Desktop/pasantia/onesolutions/lib/contract-templates.ts', 'utf8');

const correctFlatRoofing = `export const flatRoofingFields: ContractField[] = [
  { key: "dripEdgeColor", label: "Drip Edge Color", type: "text" },
  { key: "twoInchLeadBoots", label: "2in. Lead Boots", type: "text" },
  { key: "threeInchLeadBoots", label: "3in. Lead Boots", type: "text" },
  { key: "exhaustVents", label: "Exhaust Vents", type: "text" },
  { key: "offRidgeVents", label: "Off Ridge Vents", type: "text" },
  { key: "companySignature", label: "Company Signature", type: "signature" },
  { key: "companyDate", label: "Company Date", type: "date" },
  { key: "representativeSignature", label: "Representative Signature", type: "signature" },
  { key: "representativeDate", label: "Representative Date", type: "date" }
];`;

const correctRepresentantes = `export const representantesFields: ContractField[] = [
  { key: "companySignature", label: "Company Signature", type: "signature" },
  { key: "companyDate", label: "Company Date", type: "date" },
  { key: "representativeSignature", label: "Representative Signature", type: "signature" },
  { key: "representativeDate", label: "Representative Date", type: "date" }
];`;

code = code.replace(/export const flatRoofingFields: ContractField\[\] = \[[\s\S]*?\];/, correctFlatRoofing);
code = code.replace(/export const representantesFields: ContractField\[\] = \[[\s\S]*?\];/, correctRepresentantes);

fs.writeFileSync('c:/Users/hende/Desktop/pasantia/onesolutions/lib/contract-templates.ts', code);
console.log('Fixed syntax errors');
