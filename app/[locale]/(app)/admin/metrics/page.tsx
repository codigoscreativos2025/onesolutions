import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AdminMetricsPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = await params;
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-2xl font-bold text-on-surface">
        Métricas
      </h1>
      <p className="text-on-surface-variant">
        Métricas globales de la plataforma.
      </p>
    </div>
  );
}
