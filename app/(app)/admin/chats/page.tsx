import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ChatInterface } from "@/components/chat/ChatInterface";

export default async function AdminChatsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const room = searchParams.room;
  const initialRoomId = room && typeof room === 'string' ? parseInt(room) : null;

  return <ChatInterface isAdmin initialRoomId={initialRoomId} />;
}
