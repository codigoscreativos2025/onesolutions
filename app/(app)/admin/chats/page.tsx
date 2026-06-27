import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ChatInterface } from "@/components/chat/ChatInterface";

export default async function AdminChatsPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <ChatInterface isAdmin />;
}
