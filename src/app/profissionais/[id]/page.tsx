import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { MENSAGENS_LIMITE } from "@/lib/planos";
import { acessoAoProfissional } from "@/lib/servicos/acesso-profissional";
import Profissional from "@/models/Profissional";
import Paywall from "@/components/planos/Paywall";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ESPECIALIDADES } from "@/constants/especialidades";
import { MapPin, Phone, ArrowLeft, Briefcase, CheckCircle, Clock, Plane, Star, Video, GraduationCap, FileText, Cake, RefreshCw, Activity, Navigation } from "lucide-react";
import Empresa from "@/models/Empresa";
import { filtroEmpresaDoUsuario } from "@/lib/servicos/equipe";
import { menorDistancia, paraCoords, type PontoDoProfissional } from "@/lib/match/geo";
import { geocodificarCidade } from "@/constants/municipios";
import Navbar from "@/components/layout/Navbar";
import ReputacaoBadge from "@/components/avaliacoes/ReputacaoBadge";
import FotoAmpliavel from "@/components/perfil/FotoAmpliavel";
import { idadeDe, nascimentoComIdade } from "@/lib/idade";
import { resumoReputacaoPublico } from "@/lib/reputacao";

interface IExperiencia {
  cargo: string;
  empresa: string;
  cidade: string;
  estado: string;
  dataInicio: string;
  dataFim: string | null;
  descricao: string;
}

interface IProfissionalLean {
  _id: string;
  nomeCompleto: string;
  telefone: string;
  fotoPerfil: string | null;
  cidade: string;
  estado: string;
  bairro?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  dispostoViajar: boolean;
  especialidades: string[];
  resumoProfissional: string;
  disponibilidade: { tipo: string[]; imediata: boolean; dataDisponivel: string | null };
  experiencias: IExperiencia[];
  formacao?: { curso: string; instituicao: string; ano: string }[];
  habilidades: string[];
  reputacao?: unknown;
  videoApresentacao?: { url: string; duracao: number } | null;
  createdAt?: string;
  updatedAt?: string;
  dataNascimento?: string | null;
  match?: { ultimaAtividade?: string | null };
  localizacao?: { coordinates?: number[] } | null;
  cidadesInteresse?: { cidade: string; estado: string; localizacao?: { coordinates?: number[] } | null }[];
}

const TIPOS_LABEL: Record<string, string> = {
  clt: "CLT", temporario: "Temporário", sazonal: "Sazonal",
};

