import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { PLANOS, RECURSOS_PLANO, formatarPreco, planosAtivos } from "@/lib/planos";
import { acessoDaEmpresa } from "@/lib/servicos/planos";
import Empresa from "@/models/Empresa";
import { filtroEmpresaDoUsuario } from "@/lib/servicos/equipe";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BotaoInteresse from "./BotaoInteresse";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Planos para empresas — VagaON",
  description: "Publique vagas grátis. Assine o Pro para buscar no banco de currículos, usar o Descobrir sem limite e triar com IA.",
};

/** Página pública de planos. Para o profissional nada muda: é sempre grátis. */
export default async function PlanosPage() {
  const session = await auth();
  const ativos = planosAtivos();

  let situacao: { plano: string; motivo: string; ate: string | null; interesse: boolean } | null = null;
  if (session?.user.role === "empresa") {
    await connectDB();
    const empresa = await Empresa.findOne(filtroEmpresaDoUsuario(session.user.id)).select("assinatura").lean();
    if (empresa) {
      const a = acessoDaEmpresa(empresa);
      situacao = {
        plano: a.plano,
        motivo: a.motivo,
        ate: a.ate ? a.ate.toLocaleDateString("pt-BR") : null,
        interesse: Boolean(empresa.assinatura?.interesseEm),
      };
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <Navbar />

      <div style={{ backgroundColor: "#143f28" }} className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-white">Planos para empresas</h1>
          <p className="text-white/70 mt-2 max-w-2xl mx-auto">
            Publicar vaga e receber candidatos é grátis. O Pro é para quem contrata sempre: busca ativa no banco de
            currículos, Descobrir sem limite e triagem com IA. Para o profissional, o VagaON é sempre gratuito.
          </p>
          {!ativos && (
            <p className="inline-block mt-4 text-xs font-semibold text-[#4ade80] bg-white/10 border border-white/20 rounded-full px-3 py-1">
              Durante o lançamento, todos os recursos estão liberados para todas as empresas.
            </p>
          )}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {situacao && ativos && (
          <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm">
            {situacao.plano === "pro" ? (
              <>
                <span className="font-semibold">Sua empresa está no Pro</span>
                {situacao.motivo === "trial" ? " (período de teste)" : ""}
                {situacao.ate ? ` até ${situacao.ate}.` : "."}
              </>
            ) : (
              <>
                <span className="font-semibold">Sua empresa está no plano Grátis.</span> Quem se candidatou às suas vagas continua
                visível no funil.
              </>
            )}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          {(["gratis", "pro"] as const).map((id) => {
            const p = PLANOS[id];
            const destaque = id === "pro";
            return (
              <section
                key={id}
                className={`rounded-2xl border bg-white p-6 flex flex-col ${destaque ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
              >
                <h2 className="text-lg font-bold">{p.nome}</h2>
                <p className="text-sm text-muted-foreground mt-1">{p.descricao}</p>
                <p className="mt-4">
                  <span className="text-3xl font-bold">{formatarPreco(p.precoMensal)}</span>
                  {p.precoMensal !== null && <span className="text-sm text-muted-foreground"> /mês</span>}
                </p>
                {p.precoTemporada !== null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ou passe de temporada: {formatarPreco(p.precoTemporada)} por 30 dias, sem mensalidade
                  </p>
                )}

                <ul className="mt-5 space-y-2 text-sm flex-1">
                  {RECURSOS_PLANO.map((r) => {
                    const valor = id === "gratis" ? r.gratis : r.pro;
                    const fora = valor === "—";
                    return (
                      <li key={r.chave} className={`flex items-start gap-2 ${fora ? "text-muted-foreground" : ""}`}>
                        {fora ? <Minus className="h-4 w-4 mt-0.5 shrink-0" /> : <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />}
                        <span>
                          {r.rotulo}
                          <span className="font-semibold">{fora ? "" : `: ${valor}`}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-6">
                  {id === "gratis" ? (
                    session ? (
                      <p className="text-xs text-muted-foreground">Incluído em toda conta de empresa.</p>
                    ) : (
                      <Link href="/cadastro" className="block">
                        <span className="block text-center rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-primary/50">
                          Criar conta grátis
                        </span>
                      </Link>
                    )
                  ) : session?.user.role === "empresa" ? (
                    <BotaoInteresse ativos={ativos} jaInteressada={situacao?.interesse ?? false} noPro={situacao?.plano === "pro"} />
                  ) : (
                    <Link href={session ? "/painel" : "/cadastro"} className="block">
                      <span className="block text-center rounded-full bg-primary text-white px-4 py-2 text-sm font-semibold hover:bg-primary/90">
                        {session ? "Voltar ao painel" : "Criar conta de empresa"}
                      </span>
                    </Link>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center max-w-2xl mx-auto">
          O pagamento é por assinatura no cartão ou PIX. Nenhum valor passa pela conta do profissional e nada é descontado do
          salário de ninguém: o VagaON cobra da empresa pelas ferramentas, não pelo trabalho.
        </p>
      </main>

      <Footer />
    </div>
  );
}
