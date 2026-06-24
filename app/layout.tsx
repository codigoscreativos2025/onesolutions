import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "One Solutions",
  description: "Lead and visit management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
