"use client";

import { ThemeProvider } from "next-themes";
import { NextIntlClientProvider } from "next-intl";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export function Providers({
  children,
  messages,
  locale,
}: {
  children: ReactNode;
  messages: Record<string, unknown>;
  locale: string;
}) {
  return (
    <SessionProvider>
      <NextIntlClientProvider messages={messages} locale={locale}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </NextIntlClientProvider>
    </SessionProvider>
  );
}
