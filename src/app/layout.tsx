import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import RegistrarSW from "@/components/pwa/RegistrarSW";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "VagaON — Vagas para Gastronomia, Hotelaria e Eventos",
  description:
    "Plataforma de conexão entre profissionais e empresas dos setores de gastronomia, hotelaria e eventos. Vagas CLT, temporárias e sazonais.",
  manifest: "/manifest.webmanifest",
  applicationName: "VagaON",
  appleWebApp: {
    capable: true,
    title: "VagaON",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a5c38",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={cn("font-sans", inter.variable)}>
      <body className={inter.className}>
        {/* `beforeinstallprompt` dispara antes de o React montar: guarda o evento
            para o banner de instalação (components/pwa) e segura o mini-aviso
            padrão do Chrome, que o banner substitui. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__promptInstalacaoPWA=e;window.dispatchEvent(new Event('vagaon:instalavel'));});",
          }}
        />
        {children}
        <RegistrarSW />
      </body>
    </html>
  );
}
