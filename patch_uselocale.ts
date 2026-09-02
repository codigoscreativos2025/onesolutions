import fs from 'fs';

const patchFile = (filePath: string, componentName: string) => {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('useLocale')) {
    content = content.replace('import { useState', 'import { useLocale } from "@/lib/locale-context";\nimport { useState');
  }
  if (!content.includes('const { t } = useLocale()')) {
    const componentRegex = new RegExp(`export default function ${componentName}\\s*\\([^)]*\\)\\s*\\{`);
    content = content.replace(componentRegex, (match) => match + '\n  const { t } = useLocale();\n');
  }
  fs.writeFileSync(filePath, content, 'utf8');
};

patchFile('app/(app)/admin/emails/page.tsx', 'AdminEmailsPage');
patchFile('app/(app)/admin/invoices/page.tsx', 'AdminInvoicesPage');
console.log('patched');
