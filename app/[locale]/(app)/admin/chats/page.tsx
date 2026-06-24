import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ChatInterface } from "@/components/chat/ChatInterface";

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

  return <ChatInterface isAdmin />;
}
