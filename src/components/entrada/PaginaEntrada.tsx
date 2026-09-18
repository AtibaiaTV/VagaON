import type { ReactNode } from "react";
import Link from "next/link";
import Logo from "@/components/layout/Logo";

/** Moldura das páginas de entrada rápida: leve, mobile-first, sem menu. */
export default function PaginaEntrada({
  titulo,
  subtitulo,
  icone,
  children,
}: {
  titulo: string;
  subtitulo: string;
  icone: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <div style={{ backgroundColor: "#1a5c38" }} className="py-6">
        <div className="max-w-lg mx-auto px-4 flex items-center justify-between">
          <Link href="/">
            <Logo size="sm" variant="white" />
          </Link>
          <Link href="/entrar" className="text-white/80 text-sm font-medium hover:text-white">
            Já tenho conta
          </Link>
        </div>
      </div>
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">{icone}</div>
          <div>
            <h1 className="text-xl font-bold leading-tight">{titulo}</h1>
            <p className="text-sm text-muted-foreground mt-1">{subtitulo}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-border/40 p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
