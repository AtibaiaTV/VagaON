import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { User as UserIcon, Briefcase, ClipboardList, Building2, Plus, Users, ShieldCheck, LayoutDashboard, Flame, MessageCircle, Star, KeyRound } from "lucide-react";
import User from "@/models/User";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PainelMetricas, { type Tile } from "@/components/painel/PainelMetricas";
import CardPlanoPainel from "@/components/planos/CardPlanoPainel";
import { connectDB } from "@/lib/db";
import type { PlanoResolvido } from "@/lib/planos";
import { metricasEmpresa, metricasProfissional, type LinhaVaga } from "@/lib/servicos/metricas";
import { acessoDaEmpresa } from "@/lib/servicos/planos";
import { registrarAtividadeProfissional } from "@/lib/servicos/visibilidade";
import Empresa from "@/models/Empresa";
import Profissional from "@/models/Profissional";

export const dynamic = "force-dynamic";

async function montarMetricas(
  role: string,
  userId: string
): Promise<{ tiles: Tile[]; porVaga?: LinhaVaga[]; acesso?: PlanoResolvido } | null> {
  await connectDB();

  if (role === "empresa") {
    const empresa = await Empresa.findOne({ userId }).select("_id assinatura").lean();
    if (!empresa) return null;
    const m = await metricasEmpresa(empresa._id);
    return {
      acesso: acessoDaEmpresa(empresa),
      tiles: [
        { rotulo: "Vagas ativas", valor: m.vagasAtivas },
        { rotulo: "Visualizações", valor: m.visualizacoes, dica: "nas suas vagas" },
        { rotulo: "Curtidas", valor: m.likesRecebidos, dica: "profissionais interessados" },
        { rotulo: "Matches", valor: m.matches, destaque: true },
        { rotulo: "Candidaturas", valor: m.candidaturas },
        {
          rotulo: "Contratações",
          valor: m.contratacoes,
          dica: m.tempoMedioContratacaoDias !== null ? `média de ${m.tempoMedioContratacaoDias} dia(s) do match à contratação` : "marque no chat do match",
        },
      ],
      porVaga: m.porVaga,
    };
  }

  if (role === "profissional") {
    const prof = await Profissional.findOne({ userId }).select("_id completude").lean();
    if (!prof) return null;
    await registrarAtividadeProfissional(userId); // abrir o painel conta como atividade
    const m = await metricasProfissional(prof._id, prof.completude ?? 0);
    return {
      tiles: [
        { rotulo: "Empresas que viram você", valor: m.avaliadoPorEmpresas, dica: "no Descobrir" },
        { rotulo: "Curtiram seu perfil", valor: m.curtidoPorEmpresas },
        { rotulo: "Matches ativos", valor: m.matchesAtivos, destaque: true },
        { rotulo: "Candidaturas", valor: m.candidaturas },
        { rotulo: "Likes hoje", valor: `${m.likesUsadosHoje}/${m.limiteLikesDia}` },
        { rotulo: "Perfil completo", valor: `${m.completude}%`, dica: m.completude < 80 ? "complete para subir no ranking" : undefined },
      ],
    };
  }

  return null;
}

export default async function PainelPage() {
  const session = await auth();

  if (!session) redirect("/entrar");

  const { role, name } = session.user;
  const metricas = await montarMetricas(role, session.user.id).catch(() => null);
  // Conta criada pelo SSO da RedeSA nasce sem senha: lembra de definir uma.
  const semSenha = await User.exists({ _id: session.user.id, password: null }).catch(() => null);

  const titleMap: Record<string, string> = {
    profissional: "Painel do Profissional",
    empresa: "Painel da Empresa",
    admin: "Painel Administrativo",
  };
  const subtitleMap: Record<string, string> = {
    profissional: "Gerencie seu perfil e acompanhe suas candidaturas.",
    empresa: "Publique vagas e encontre profissionais qualificados.",
    admin: "Gerencie usuários, vagas e empresas da plataforma.",
  };

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <Navbar />

      {/* Hero — verde escuro para empresa, verde padrão para outros */}
      <div style={{ backgroundColor: role === "empresa" ? "#143f28" : "#1a5c38" }} className="relative overflow-hidden py-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.04] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/[0.04] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {titleMap[role] ?? "Painel"}
            </h1>
            <p className="text-white/70 text-sm mt-1">
              Olá, {name} — {subtitleMap[role] ?? ""}
            </p>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button
              variant="outline"
              size="sm"
              type="submit"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
            >
              Sair
            </Button>
          </form>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {semSenha && (
          <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 flex items-start gap-3">
            <KeyRound className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm">
              <span className="font-semibold">Sua conta ainda não tem senha.</span> Você entrou pela RedeSA; defina
              uma senha para entrar direto no VagaON em qualquer aparelho.{" "}
              <Link href="/perfil/editar#senha" className="font-semibold text-primary underline underline-offset-2">
                Definir senha
              </Link>
            </p>
          </div>
        )}
        {metricas?.acesso && <CardPlanoPainel acesso={metricas.acesso} />}
        {metricas && <PainelMetricas tiles={metricas.tiles} porVaga={metricas.porVaga} />}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {role !== "admin" && (
            <>
              <Link href="/descobrir">
                <Card className="border-primary/40 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mb-2">
                      <Flame className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-base">Descobrir</CardTitle>
                    <CardDescription>
                      {role === "empresa"
                        ? "Deslize pelos candidatos mais compatíveis com cada vaga."
                        : "Deslize pelas vagas ranqueadas para o seu perfil."}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/matches">
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                      <MessageCircle className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">Matches</CardTitle>
                    <CardDescription>Converse com quem também demonstrou interesse.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/avaliacoes">
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-2">
                      <Star className="h-5 w-5 text-amber-600" />
                    </div>
                    <CardTitle className="text-base">Avaliações</CardTitle>
                    <CardDescription>
                      {role === "empresa" ? "Avalie quem contratou e construa a reputação da sua empresa." : "Avalie onde trabalhou e construa sua reputação."}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </>
          )}

          {role === "profissional" && (
            <>
              <Link href="/perfil/editar">
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                      <UserIcon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">Meu Perfil</CardTitle>
                    <CardDescription>Complete seu currículo para aparecer para as empresas.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/vagas">
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">Buscar Vagas</CardTitle>
                    <CardDescription>Encontre oportunidades de trabalho na sua área.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/candidaturas">
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                      <ClipboardList className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">Minhas Candidaturas</CardTitle>
                    <CardDescription>Acompanhe o status das suas candidaturas.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </>
          )}

          {role === "empresa" && (
            <>
              <Link href="/perfil/editar">
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">Perfil da Empresa</CardTitle>
                    <CardDescription>Complete os dados da sua empresa.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/vagas/nova">
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                      <Plus className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">Publicar Vaga</CardTitle>
                    <CardDescription>Crie uma nova vaga e encontre candidatos.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/profissionais">
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">Buscar Profissionais</CardTitle>
                    <CardDescription>Acesse o banco de talentos da plataforma.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/vagas">
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">Minhas Vagas</CardTitle>
                    <CardDescription>Veja e gerencie as vagas publicadas.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </>
          )}

          {role === "admin" && (
            <>
              <Link href="/admin">
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                      <LayoutDashboard className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">Dashboard</CardTitle>
                    <CardDescription>Visualize estatísticas da plataforma.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/admin/usuarios">
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">Usuários</CardTitle>
                    <CardDescription>Gerencie profissionais e empresas cadastrados.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/admin/vagas">
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">Moderação</CardTitle>
                    <CardDescription>Aprove empresas e gerencie vagas publicadas.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
