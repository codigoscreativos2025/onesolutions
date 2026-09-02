import fs from 'fs';

const i18nPath = 'lib/i18n.ts';
let content = fs.readFileSync(i18nPath, 'utf8');

// Add specific strings to metrics section
const esMetricsAdditions = `
      doorsKnocked: "Puertas Tocadas",
      prospectsGenerated: "Prospectos Generados",
      projectsClosed: "Proyectos Cerrados",
      monthlyGoalLabel: "Meta Mensual",`;
const enMetricsAdditions = `
      doorsKnocked: "Doors Knocked",
      prospectsGenerated: "Prospects Generated",
      projectsClosed: "Projects Closed",
      monthlyGoalLabel: "Monthly Goal",`;

content = content.replace('      completed: "completado",', esMetricsAdditions + '\n      completed: "completado",');
content = content.replace('      completed: "completed",', enMetricsAdditions + '\n      completed: "completed",');
fs.writeFileSync(i18nPath, content, 'utf8');
console.log('i18n metrics patched');

const replaceInFile = (filePath: string, replacements: [RegExp | string, string][]) => {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [search, replace] of replacements) {
    content = content.replace(search, replace);
  }
  fs.writeFileSync(filePath, content, 'utf8');
};

replaceInFile('app/(app)/admin/metrics/page.tsx', [
  [/label="Puertas Tocadas"/g, 'label={t.metrics?.doorsKnocked || "Puertas Tocadas"}'],
  [/label="Prospectos Generados"/g, 'label={t.metrics?.prospectsGenerated || "Prospectos Generados"}'],
  [/label="Proyectos Cerrados"/g, 'label={t.metrics?.projectsClosed || "Proyectos Cerrados"}'],
  [/title="Puertas Tocadas"/g, 'title={t.metrics?.doorsKnocked || "Puertas Tocadas"}'],
  [/title="Prospectos Generados"/g, 'title={t.metrics?.prospectsGenerated || "Prospectos Generados"}'],
  [/title="Proyectos Cerrados"/g, 'title={t.metrics?.projectsClosed || "Proyectos Cerrados"}'],
  [/title="Objeciones Trainee"/g, 'title={t.metrics?.setterObjections || "Objeciones Trainee"}'],
  [/>\s*Meta Mensual\s*<\/span>/g, '> {t.metrics?.monthlyGoalLabel || "Meta Mensual"} </span>'],
  [/>\s*Mejor Trainee:\s*<\/p>/g, '> {t.metrics?.bestSetter || "Mejor Trainee"}: </p>'],
  [/>\s*Mejor Closer:\s*<\/p>/g, '> {t.metrics?.bestCloser || "Mejor Closer"}: </p>'],
  [/>\s*Sin objeciones registradas\s*<\/p>/g, '> {t.metrics?.noObjections || "Sin objeciones registradas"} </p>']
]);
console.log('metrics page patched');
