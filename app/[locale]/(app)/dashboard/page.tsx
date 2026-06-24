import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <section className="mb-6">
        <h1 className="font-headline text-2xl font-bold text-on-surface">
          Dashboard
        </h1>
        <p className="text-on-surface-variant">
          Bienvenido, {session?.user?.name}
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Puertas Tocadas" value="42" trend="+12%" />
        <MetricCard title="Leads Generados" value="8" trend="+4" />
        <MetricCard title="Proyectos Cerrados" value="3" trend="Target Met" />
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  trend,
}: {
  title: string;
  value: string;
  trend: string;
}) {
  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between min-h-[140px]">
      <div className="flex justify-between items-start">
        <div className="bg-primary/10 p-3 rounded-xl text-primary">
          <span className="font-bold">OS</span>
        </div>
        <span className="text-sm text-primary font-medium">{trend}</span>
      </div>
      <div className="mt-4">
        <h3 className="text-on-surface-variant text-sm uppercase tracking-wider font-semibold">
          {title}
        </h3>
        <p className="font-display text-4xl font-bold text-on-surface mt-1">
          {value}
        </p>
      </div>
    </div>
  );
}
