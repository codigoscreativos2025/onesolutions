import re

with open('app/(app)/metrics/page.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace('const role = session?.user?.role || \"\";', 'const { t } = useLocale();\n  const role = session?.user?.role || \"\";')
code = code.replace('<NotificationsSection />', '<NotificationsSection t={t} />')
code = code.replace('<PersonalView data={personalData || ({} as PersonalMetrics)} isAdmin={isAdmin} adminData={adminData || undefined} />', '<PersonalView data={personalData || ({} as PersonalMetrics)} isAdmin={isAdmin} adminData={adminData || undefined} t={t} />')
code = code.replace('<AdminView data={adminData} />', '<AdminView data={adminData} t={t} />')
code = code.replace('<AdminExtraViews data={adminData} />', '<AdminExtraViews data={adminData} t={t} />')
code = code.replace('<ChartsSection isAdmin={isAdmin} />', '<ChartsSection isAdmin={isAdmin} t={t} />')

code = code.replace('function PersonalView({ data, isAdmin, adminData }: { data: PersonalMetrics, isAdmin?: boolean, adminData?: AdminMetrics })', 'function PersonalView({ data, isAdmin, adminData, t }: { data: PersonalMetrics, isAdmin?: boolean, adminData?: AdminMetrics, t: any })')
code = code.replace('function AdminExtraViews({ data }: { data: AdminMetrics })', 'function AdminExtraViews({ data, t }: { data: AdminMetrics, t: any })')
code = code.replace('function AdminView({ data }: { data: AdminMetrics })', 'function AdminView({ data, t }: { data: AdminMetrics, t: any })')
code = code.replace('function NotificationsSection()', 'function NotificationsSection({ t }: { t: any })')
code = code.replace('function ChartsSection({ isAdmin }: { isAdmin: boolean })', 'function ChartsSection({ isAdmin, t }: { isAdmin: boolean, t: any })')

code = code.replace('\"Puertas Tocadas Globales\"', 't.dashboard.globalDoorsKnocked')
code = code.replace('\"Mis Puertas Tocadas\"', 't.dashboard.myDoorsKnocked')
code = code.replace('\"Leads Generados Globales\"', 't.dashboard.globalLeads')
code = code.replace('\"Mis Leads Generados\"', 't.dashboard.myLeads')
code = code.replace('\"Proyectos Cerrados Globales\"', 't.dashboard.globalProjects')
code = code.replace('\"Mis Proyectos Cerrados\"', 't.dashboard.myProjects')

code = code.replace('Facturacion Global', '{t.dashboard.globalBilling}')
code = code.replace('Total proyectos cerrados', '{t.dashboard.totalProjectsClosed}')
code = code.replace('Top 3 Closers', '{t.dashboard.top3Closers}')
code = code.replace('Top 3 Trainees / Setters', '{t.dashboard.top3Setters}')
code = code.replace('Feed\n', '{t.dashboard.feed}\n')
code = code.replace('Estadisticas\n', '{t.dashboard.statistics}\n')
code = code.replace('Tipos de Proyecto', '{t.dashboard.projectTypes}')
code = code.replace('Leads Generados (ultimos 7 dias)', '{t.dashboard.leadsLast7Days}')

with open('app/(app)/metrics/page.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
