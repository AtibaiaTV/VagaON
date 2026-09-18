import Link from "next/link";
import Logo from "@/components/layout/Logo";

/**
 * Página de erro do SSO da RedeSA. O motivo chega como código, nunca como
 * texto — a mensagem original pode conter e-mail e fica só no log do servidor.
 */

const MOTIVOS: Record<string, { titulo: string; texto: string }> = {
  token: {
    titulo: "Link expirado",
    texto: "O acesso vindo da RedeSA vale por poucos minutos. Volte ao backoffice e clique de novo em Gerenciar vagas.",
  },
  "email-em-uso": {
    titulo: "E-mail já usado em outra conta",
    texto:
      "O e-mail do estabelecimento na RedeSA já tem conta de profissional no VagaON. Troque o e-mail do estabelecimento no cadastro da RedeSA, ou entre com a senha do VagaON.",
  },
  dados: {
    titulo: "Cadastro incompleto na RedeSA",
    texto: "O estabelecimento precisa ter e-mail cadastrado na RedeSA para ter conta no VagaON. Complete lá e tente de novo.",
  },
  suspensa: {
    titulo: "Conta suspensa",
    texto: "Esta conta está suspensa no VagaON. Fale com o suporte para reativar.",
  },
  metodo: {
    titulo: "Endereço incompleto",
    texto: "Esta página só abre a partir do botão no backoffice da RedeSA.",
  },
};

export default function EntrarRedesaPage({ searchParams }: { searchParams: { motivo?: string } }) {
  const motivo = MOTIVOS[searchParams.motivo ?? ""] ?? MOTIVOS.token;

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[#f4f7f5]">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo size="md" />
        </div>
        <div className="bg-white rounded-2xl border border-border/40 shadow-sm p-6">
          <h1 className="text-xl font-bold text-foreground">{motivo.titulo}</h1>
          <p className="text-sm text-muted-foreground mt-2">{motivo.texto}</p>
          <div className="mt-6 flex flex-col gap-2 text-sm">
            <a
              href="https://backoffice.redesa.com.br/professionals"
              className="inline-flex justify-center rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:bg-primary/90"
            >
              Voltar ao backoffice da RedeSA
            </a>
            <Link href="/entrar" className="inline-flex justify-center rounded-lg border px-4 py-2.5 font-medium hover:bg-muted">
              Entrar com e-mail e senha
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
