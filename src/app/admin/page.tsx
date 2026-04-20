import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Empresa from "@/models/Empresa";
import Profissional from "@/models/Profissional";
import Vaga from "@/models/Vaga";
import Candidatura from "@/models/Candidatura";
import { Users, Building2, ChefHat, Briefcase, ClipboardList, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
  titulo: string;
  valor: number;
  icone: React.ElementType;
  descricao: string;
  cor: string;
}

function StatCard({ titulo, valor, icone: Icone, descricao, cor }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{titulo}</CardTitle>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cor}`}>
          <Icone className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{valor.toLocaleString("pt-BR")}</p>
        <p className="text-xs text-muted-foreground mt-1">{descricao}</p>
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
  ] = await Promise.all([
    User.countDocuments(),
    Empresa.countDocuments(),
    Profissional.countDocuments(),
    Vaga.countDocuments(),
    Vaga.countDocuments({ status: "ativa" }),
    Candidatura.countDocuments(),
    User.find().sort({ createdAt: -1 }).limit(5).select("name email role status createdAt").lean(),
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral da plataforma VagaON.</p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10">
        <StatCard
          titulo="Total de usuários"
          valor={totalUsuarios}
          icone={Users}
          descricao="Contas cadastradas na plataforma"
          cor="bg-blue-100 text-blue-600"
        />
        <StatCard
          titulo="Profissionais"
          valor={totalProfissionais}
          icone={ChefHat}
          descricao="Perfis de profissionais criados"
          cor="bg-orange-100 text-orange-600"
        />
        <StatCard
          titulo="Empresas"
          valor={totalEmpresas}
          icone={Building2}
          descricao="Empresas cadastradas"
          cor="bg-purple-100 text-purple-600"
        />
        <StatCard
          titulo="Vagas publicadas"
          valor={totalVagas}
          icone={Briefcase}
          descricao={`${totalVagasAtivas} ativas no momento`}
          cor="bg-green-100 text-green-600"
        />
        <StatCard
          titulo="Candidaturas"
          valor={totalCandidaturas}
          icone={ClipboardList}
          descricao="Total de candidaturas enviadas"
          cor="bg-pink-100 text-pink-600"
        />
        <StatCard
          titulo="Taxa de engajamento"
          valor={totalVagas > 0 ? Math.round((totalCandidaturas / totalVagas) * 10) / 10 : 0}
          icone={TrendingUp}
          descricao="Média de candidaturas por vaga"
          cor="bg-indigo-100 text-indigo-600"
        />
      </div>

      {/* Usuários recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cadastros recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {usuariosRecentes.map((u) => (
              <div key={u._id.toString()} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
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
