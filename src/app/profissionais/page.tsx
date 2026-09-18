import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { MENSAGENS_LIMITE } from "@/lib/planos";
import { acessoDaEmpresa } from "@/lib/servicos/planos";
import { menorDistancia, paraCoords, type PontoDoProfissional } from "@/lib/match/geo";
import { geocodificarCidade } from "@/constants/municipios";
import Empresa from "@/models/Empresa";
import { filtroEmpresaDoUsuario } from "@/lib/servicos/equipe";
import Profissional from "@/models/Profissional";
import Paywall from "@/components/planos/Paywall";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ESPECIALIDADES } from "@/constants/especialidades";
import { MapPin, Users, Navigation } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FiltrosProfissionais, { RAIOS_KM } from "@/components/profissionais/FiltrosProfissionais";

const RAIO_TERRA_KM = 6371;
const LIMITE = 60;

interface IProfissionalLean {
  _id: string;
  nomeCompleto: string;
  fotoPerfil: string | null;
  especialidades: string[];
  cidade: string;
  estado: string;
  resumoProfissional: string;
  disponibilidade: { tipo: string[]; imediata: boolean };
  match?: { ativo?: boolean; ultimaAtividade?: string | null };
  localizacao?: { coordinates?: number[] } | null;
  cidadesInteresse?: { cidade: string; estado: string; localizacao?: { coordinates?: number[] } | null }[];
  createdAt?: string;
  updatedAt?: string;
}

const DISPON_LABEL: Record<string, string> = {
  clt: "CLT", temporario: "Temporário", sazonal: "Sazonal",
};

const DISPON_COR: Record<string, string> = {
  clt:        "bg-blue-100 text-blue-700",
  temporario: "bg-orange-100 text-orange-700",
  sazonal:    "bg-purple-100 text-purple-700",
};

function escaparRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function dataCurta(v: string | null | undefined) {
  return v ? new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : null;
}

interface SearchParams {
  q?: string; tipo?: string; cat?: string; uf?: string; cidade?: string; raio?: string; ordem?: string;
}

