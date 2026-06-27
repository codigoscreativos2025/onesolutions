import type { Metadata } from "next";
import { getMessages } from "next-intl/server";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "One Solutions",
  description: "Lead and visit management",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        <Providers messages={messages} locale="es">
          {children}
        </Providers>
      </body>
    </html>
  );
}
