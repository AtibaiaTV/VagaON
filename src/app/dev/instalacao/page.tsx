import { notFound } from "next/navigation";
import Link from "next/link";
import BannerInstalacao from "@/components/pwa/BannerInstalacao";
import CardInstalarApp from "@/components/pwa/CardInstalarApp";

/**
 * Playground do convite de instalação — sem login. Só fora de produção.
 * `?simularInstalacao=android|ios|desktop` força a plataforma (o
 * `beforeinstallprompt` real só dispara em produção, com o service worker).
 */
export default function InstalacaoDevPage({ searchParams }: { searchParams: { simularInstalacao?: string } }) {
  if (process.env.NODE_ENV === "production") notFound();
  const atual = searchParams.simularInstalacao ?? "(real)";

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <div style={{ backgroundColor: "#143f28" }} className="py-3">
        <div className="max-w-md mx-auto px-4 flex items-center justify-between text-white text-sm">
          <span className="font-bold">DEV · Instalação ({atual})</span>
          <span className="flex gap-3 text-white/80 underline">
            <Link href="/dev/instalacao?simularInstalacao=android">android</Link>
            <Link href="/dev/instalacao?simularInstalacao=ios">ios</Link>
            <Link href="/dev/instalacao">real</Link>
          </span>
        </div>
      </div>
      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          O banner aparece no rodapé ~2,5 s depois de carregar (se não foi dispensado nos últimos 14 dias — limpe o
          localStorage para ver de novo). Abaixo, o card que fica na página de perfil.
        </p>
        <CardInstalarApp />
        <div className="h-[70vh]" />
      </main>
      <BannerInstalacao />
    </div>
  );
}