function formatMes(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

export default async function PerfilProfissionalPage({ params }: { params: { id: string } }) {
  const session = await auth();
  await connectDB();

  // Regras em src/lib/servicos/acesso-profissional.ts (as mesmas do currículo do candidato).
  const acesso = await acessoAoProfissional(session, params.id);
  if (!acesso.ok) {
    if (acesso.motivo === "paywall") {
      return (
        <div className="min-h-screen bg-[#f4f7f5]">
          <Navbar />
          <main className="max-w-3xl mx-auto px-4 py-8">
            <Paywall titulo="Este perfil está no banco de currículos" mensagem={MENSAGENS_LIMITE.bancoCurriculos} />
          </main>
        </div>
      );
    }
    redirect("/painel");
  }
  const ehAdmin = acesso.ehAdmin;

  // Empresa recebe só o bairro do endereço; admin recebe o endereço completo.
  const rawProf = await Profissional.findById(params.id)
    .select(ehAdmin ? "-cpf" : "-cpf -cep -logradouro -numero -complemento")
    .lean();

  if (!rawProf) notFound();

  const prof = JSON.parse(JSON.stringify(rawProf)) as IProfissionalLean;

  const disponTipos = prof.disponibilidade?.tipo ?? [];
  // Idade vai para empresa e admin; a data em si só para o admin (cartão abaixo).
  const idade = idadeDe(prof.dataNascimento);

  // Distância até a empresa que está olhando (admin não tem empresa).
  let distancia: number | null = null;
  let viaInteresse: string | null = null;
  let nomeEmpresa: string | null = null;
  if (!ehAdmin) {
    const minha = await Empresa.findOne(filtroEmpresaDoUsuario(session!.user.id)).select("cidade estado nomeFantasia").lean();
    const daEmpresa = minha ? geocodificarCidade(minha.cidade, minha.estado) : null;
    const pontos: PontoDoProfissional[] = [];
    const casa = paraCoords(prof.localizacao) ?? geocodificarCidade(prof.cidade, prof.estado);
    if (casa) pontos.push({ coords: casa, cidadeInteresse: null });
    for (const c of prof.cidadesInteresse ?? []) {
      const cc = paraCoords(c.localizacao) ?? geocodificarCidade(c.cidade, c.estado);
      if (cc) pontos.push({ coords: cc, cidadeInteresse: c.cidade });
    }
    const melhor = daEmpresa ? menorDistancia(pontos, daEmpresa) : null;
    if (melhor) {
      distancia = melhor.km;
      viaInteresse = melhor.ponto.cidadeInteresse;
      nomeEmpresa = minha?.nomeFantasia ?? null;
    }
  }
  const atualizadoEm = prof.updatedAt ? new Date(prof.updatedAt).toLocaleDateString("pt-BR") : null;
  const ativoEm = prof.match?.ultimaAtividade ?? prof.updatedAt;
  const ativoEmTexto = ativoEm ? new Date(ativoEm).toLocaleDateString("pt-BR") : null;

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <Navbar />

      {/* Hero */}
      <div className="bg-[#1a5c38] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/[0.04] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/[0.04] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="max-w-3xl mx-auto px-4 py-8 relative">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/profissionais"
              className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Banco de Profissionais
            </Link>
            {ehAdmin && (
              <Link href="/admin/usuarios" className="text-xs text-white/60 hover:text-white underline underline-offset-2">
                Você está vendo como admin · voltar aos usuários
              </Link>
            )}
          </div>

          <div className="flex items-start gap-5">
            {/* Avatar: maior, e abre em tamanho grande ao clicar */}
            <FotoAmpliavel src={prof.fotoPerfil} nome={prof.nomeCompleto} className="w-28 h-28 sm:w-36 sm:h-36" classeInicial="text-5xl" />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white">{prof.nomeCompleto}</h1>
              <div className="mt-1">
                <ReputacaoBadge rep={resumoReputacaoPublico(prof.reputacao)} claro />
              </div>

              <div className="flex flex-wrap gap-1.5 mt-2">
                {(prof.especialidades ?? []).map((e) => (
                  <span
                    key={e}
                    className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 text-white font-medium"
                  >
                    {ESPECIALIDADES.find((esp) => esp.value === e)?.label ?? e}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 mt-3 text-sm text-white/70">
                {/* Sem cidade a pessoa quase não aparece nos filtros: para o admin isso é o que importa ver. */}
                {!prof.cidade && ehAdmin ? (
                  <span className="flex items-center gap-1 text-amber-200">
                    <MapPin className="h-3.5 w-3.5" />
                    {prof.estado ? `${prof.estado} · sem cidade no cadastro` : "Sem cidade no cadastro"}
                  </span>
                ) : (prof.bairro || prof.cidade || prof.estado) ? (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {[prof.bairro, [prof.cidade, prof.estado].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
                  </span>
                ) : null}
                {prof.telefone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {prof.telefone}
                  </span>
                )}
                {prof.dispostoViajar && (
                  <span className="flex items-center gap-1 text-white/80">
                    <Plane className="h-3.5 w-3.5" />
                    Disposto(a) a viajar
                  </span>
                )}
                {prof.createdAt && (
                  <span className="flex items-center gap-1 text-white/60" title="Data do cadastro no VagaON">
                    <Clock className="h-3.5 w-3.5" />
                    Cadastro em {new Date(prof.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                )}
                {atualizadoEm && (
                  <span className="flex items-center gap-1 text-white/60" title="Última atualização do perfil">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Atualizado em {atualizadoEm}
                  </span>
                )}
                {ativoEmTexto && (
                  <span className="flex items-center gap-1 text-white/60" title="Última vez que usou o VagaON">
                    <Activity className="h-3.5 w-3.5" />
                    Ativo em {ativoEmTexto}
                  </span>
                )}
                {distancia !== null && (
                  <span className="flex items-center gap-1 text-white font-medium" title={`Distância entre a cidade do profissional e ${nomeEmpresa ?? "a sua empresa"}`}>
                    <Navigation className="h-3.5 w-3.5" />
                    {distancia === 0 ? "Na sua cidade" : `A ${distancia} km da sua empresa`}
                    {viaInteresse && <span className="font-normal text-white/70"> (contando {viaInteresse}, cidade de interesse)</span>}
                  </span>
                )}
                {(prof.cidadesInteresse ?? []).length > 0 && (
                  <span className="flex items-center gap-1 text-white/80 basis-full" title="Cidades em que aceita trabalhar">
                    <Plane className="h-3.5 w-3.5" />
                    Também aceita: {prof.cidadesInteresse!.map((c) => `${c.cidade}/${c.estado}`).join(", ")}
                  </span>
                )}
                {idade !== null && (
                  <span className="flex items-center gap-1">
                    <Cake className="h-3.5 w-3.5" />
                    {idade} anos
                  </span>
                )}
              </div>

              <div className="mt-4">
                <Link
                  href={`/profissionais/${prof._id}/curriculo`}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/15 hover:bg-white/25 border border-white/25 px-3 py-1.5 text-sm font-medium text-white transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Ver como currículo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-5">

        {/* Endereço completo: só o admin recebe estes campos do servidor. */}
        {ehAdmin && (
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Dados pessoais <span className="text-xs font-normal text-muted-foreground">(visível só para o admin)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Nascimento: </span>
                {prof.dataNascimento ? nascimentoComIdade(prof.dataNascimento) : "não informado"}
              </p>
              {prof.logradouro || prof.numero || prof.complemento || prof.bairro || prof.cep ? (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Endereço: </span>
                  {[
                    [prof.logradouro, prof.numero].filter(Boolean).join(", "),
                    prof.complemento,
                    prof.bairro,
                    [prof.cidade, prof.estado].filter(Boolean).join(" / "),
                    prof.cep && `CEP ${prof.cep}`,
                  ].filter(Boolean).join(" · ")}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Endereço: </span>
                  não informado. O cadastro só passou a pedir endereço e nascimento agora; a pessoa preenche em Perfil → Editar.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Vídeo de apresentação */}
        {prof.videoApresentacao?.url && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Video className="h-4 w-4 text-primary" />
                Vídeo de apresentação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <video
                src={prof.videoApresentacao.url}
                controls
                playsInline
                preload="metadata"
                className="w-full max-h-80 rounded-xl bg-black"
              />
            </CardContent>
          </Card>
        )}

        {/* Resumo */}
        {prof.resumoProfissional && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                Sobre
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {prof.resumoProfissional}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Disponibilidade */}
        {disponTipos.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Disponibilidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-3">
                {disponTipos.map((t) => (
                  <Badge key={t} variant="outline" className="border-primary/30 text-primary">
                    {TIPOS_LABEL[t] ?? t}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
                {prof.disponibilidade?.imediata
                  ? "Disponível imediatamente"
                  : "Disponível em breve"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Experiências */}
        {(prof.experiencias ?? []).length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Experiências
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {prof.experiencias.map((exp, i) => (
                <div key={i} className={`relative pl-4 border-l-2 border-primary/20 ${i > 0 ? "pt-5" : ""}`}>
                  <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-primary" />
                  <p className="font-semibold">{exp.cargo}</p>
                  <p className="text-sm text-muted-foreground">
                    {exp.empresa}
                    {(exp.cidade || exp.estado) && (
                      <span> · {[exp.cidade, exp.estado].filter(Boolean).join(", ")}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatMes(exp.dataInicio)}
                    {" — "}
                    {exp.dataFim ? formatMes(exp.dataFim) : "Atual"}
                  </p>
                  {exp.descricao && (
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      {exp.descricao}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Formação */}
        {(prof.formacao ?? []).length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Formação e cursos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {prof.formacao!.map((f, i) => (
                <div key={i}>
                  <p className="font-semibold">{f.curso}</p>
                  {(f.instituicao || f.ano) && (
                    <p className="text-sm text-muted-foreground">{[f.instituicao, f.ano].filter(Boolean).join(" · ")}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Habilidades */}
        {(prof.habilidades ?? []).length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                Habilidades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {prof.habilidades.map((h) => (
                  <Badge key={h} variant="secondary" className="text-xs">
                    {h}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </main>
    </div>
  );
}
