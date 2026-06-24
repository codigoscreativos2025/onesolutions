import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireAdmin(locale: string) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    redirect(`/${locale}/dashboard`);
  }

  return session;
}

export async function requireAuth(locale: string) {
  const session = await auth();

  if (!session) {
    redirect(`/${locale}/login`);
  }

  return session;
}
