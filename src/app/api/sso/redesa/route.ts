import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/lib/auth";
import { verificarTokenCrossPlatform } from "@/lib/cross-platform-auth";
import { ErroAtor } from "@/lib/servicos/erros";
import { garantirContaRedesa, VALIDADE_TOKEN_SSO } from "@/lib/servicos/sso-redesa";

export const dynamic = "force-dynamic";

/**
 * POST /api/sso/redesa — entrada do dono do estabelecimento vindo do
 * backoffice da RedeSA, já logado lá. Recebe um formulário (não query string:
 * o token carrega e-mail e telefone, e query string vai parar em log e
 * referer) com `token` e, opcionalmente, `destino`, um caminho interno.
 *
 * Fluxo: valida o token e garante a conta primeiro, para poder mandar a
 * pessoa a uma página de erro legível; só então chama o signIn do NextAuth,
 * que repete a validação (é idempotente) e grava o cookie de sessão.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const token = form?.get("token");
  const destino = caminhoInterno(form?.get("destino"));

  if (typeof token !== "string" || !token) return paraErro(req, "token");

  try {
    const payload = verificarTokenCrossPlatform(token, { maxAge: VALIDADE_TOKEN_SSO });
    await garantirContaRedesa(payload);
  } catch (err) {
    if (err instanceof ErroAtor) {
      // A mensagem tem e-mail: fica no log, e só o código vai para a URL.
      console.warn("[SSO RedeSA]", err.status, err.message);
      return paraErro(req, err.status === 409 ? "email-em-uso" : err.status === 403 ? "suspensa" : "dados");
    }
    console.warn("[SSO RedeSA] token recusado:", err instanceof Error ? err.message : err);
    return paraErro(req, "token");
  }

  // Fora do try: o signIn conclui com um redirect interno do Next (NEXT_REDIRECT),
  // que precisa subir até o framework, não ser engolido.
  await signIn("redesa", { token, redirectTo: destino });
}

export async function GET(req: NextRequest) {
  return paraErro(req, "metodo");
}

/** Só caminhos dentro do site: nada de open redirect via `destino`. */
function caminhoInterno(v: FormDataEntryValue | null | undefined): string {
  if (typeof v !== "string") return "/painel";
  const s = v.trim();
  if (!s.startsWith("/") || s.startsWith("//") || s.includes("\\") || s.length > 300) return "/painel";
  return s;
}

function paraErro(req: NextRequest, motivo: string) {
  return NextResponse.redirect(new URL(`/entrar/redesa?motivo=${motivo}`, req.nextUrl), 303);
}
