import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Empresa from "@/models/Empresa";
import Profissional from "@/models/Profissional";
import Vaga from "@/models/Vaga";
import Candidatura from "@/models/Candidatura";
import Link from "next/link";
import { Users, Building2, ChefHat, Briefcase, ClipboardList, TrendingUp, FlaskConical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AvisoConfiguracao from "@/components/admin/AvisoConfiguracao";
import PainelLiquidez from "@/components/admin/PainelLiquidez";
import { metricasLiquidez } from "@/lib/servicos/metricas-liquidez";

export const dynamic = "force-dynamic";

interface StatCardProps {
  titulo: string;
  valor: number;
  icone: React.ElementType;
  descricao: string;
  cor: string;
  /** Para onde o clique leva: a lista nominal por trás do número. */
  href: string;
  /** Segundo link, opcional, no texto de apoio (ex.: "58 ativas"). */
  hrefDescricao?: string;
}

/** "18/09 20:46" no horário de Brasília — o servidor da Vercel roda em UTC. */
function formatarDataHora(d: Date | string | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function StatCard({ titulo, valor, icone: Icone, descricao, cor, href, hrefDescricao }: StatCardProps) {
  return (
    <Card className="hover:border-primary/50 hover:shadow-md transition-all">
      <Link href={href} className="block" title="Ver a lista">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{titulo}</CardTitle>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cor}`}>
            <Icone className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-3xl font-bold">{valor.toLocaleString("pt-BR")}</p>
        </CardContent>
      </Link>
      <CardContent className="pt-0">
        {hrefDescricao ? (
          <Link href={hrefDescricao} className="text-xs text-primary hover:underline">{descricao} →</Link>
        ) : (
          <p className="text-xs text-muted-foreground">{descricao}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  await connectDB();

  const [
    totalUsuarios,
    totalEmpresas,
    totalProfissionais,
    totalVagas,
    totalVagasAtivas,
    totalCandidaturas,
    usuariosRecentes,
    liquidez,
  ] = await Promise.all([
    User.countDocuments(),
    Empresa.countDocuments(),
    Profissional.countDocuments(),
    Vaga.countDocuments(),
    Vaga.countDocuments({ status: "ativa" }),
    Candidatura.countDocuments(),
    User.find().sort({ createdAt: -1 }).limit(5).select("name email role status createdAt").lean(),
    metricasLiquidez(30).catch(() => null),
  ]);

  const ROLE_LABEL: Record<string, string> = {
    profissional: "Profissional",
    empresa: "Empresa",
    admin: "Admin",
  };
  const STATUS_COR: Record<string, string> = {
    ativo: "bg-green-100 text-green-700",
    suspenso: "bg-red-100 text-red-700",
    pendente: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div className="p-8">
      <AvisoConfiguracao />

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral da plataforma VagaON.</p>
        </div>
        <Link
          href="/admin/match-lab"
          className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors shrink-0"
        >
          <FlaskConical className="h-4 w-4" />
          Match Lab
        </Link>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10">
        <StatCard
          titulo="Total de usuários"
          valor={totalUsuarios}
          icone={Users}
          descricao="Contas cadastradas na plataforma"
          cor="bg-blue-100 text-blue-600"
          href="/admin/usuarios"
        />
        <StatCard
          titulo="Profissionais"
          valor={totalProfissionais}
          icone={ChefHat}
          descricao="Perfis de profissionais criados"
          cor="bg-orange-100 text-orange-600"
          href="/admin/usuarios?perfil=profissional"
        />
        <StatCard
          titulo="Empresas"
          valor={totalEmpresas}
          icone={Building2}
          descricao="Empresas cadastradas"
          cor="bg-purple-100 text-purple-600"
          href="/admin/empresas"
        />
        <StatCard
          titulo="Vagas publicadas"
          valor={totalVagas}
          icone={Briefcase}
          descricao={`${totalVagasAtivas} ativas no momento`}
          cor="bg-green-100 text-green-600"
          href="/admin/vagas"
          hrefDescricao="/admin/vagas?status=ativa"
        />
        <StatCard
          titulo="Candidaturas"
          valor={totalCandidaturas}
          icone={ClipboardList}
          descricao="Total de candidaturas enviadas"
          cor="bg-pink-100 text-pink-600"
          href="/admin/candidaturas"
        />
        <StatCard
          titulo="Taxa de engajamento"
          valor={totalVagas > 0 ? Math.round((totalCandidaturas / totalVagas) * 10) / 10 : 0}
          icone={TrendingUp}
          descricao="Média de candidaturas por vaga · ver vagas com interessados"
          cor="bg-indigo-100 text-indigo-600"
          href="/admin/vagas?status=com-interesse"
        />
      </div>

      {liquidez && <PainelLiquidez m={liquidez} />}

      {/* Usuários recentes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Cadastros recentes</CardTitle>
          <Link href="/admin/usuarios" className="text-xs text-primary hover:underline">ver todos os usuários →</Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {usuariosRecentes.map((u) => (
              <div key={u._id.toString()} className="flex items-center justify-between py-2 border-b last:border-0">
                <Link href={`/admin/usuarios?busca=${encodeURIComponent(u.email)}`} className="group" title="Abrir nos usuários">
                  <p className="font-medium text-sm group-hover:text-primary group-hover:underline">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground" title="Data e hora do cadastro (horário de Brasília)">
                    {formatarDataHora(u.createdAt as Date)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {ROLE_LABEL[u.role as string]}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COR[u.status as string] ?? "bg-gray-100 text-gray-600"}`}>
                    {u.status as string}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
