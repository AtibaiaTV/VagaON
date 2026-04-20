import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Vaga from "@/models/Vaga";
import Candidatura from "@/models/Candidatura";
import Profissional from "@/models/Profissional";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ESPECIALIDADES } from "@/constants/especialidades";
import { MapPin, Building2, ArrowLeft, Calendar, Users } from "lucide-react";
import BotaoCandidatar from "./BotaoCandidatar";
import ListaCandidatos from "./ListaCandidatos";

const TIPO_LABEL: Record<string, string> = {
  clt: "CLT", temporario: "Temporário", sazonal: "Sazonal",
};
const TIPO_COR: Record<string, string> = {
  clt: "bg-blue-100 text-blue-700",
  temporario: "bg-orange-100 text-orange-700",
  sazonal: "bg-purple-100 text-purple-700",
};

interface EmpresaPopulada {
  _id: string;
  nomeFantasia: string;
  cidade: string;
  estado: string;
  setor: string;
  descricao: string;
}

export default async function DetalheVagaPage({ params }: { params: { id: string } }) {
  const session = await auth();
  await connectDB();

  const vaga = await Vaga.findById(params.id)
    .populate("empresaId", "nomeFantasia cidade estado setor descricao")
    .lean() as (Awaited<ReturnType<typeof Vaga.findById>> & { empresaId: EmpresaPopulada }) | null;

  if (!vaga) notFound();

  // Verifica se profissional já se candidatou
  let jaCandidatou = false;
  let profissionalId: string | null = null;

  if (session?.user.role === "profissional") {
    const prof = await Profissional.findOne({ userId: session.user.id }).select("_id");
    if (prof) {
      profissionalId = prof._id.toString();
      const candidatura = await Candidatura.findOne({ vagaId: params.id, profissionalId: prof._id });
      jaCandidatou = !!candidatura;
    }
  }

  // Empresa dona da vaga vê candidatos
  let isDonoEmpresa = false;
  let candidatos: unknown[] = [];

  if (session?.user.role === "empresa") {
    const empresa = vaga.empresaId as EmpresaPopulada;
    if (session.user.profileId === empresa._id.toString()) {
      isDonoEmpresa = true;
      candidatos = await Candidatura.find({ vagaId: params.id })
        .sort({ createdAt: -1 })
        .lean();
    }
  }

  const empresa = vaga.empresaId as EmpresaPopulada;
  const vagaObj = JSON.parse(JSON.stringify(vaga));

  function formatarSalario() {
    const s = vagaObj.salario;
    if (!s || s.tipo === "a_combinar") return "A combinar";
    const p: Record<string, string> = { hora: "/h", dia: "/dia", mes: "/mês" };
    if (s.tipo === "fixo") return `R$ ${s.max?.toLocaleString("pt-BR")}${p[s.periodo]}`;
    return `R$ ${s.min?.toLocaleString("pt-BR")} – ${s.max?.toLocaleString("pt-BR")}${p[s.periodo]}`;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/vagas" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="font-semibold">Detalhe da Vaga</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Card principal */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">{vagaObj.titulo}</h1>
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
                  <Building2 className="h-4 w-4" />
                  <span>{empresa.nomeFantasia}</span>
                  <span>·</span>
                  <MapPin className="h-4 w-4" />
                  <span>{vagaObj.cidade}, {vagaObj.estado}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${TIPO_COR[vagaObj.tipo]}`}>
                    {TIPO_LABEL[vagaObj.tipo]}
                  </span>
                  <Badge variant="secondary">
                    {ESPECIALIDADES.find((e) => e.value === vagaObj.especialidade)?.label ?? vagaObj.especialidade}
                  </Badge>
                  {vagaObj.remoto && <Badge variant="outline">Remoto</Badge>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-primary">{formatarSalario()}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-1">
                  <Users className="h-3 w-3" />
                  {vagaObj.totalCandidaturas} candidatura(s)
                </p>
              </div>
            </div>

            {/* Período */}
            {(vagaObj.periodo?.dataInicio || vagaObj.periodo?.dataFim) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Calendar className="h-4 w-4" />
                <span>
                  {vagaObj.periodo.dataInicio && new Date(vagaObj.periodo.dataInicio).toLocaleDateString("pt-BR")}
                  {vagaObj.periodo.dataFim && ` até ${new Date(vagaObj.periodo.dataFim).toLocaleDateString("pt-BR")}`}
                </span>
              </div>
            )}

            {/* Botão candidatar */}
            {session?.user.role === "profissional" && (
              <BotaoCandidatar
                vagaId={params.id}
                jaCandidatou={jaCandidatou}
                vagaAtiva={vagaObj.status === "ativa"}
              />
            )}

            {!session && (
              <div className="mt-4 p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Faça login para se candidatar a esta vaga.
                </p>
                <Link href="/entrar">
                  <button className="text-sm font-medium text-primary hover:underline">
                    Entrar / Cadastrar
                  </button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Descrição */}
        <Card>
          <CardHeader><CardTitle className="text-base">Descrição da vaga</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-line">{vagaObj.descricao}</p>
          </CardContent>
        </Card>

        {/* Requisitos */}
        {vagaObj.requisitos && (
          <Card>
            <CardHeader><CardTitle className="text-base">Requisitos</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-line">{vagaObj.requisitos}</p>
            </CardContent>
          </Card>
        )}

        {/* Empresa */}
        <Card>
          <CardHeader><CardTitle className="text-base">Sobre a empresa</CardTitle></CardHeader>
          <CardContent>
            <p className="font-semibold">{empresa.nomeFantasia}</p>
            {empresa.descricao && <p className="text-sm text-muted-foreground mt-1">{empresa.descricao}</p>}
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <MapPin className="h-3 w-3" />{empresa.cidade}, {empresa.estado}
            </p>
          </CardContent>
        </Card>

        {/* Lista de candidatos (só para empresa dona) */}
        {isDonoEmpresa && (
          <ListaCandidatos
            candidatos={JSON.parse(JSON.stringify(candidatos))}
            vagaId={params.id}
          />
        )}
      </main>
    </div>
  );
}