export default async function ProfissionaisPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session || (session.user.role !== "empresa" && session.user.role !== "admin")) redirect("/painel");
  const ehAdmin = session.user.role === "admin";

  await connectDB();

  // Banco de currículos é recurso do plano Pro (no-op com planos desligados).
  // Admin não tem empresa nem plano: entra direto.
  const empresa = ehAdmin
    ? null
    : await Empresa.findOne(filtroEmpresaDoUsuario(session.user.id)).select("assinatura cidade estado").lean();
  if (!ehAdmin && !acessoDaEmpresa(empresa).limites.bancoCurriculos) {
    return (
      <div className="min-h-screen bg-[#f4f7f5]">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-8">
          <Paywall titulo="Banco de currículos é do plano Pro" mensagem={MENSAGENS_LIMITE.bancoCurriculos} />
        </main>
        <Footer />
      </div>
    );
  }

  // ── Ponto de referência para distância e raio ───────────────────────────
  // Cidade filtrada tem prioridade (a empresa pode procurar gente para outra
  // unidade); senão, a cidade da própria empresa.
  const cidadeFiltro = (searchParams.cidade ?? "").trim();
  const ufFiltro = (searchParams.uf ?? "").trim().toUpperCase();
  let referencia: { lat: number; lng: number } | null = null;
  let referenciaLabel: string | null = null;
  if (cidadeFiltro) {
    referencia = geocodificarCidade(cidadeFiltro, ufFiltro || null);
    if (referencia) referenciaLabel = cidadeFiltro;
  }
  if (!referencia && empresa?.cidade) {
    referencia = geocodificarCidade(empresa.cidade, empresa.estado);
    if (referencia) referenciaLabel = empresa.cidade;
  }

  // ── Filtro do banco ─────────────────────────────────────────────────────
  const filtro: Record<string, unknown> = ehAdmin ? {} : { "match.ativo": { $ne: false } };
  const q = (searchParams.q ?? "").trim();
  if (q) filtro.nomeCompleto = { $regex: escaparRegex(q), $options: "i" };
  const tipo = searchParams.tipo ?? "";
  if (["clt", "temporario", "sazonal"].includes(tipo)) filtro["disponibilidade.tipo"] = tipo;
  const cat = searchParams.cat ?? "";
  if (cat) {
    const vals = ESPECIALIDADES.filter((e) => e.categoria === cat).map((e) => e.value);
    if (vals.length) filtro.especialidades = { $in: vals };
  }
  if (ufFiltro) filtro.estado = ufFiltro;
  if (cidadeFiltro) filtro.cidade = { $regex: `^${escaparRegex(cidadeFiltro)}$`, $options: "i" };
  const raioKm = Number(searchParams.raio);
  const raioValido = referencia && RAIOS_KM.includes(raioKm) ? raioKm : null;
  if (raioValido && referencia) {
    // Raio substitui o filtro exato de cidade: "até 25 km de Atibaia" inclui as vizinhas.
    delete filtro.cidade;
    // Casa OU qualquer cidade de interesse dentro do raio.
    const dentro = { $geoWithin: { $centerSphere: [[referencia.lng, referencia.lat], raioValido / RAIO_TERRA_KM] } };
    filtro.$or = [{ localizacao: dentro }, { "cidadesInteresse.localizacao": dentro }];
  }

  const raw = await Profissional.find(filtro)
    .select("nomeCompleto fotoPerfil especialidades cidade estado resumoProfissional disponibilidade match.ativo match.ultimaAtividade localizacao cidadesInteresse completude createdAt updatedAt")
    .sort({ completude: -1, createdAt: -1 })
    .limit(LIMITE * 2)
    .lean();

  const profissionais = (JSON.parse(JSON.stringify(raw)) as IProfissionalLean[]).map((p) => {
    // Menor distância entre a referência e a casa ou qualquer cidade de interesse.
    const pontos: PontoDoProfissional[] = [];
    const casa = paraCoords(p.localizacao) ?? geocodificarCidade(p.cidade, p.estado);
    if (casa) pontos.push({ coords: casa, cidadeInteresse: null });
    for (const c of p.cidadesInteresse ?? []) {
      const cc = paraCoords(c.localizacao) ?? geocodificarCidade(c.cidade, c.estado);
      if (cc) pontos.push({ coords: cc, cidadeInteresse: c.cidade });
    }
    const melhor = referencia ? menorDistancia(pontos, referencia) : null;
    return { ...p, distancia: melhor?.km ?? null, viaInteresse: melhor?.ponto.cidadeInteresse ?? null };
  });

  // ── Ordenação ───────────────────────────────────────────────────────────
  const ordem = searchParams.ordem ?? "relevancia";
  const t = (v?: string | null) => (v ? new Date(v).getTime() : 0);
  if (ordem === "distancia" && referencia) {
    profissionais.sort((a, b) => (a.distancia ?? 1e9) - (b.distancia ?? 1e9));
  } else if (ordem === "recentes") {
    profissionais.sort((a, b) => t(b.createdAt) - t(a.createdAt));
  } else if (ordem === "atualizados") {
    profissionais.sort((a, b) => t(b.updatedAt) - t(a.updatedAt));
  } else if (ordem === "ativos") {
    profissionais.sort((a, b) => t(b.match?.ultimaAtividade ?? b.updatedAt) - t(a.match?.ultimaAtividade ?? a.updatedAt));
  }
  const lista = profissionais.slice(0, LIMITE);
  const filtrando = Boolean(q || tipo || cat || ufFiltro || cidadeFiltro || raioValido);

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <Navbar />

      {/* Hero */}
      <div className="bg-[#143f28] relative overflow-hidden py-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.04] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/[0.04] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between relative">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-5 w-5 text-white/70" />
              <h1 className="text-2xl font-bold text-white">Banco de Profissionais</h1>
            </div>
            <p className="text-white/60 text-sm">
              {lista.length}
              {profissionais.length > LIMITE ? "+" : ""} profissional{lista.length !== 1 ? "is" : ""}
              {filtrando ? " com esses filtros" : " cadastrado" + (lista.length !== 1 ? "s" : "")}
              {referenciaLabel && ` · distâncias a partir de ${referenciaLabel}`}
              {ehAdmin && " · visão de admin, inclui perfis pausados"}
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <FiltrosProfissionais temReferencia={Boolean(referencia)} referenciaLabel={referenciaLabel} />

        {!referencia && !ehAdmin && (
          <p className="text-xs text-muted-foreground -mt-2">
            Para ver a distância de cada profissional e filtrar por raio, informe a cidade da sua empresa em{" "}
            <Link href="/perfil/editar" className="underline underline-offset-2">Perfil → Editar</Link>, ou filtre por uma cidade acima.
          </p>
        )}

        {lista.length === 0 ? (
          <div className="text-center py-20">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              {filtrando ? "Nenhum profissional com esses filtros" : "Nenhum profissional cadastrado ainda"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {filtrando ? "Amplie o raio ou tire um filtro." : "Divulgue a plataforma para que profissionais se cadastrem!"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lista.map((prof) => {
              const atualizado = dataCurta(prof.updatedAt);
              const ativo = dataCurta(prof.match?.ultimaAtividade ?? prof.updatedAt);
              return (
                <Link key={prof._id} href={`/profissionais/${prof._id}`}>
                  <Card className="hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer h-full">
                    <CardContent className="pt-5">
                      {/* Cabeçalho do card */}
                      <div className="flex items-center gap-3 mb-3">
                        {prof.fotoPerfil ? (
                          <img
                            src={prof.fotoPerfil}
                            alt={prof.nomeCompleto}
                            className="w-16 h-16 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xl font-bold text-primary">
                              {prof.nomeCompleto.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold leading-tight truncate">
                            {prof.nomeCompleto}
                            {ehAdmin && prof.match?.ativo === false && (
                              <span className="ml-2 text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 align-middle">
                                pausado
                              </span>
                            )}
                          </p>
                          {!prof.cidade && ehAdmin ? (
                            <p className="text-xs text-amber-700 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {prof.estado ? `${prof.estado} · sem cidade` : "sem cidade"}
                            </p>
                          ) : (prof.cidade || prof.estado) ? (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {[prof.cidade, prof.estado].filter(Boolean).join(", ")}
                            </p>
                          ) : null}
                          {prof.distancia !== null && (
                            <p className="text-xs font-medium text-primary flex items-center gap-1 mt-0.5" title={`Distância até ${referenciaLabel}`}>
                              <Navigation className="h-3 w-3 shrink-0" />
                              {prof.distancia === 0 ? "na mesma cidade" : `a ${prof.distancia} km`}
                              {prof.viaInteresse && <span className="font-normal text-muted-foreground"> · quer trabalhar em {prof.viaInteresse}</span>}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Especialidades */}
                      {(prof.especialidades ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {prof.especialidades.slice(0, 2).map((e) => (
                            <Badge key={e} variant="secondary" className="text-xs font-normal">
                              {ESPECIALIDADES.find((esp) => esp.value === e)?.label ?? e}
                            </Badge>
                          ))}
                          {prof.especialidades.length > 2 && (
                            <Badge variant="outline" className="text-xs font-normal">
                              +{prof.especialidades.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Resumo */}
                      {prof.resumoProfissional && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                          {prof.resumoProfissional}
                        </p>
                      )}

                      {/* Disponibilidade + datas */}
                      <div className="pt-3 border-t space-y-1.5">
                        {(prof.disponibilidade?.tipo ?? []).length > 0 && (
                          <div className="flex flex-wrap items-center gap-1">
                            {prof.disponibilidade.tipo.map((t) => (
                              <span
                                key={t}
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${DISPON_COR[t] ?? "bg-muted text-muted-foreground"}`}
                              >
                                {DISPON_LABEL[t] ?? t}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-[11px] text-muted-foreground">
                          {prof.createdAt && <span title="Data do cadastro">cadastro {dataCurta(prof.createdAt)}</span>}
                          {atualizado && <span title="Última atualização do perfil"> · atualizado {atualizado}</span>}
                          {ativo && <span title="Última vez que usou o VagaON"> · ativo {ativo}</span>}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
