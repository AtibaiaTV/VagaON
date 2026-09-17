import Link from "next/link";
import { Flame, MessageCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Logo from "@/components/layout/Logo";
import SinoNotificacoes from "@/components/notificacoes/SinoNotificacoes";

export default async function Navbar() {
  const session = await auth();
  const usaMatch = session && session.user.role !== "admin";

  return (
    <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
        <Link href="/" className="shrink-0">
          <Logo size="md" />
        </Link>

        <nav className="hidden md:flex items-center gap-1 flex-1">
          {usaMatch && (
            <>
              <Link href="/descobrir">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Flame className="h-4 w-4 text-primary" />
                  Descobrir
                </Button>
              </Link>
              <Link href="/matches">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  Matches
                </Button>
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {usaMatch && (
            <Link href="/descobrir" className="md:hidden">
              <Button variant="ghost" size="sm" aria-label="Descobrir">
                <Flame className="h-5 w-5 text-primary" />
              </Button>
            </Link>
          )}
          {session ? (
            <>
              <SinoNotificacoes />
              <Link href="/painel">
                <Button size="sm">Meu painel</Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/entrar">
                <Button variant="ghost" size="sm">Entrar</Button>
              </Link>
              <Link href="/cadastro">
                <Button size="sm" className="px-3 sm:px-5">
                  <span className="sm:hidden">Cadastrar</span>
                  <span className="hidden sm:inline">Cadastre-se grátis</span>
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
