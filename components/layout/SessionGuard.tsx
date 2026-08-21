"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      signOut({ callbackUrl: "/login?error=SessionExpired", redirect: true });
    }
  }, [status, router]);

  return <>{children}</>;
}
