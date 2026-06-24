import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AdminChatsPage({
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
        Chats
      </h1>
      <p className="text-on-surface-variant">
        Monitoreo de chats internos de proyectos aprobados.
      </p>
    </div>
  );
}
