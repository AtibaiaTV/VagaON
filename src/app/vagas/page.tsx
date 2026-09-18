import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Vaga from "@/models/Vaga";
import Empresa from "@/models/Empresa";
import { filtroEmpresaDoUsuario } from "@/lib/servicos/equipe";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ESPECIALIDADES } from "@/constants/especialidades";
import { MapPin, Clock, Plus, Briefcase } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import VagasListaPublica from "@/components/vagas/VagasListaPublica";
import BrandBand from "@/components/shared/BrandBand";
import { COR_STATUS_VAGA, LABEL_STATUS_VAGA, diasAte, type StatusVaga } from "@/lib/vagas-estado";
import { cidadesComVagas } from "@/lib/servicos/paginas-vagas";

const TIPO_LABEL: Record<string, string> = {
  clt: "CLT", temporario: "Temporário", sazonal: "Sazonal",
};
const TIPO_COR: Record<string, string> = {
  clt: "bg-blue-100 text-blue-700",
  temporario: "bg-orange-100 text-orange-700",
  sazonal: "bg-purple-100 text-purple-700",
};

interface VagaPopulada {
  _id: string;
  titulo: string;
  tipo: string;
  especialidade: string;
  cidade: string;
  estado: string;
  status: StatusVaga;
  totalCandidaturas: number;
  expiresAt?: string | null;
  preenchidas?: number;
  posicoes?: number;
  createdAt: string;
  updatedAt?: string;
  ultimaVisualizacaoEm?: string | null;
  empresaId: { nomeFantasia: string; cidade: string; estado: string };
  salario: { tipo: string; min: number | null; max: number | null; periodo: string };
}

function formatarSalario(salario: VagaPopulada["salario"]) {
  if (salario.tipo === "a_combinar") return "A combinar";
  const periodoLabel: Record<string, string> = { hora: "/h", dia: "/dia", mes: "/mês" };
  if (salario.tipo === "fixo") return `R$ ${salario.max?.toLocaleString("pt-BR")}${periodoLabel[salario.periodo]}`;
  return `R$ ${salario.min?.toLocaleString("pt-BR")} – ${salario.max?.toLocaleString("pt-BR")}${periodoLabel[salario.periodo]}`;
}

export default async function VagasPage() {
  const session = await auth();
  await connectDB();

  let vagas: VagaPopulada[] = [];
  let isEmpresa = false;

  if (session?.user.role === "empresa") {
    isEmpresa = true;
    const empresa = await Empresa.findOne(filtroEmpresaDoUsuario(session.user.id));
    if (empresa) {
      const raw = await Vaga.find({ empresaId: empresa._id })
        .sort({ createdAt: -1 })
        .populate("empresaId", "nomeFantasia cidade estado")
        .lean();
      vagas = JSON.parse(JSON.stringify(raw));
    }
  }

  const cidadesSeo = isEmpresa ? [] : await cidadesComVagas().catch(() => []);

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <Navbar />

      {/* Hero da página */}
      <BrandBand color={isEmpresa ? "darker" : "dark"} className="py-10">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isEmpresa ? "Minhas Vagas" : "Vagas disponíveis"}
            </h1>
            <p className="text-white/70 text-sm mt-1">
              {isEmpresa ? "Gerencie suas oportunidades publicadas" : "Encontre sua próxima oportunidade"}
            </p>
          </div>
          {isEmpresa && (
            <Link href="/vagas/nova">
              <Button size="sm" className="bg-white text-[#1a5c38] hover:bg-white/90 font-semibold gap-2">
                <Plus className="h-4 w-4" />Nova Vaga
              </Button>
            </Link>
          )}
        </div>
      </BrandBand>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Vista Empresa: lista próprias vagas */}
        {isEmpresa && (
          vagas.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Você ainda não publicou vagas</h2>
              <Link href="/vagas/nova">
                <Button className="mt-4">Publicar primeira vaga</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {vagas.map((vaga) => (
                <Link key={vaga._id} href={`/vagas/${vaga._id}`}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                    <CardContent className="pt-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="font-semibold leading-tight">{vaga.titulo}</h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${TIPO_COR[vaga.tipo]}`}>
                          {TIPO_LABEL[vaga.tipo]}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {vaga.empresaId?.nomeFantasia}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="secondary" className="text-xs">
                          {ESPECIALIDADES.find((e) => e.value === vaga.especialidade)?.label ?? vaga.especialidade}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {vaga.cidade}, {vaga.estado}
                          {vaga.createdAt && (
                            <span className="text-muted-foreground/70" title="Data em que a vaga foi cadastrada">
                              · {new Date(vaga.createdAt).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </span>
                        <span>{formatarSalario(vaga.salario)}</span>
                      </div>
                      <div className="mt-3 pt-3 border-t flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-2 min-w-0">
                          <span className={`font-semibold px-2 py-0.5 rounded-full ${COR_STATUS_VAGA[vaga.status] ?? "bg-muted"}`}>
                            {LABEL_STATUS_VAGA[vaga.status] ?? vaga.status}
                          </span>
                          {vaga.status === "ativa" && diasAte(vaga.expiresAt) !== null && (
                            <span className={`truncate ${(diasAte(vaga.expiresAt) ?? 99) <= 3 ? "text-amber-700 font-medium" : ""}`}>
                              expira em {Math.max(0, diasAte(vaga.expiresAt) ?? 0)} dia(s)
                            </span>
                          )}
                        </span>
                        <span className="flex items-center gap-1 shrink-0">
                          <Clock className="h-3 w-3" />
                          {vaga.totalCandidaturas} candidatura(s)
                          {(vaga.preenchidas ?? 0) > 0 && ` · ${vaga.preenchidas}/${vaga.posicoes ?? 1} contratada(s)`}
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {vaga.updatedAt && <span title="Última atualização">atualizada {new Date(vaga.updatedAt).toLocaleDateString("pt-BR")}</span>}
                        <span title="Última vez que um candidato abriu a vaga">
                          {" · "}
                          {vaga.ultimaVisualizacaoEm
                            ? `vista ${new Date(vaga.ultimaVisualizacaoEm).toLocaleDateString("pt-BR")}`
                            : "ainda não vista"}
                        </span>
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )
        )}

        {/* Vista Pública / Profissional: filtros + lista via API */}
        {!isEmpresa && <VagasListaPublica />}

        {/* Páginas por cidade (SEO): só cidades com vaga ativa */}
        {!isEmpresa && cidadesSeo.length > 0 && (
          <section className="mt-12">
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Vagas por cidade</h2>
            <div className="flex flex-wrap gap-2">
              {cidadesSeo.map((c) => (
                <Link
                  key={c.slug}
                  href={`/vagas/em/${c.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-sm hover:border-primary/50 hover:text-primary"
                >
                  <MapPin className="h-3.5 w-3.5 text-primary/60" />
                  {c.cidade}, {c.uf}
                  <span className="text-xs text-muted-foreground">{c.total}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
