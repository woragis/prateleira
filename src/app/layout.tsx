import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prateleira — gestão para mercadinhos",
  description:
    "SaaS de estoque, lotes, PDV e equipe para mercearias. Trial 14 dias. Assinatura via Stripe.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
