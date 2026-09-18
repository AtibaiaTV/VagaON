import Link from "next/link";
import { redirect } from "next/navigation";
import { Flame, MessageCircle, UserRoundPen, Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { labelEspecialidade } from "@/constants/especialidades";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import DeckEmpresa from "@/components/match/DeckEmpresa";
import DeckProfissional from "@/components/match/DeckProfissional";
import AtivarPush from "@/components/notificacoes/AtivarPush";
import { registrarAtividadeProfissional } from "@/lib/servicos/visibilidade";
import Empresa from "@/models/Empresa";
import { filtroEmpresaDoUsuario } from "@/lib/servicos/equipe";
import Profissional from "@/models/Profissional";
import Vaga from "@/models/Vaga";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Descobrir — VagaON",
};

function Chamada({
  titulo,
  texto,
  href,
  botao,
  icone,
}: {
  titulo: string;
  texto: string;
  href: string;
  botao: string;
  icone: React.ReactNode;
}) {
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">{icone}</div>
      <h2 className="text-xl font-bold">{titulo}</h2>
      <p className="text-muted-foreground text-sm mt-2">{texto}</p>
      <Link href={href} className="inline-block mt-6">
        <Button size="lg">{botao}</Button>
      </Link>
    </div>
  );
}

export default async function DescobrirPage() {
  const session = await auth();
  if (!session) redirect("/entrar");
  const { role } = session.user;
  if (role === "admin") redirect("/painel");

  await connectDB();

  let conteudo: React.ReactNode;

  if (role === "profissional") {
    await registrarAtividadeProfissional(session.user.id);
    const perfil = await Profissional.findOne({ userId: session.user.id })
      .select("especialidades cidade estado")
      .lean();

    // Sem cidade o match geográfico vira "mesma UF" — em SP isso não diz nada.
    conteudo =
      !perfil || !perfil.especialidades?.length || !perfil.estado || !perfil.cidade?.trim() ? (
        <Chamada
          titulo="Complete seu perfil para começar"
          texto="Precisamos saber sua especialidade e a sua cidade para calcular quais vagas combinam com você."
          href="/perfil/editar"
          botao="Completar perfil"
          icone={<UserRoundPen className="h-8 w-8 text-primary" />}
        />
      ) : (
        <DeckProfissional />
      );
  } else {
    const empresa = await Empresa.findOne(filtroEmpresaDoUsuario(session.user.id)).select("_id match").lean();
    const vagas = empresa
      ? await Vaga.find({ empresaId: empresa._id, status: "ativa", "match.ativo": { $ne: false } })
          .select("titulo cidade especialidade match.totalLikesRecebidos")
          .sort({ createdAt: -1 })
          .lean()
      : [];

    conteudo =
      vagas.length === 0 ? (
        <Chamada
          titulo="Publique uma vaga para descobrir candidatos"
          texto="O deck mostra os profissionais mais compatíveis com cada vaga ativa da sua empresa."
          href="/vagas/nova"
          botao="Publicar vaga"
          icone={<Plus className="h-8 w-8 text-primary" />}
        />
      ) : (
        <DeckEmpresa
          modoCegoInicial={empresa?.match?.modoCego === true}
          vagas={vagas.map((v) => ({
            id: String(v._id),
            titulo: v.titulo,
            cidade: v.cidade,
            especialidadeLabel: labelEspecialidade(v.especialidade),
            totalLikesRecebidos: v.match?.totalLikesRecebidos ?? 0,
          }))}
        />
      );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f5] flex flex-col">
      <Navbar />

      <div style={{ backgroundColor: role === "empresa" ? "#143f28" : "#1a5c38" }} className="py-5">
        <div className="max-w-md mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Flame className="h-6 w-6 text-[#4ade80]" />
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">Descobrir</h1>
              <p className="text-white/60 text-xs">
                {role === "empresa" ? "Candidatos ranqueados por aderência" : "Vagas ranqueadas para o seu perfil"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AtivarPush />
            <Link href="/matches">
              <Button size="sm" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white gap-1.5">
                <MessageCircle className="h-4 w-4" />
                Matches
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-5">{conteudo}</main>
    </div>
  );
}
