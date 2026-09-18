import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { MENSAGENS_LIMITE } from "@/lib/planos";
import { MODELO_PADRAO, ehModeloCurriculo, montarDadosCurriculo, normalizarCores } from "@/lib/curriculo";
import { acessoAoProfissional } from "@/lib/servicos/acesso-profissional";
import Profissional from "@/models/Profissional";
import User from "@/models/User";
import Navbar from "@/components/layout/Navbar";
import Paywall from "@/components/planos/Paywall";
import CurriculoImpressao from "@/components/curriculo/CurriculoImpressao";

export const dynamic = "force-dynamic";

/**
 * O perfil de um candidato nos três modelos de currículo, para a empresa (e o
 * admin) imprimir ou baixar. Mesmas regras de acesso da página do perfil;
 * sem WhatsApp nem link público, que pertencem ao próprio profissional.
 */
export default async function CurriculoDoProfissionalPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { modelo?: string; imprimir?: string };
}) {
  const session = await auth();
  await connectDB();

  const acesso = await acessoAoProfissional(session, params.id);
  if (!acesso.ok) {
    if (acesso.motivo === "paywall") {
      return (
        <div className="min-h-screen bg-[#f4f7f5]">
          <Navbar />
          <main className="max-w-3xl mx-auto px-4 py-8">
            <Paywall titulo="Este currículo está no banco de currículos" mensagem={MENSAGENS_LIMITE.bancoCurriculos} />
          </main>
        </div>
      );
    }
    redirect(acesso.motivo === "sem-sessao" ? `/entrar?callbackUrl=/profissionais/${params.id}/curriculo` : "/painel");
  }

  const prof = await Profissional.findById(params.id).select("-cpf -dataNascimento").lean();
  if (!prof) notFound();
  const user = await User.findById(prof.userId).select("email").lean();

  const modeloInicial = ehModeloCurriculo(searchParams.modelo)
    ? searchParams.modelo
    : ehModeloCurriculo(prof.curriculoModelo)
      ? prof.curriculoModelo
      : MODELO_PADRAO;

  return (
    <div className="min-h-screen bg-[#e9edeb]">
      <div className="nao-imprimir">
        <Navbar />
      </div>
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <Link
          href={`/profissionais/${params.id}`}
          className="nao-imprimir inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao perfil
        </Link>
        <CurriculoImpressao
          dados={montarDadosCurriculo(prof, user?.email ?? null)}
          modeloInicial={modeloInicial}
          coresIniciais={normalizarCores(prof.curriculoCores)}
          autoImprimir={searchParams.imprimir === "1"}
          linkEditar={false}
          terceiro
        />
      </main>
    </div>
  );
}
