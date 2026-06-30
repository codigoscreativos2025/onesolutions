"use client";

import { NextIntlClientProvider } from "next-intl";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";

type Messages = typeof import("../messages/es.json");

export function Providers({
  children,
  messages,
  locale,
}: {
  children: ReactNode;
  messages: Messages;
  locale: string;
}) {
  return (
    <SessionProvider>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </NextIntlClientProvider>
    </SessionProvider>
  );
}
