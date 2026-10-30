import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Touba Gaz — Parc Informatique",
  description: "Système de gestion du parc informatique et assistance Touba Gaz",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
