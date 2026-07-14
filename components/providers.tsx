"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { LocaleProvider } from "@/lib/locale-context";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <LocaleProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <Toaster richColors position="top-center" />
          {children}
        </ThemeProvider>
      </LocaleProvider>
    </SessionProvider>
  );
}
