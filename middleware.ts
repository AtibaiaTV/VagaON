import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Rotas que exigem autenticação e role específica
const rotasProfissional = ["/painel", "/perfil", "/candidaturas"];
const rotasEmpresa = ["/painel", "/perfil", "/profissionais"];
const rotasAdmin = ["/admin"];

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const pathname = nextUrl.pathname;

  // Rota do admin — exige role admin
  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/entrar", nextUrl));
    }
    if (session.user.role !== "admin") {
      return NextResponse.redirect(new URL("/painel", nextUrl));
    }
  }

  // Páginas autenticadas genéricas (painel, perfil, candidaturas, profissionais)
  const rotasProtegidas = ["/painel", "/perfil", "/candidaturas", "/profissionais"];
  const estaEmRotaProtegida = rotasProtegidas.some((rota) =>
    pathname.startsWith(rota)
  );

  if (estaEmRotaProtegida && !session) {
    return NextResponse.redirect(new URL("/entrar", nextUrl));
  }

  // Empresa não pode acessar /candidaturas (isso é área do profissional)
  if (pathname.startsWith("/candidaturas") && session?.user.role === "empresa") {
    return NextResponse.redirect(new URL("/painel", nextUrl));
  }

  // Profissional não pode acessar /profissionais (busca de candidatos — área da empresa)
  if (
    pathname.startsWith("/profissionais") &&
    session?.user.role === "profissional"
  ) {
    return NextResponse.redirect(new URL("/painel", nextUrl));
  }

  // Redireciona usuário já logado que tenta acessar /entrar ou /cadastro
  if (
    session &&
    (pathname.startsWith("/entrar") || pathname.startsWith("/cadastro"))
  ) {
    return NextResponse.redirect(new URL("/painel", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
