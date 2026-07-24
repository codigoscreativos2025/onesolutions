const fs = require('fs');
let code = fs.readFileSync('c:/Users/hende/Desktop/pasantia/onesolutions/lib/contract-templates.ts', 'utf8');

const correctW9 = `export const w9Fields: ContractField[] = [
  { key: "name", label: "Name", type: "text" },
  { key: "businessName", label: "Business Name", type: "text" },
  { key: "taxClassification", label: "Tax Classification", type: "text" },
  { key: "llcTaxClassification", label: "LLC Tax Classification", type: "text" },
  { key: "otherTaxClassification", label: "Other Tax Classification", type: "text" },
  { key: "hasForeignPartners", label: "Has Foreign Partners", type: "text" },
  { key: "exemptPayeeCode", label: "Exempt Payee Code", type: "text" },
  { key: "fatcaExemptionCode", label: "FATCA Exemption Code", type: "text" },
  { key: "address", label: "Address", type: "text" },
  { key: "cityStateZip", label: "City, State, Zip", type: "text" },
  { key: "requesterNameAddress", label: "Requester Name/Address", type: "text" },
  { key: "accountNumbers", label: "Account Numbers", type: "text" },
  { key: "ssn1", label: "SSN 1", type: "text" },
  { key: "ssn2", label: "SSN 2", type: "text" },
  { key: "ssn3", label: "SSN 3", type: "text" },
  { key: "ssn4", label: "SSN 4", type: "text" },
  { key: "ssn5", label: "SSN 5", type: "text" },
  { key: "ssn6", label: "SSN 6", type: "text" },
  { key: "ssn7", label: "SSN 7", type: "text" },
  { key: "ssn8", label: "SSN 8", type: "text" },
  { key: "ssn9", label: "SSN 9", type: "text" },
  { key: "ein1", label: "EIN 1", type: "text" },
  { key: "ein2", label: "EIN 2", type: "text" },
  { key: "ein3", label: "EIN 3", type: "text" },
  { key: "ein4", label: "EIN 4", type: "text" },
  { key: "ein5", label: "EIN 5", type: "text" },
  { key: "ein6", label: "EIN 6", type: "text" },
  { key: "ein7", label: "EIN 7", type: "text" },
  { key: "ein8", label: "EIN 8", type: "text" },
  { key: "ein9", label: "EIN 9", type: "text" },
  { key: "signatureField", label: "Signature", type: "signature" },
  { key: "date", label: "Date", type: "date" }
];`;

code = code.replace(/export const w9Fields: ContractField\[\] = \[[\s\S]*?\];/, correctW9);

fs.writeFileSync('c:/Users/hende/Desktop/pasantia/onesolutions/lib/contract-templates.ts', code);
console.log('Fixed syntax errors');
