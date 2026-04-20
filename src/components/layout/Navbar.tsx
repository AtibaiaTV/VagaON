import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Logo from "@/components/layout/Logo";

export default async function Navbar() {
  const session = await auth();

  return (
    <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between gap-6">
        <Link href="/" className="shrink-0">
          <Logo size="md" />
        </Link>

        <nav className="hidden md:flex items-center gap-1 flex-1">
          <Link href="/vagas" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors">
            Vagas
          </Link>
          <Link href="/cadastro/empresa" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors">
            Para empresas
          </Link>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {session ? (
            <Link href="/painel">
              <Button size="sm">Meu painel</Button>
            </Link>
          ) : (
            <>
              <Link href="/entrar">
                <Button variant="ghost" size="sm">Entrar</Button>
              </Link>
              <Link href="/cadastro">
                <Button size="sm" className="px-5">Cadastre-se grátis</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
