import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AdminPage({
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
        Administración
      </h1>
      <p className="text-on-surface-variant">
        Gestión de usuarios, objeciones y métricas.
      </p>
    </div>
  );
}
