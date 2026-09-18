import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { MODELO_PADRAO, ehModeloCurriculo, montarDadosCurriculo, normalizarCores } from "@/lib/curriculo";
import Profissional from "@/models/Profissional";
import User from "@/models/User";
import Navbar from "@/components/layout/Navbar";
import CurriculoImpressao from "@/components/curriculo/CurriculoImpressao";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Meu currículo — VagaON",
};

/**
 * Currículo do profissional em três modelos, com impressão em um clique.
 * `?modelo=` pré-seleciona; `?imprimir=1` abre a impressão ao carregar.
 */
export default async function CurriculoPage({
  searchParams,
}: {
  searchParams: { modelo?: string; imprimir?: string };
}) {
  const session = await auth();
  if (!session) redirect("/entrar?callbackUrl=/perfil/curriculo");
  if (session.user.role !== "profissional") redirect("/perfil");

  await connectDB();
  const [prof, user] = await Promise.all([
    Profissional.findOne({ userId: session.user.id }).lean(),
    User.findById(session.user.id).select("email").lean(),
  ]);
  if (!prof) redirect("/perfil/editar");

  const dados = montarDadosCurriculo(prof, user?.email ?? null);
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
      <main className="max-w-4xl mx-auto px-4 py-6">
        <CurriculoImpressao
          dados={dados}
          modeloInicial={modeloInicial}
          coresIniciais={normalizarCores(prof.curriculoCores)}
          salvarPreferencia
          autoImprimir={searchParams.imprimir === "1"}
        />
      </main>
    </div>
  );
}
