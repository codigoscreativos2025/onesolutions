import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import esMessages from "@/messages/es.json";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "One Solutions",
  description: "Lead and visit management",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">
        <Providers messages={esMessages} locale="es">
          {children}
        </Providers>
      </body>
    </html>
  );
}
