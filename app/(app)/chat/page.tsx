"use client";

import { useSearchParams } from "next/navigation";
import { ChatInterface } from "@/components/chat/ChatInterface";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room");
  return <ChatInterface initialRoomId={roomId ? parseInt(roomId) : null} />;
}
