import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "VagaON — Vagas para Gastronomia, Hotelaria e Eventos",
  description:
    "Plataforma de conexão entre profissionais e empresas dos setores de gastronomia, hotelaria e eventos. Vagas CLT, temporárias e sazonais.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={cn("font-sans", inter.variable)}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
