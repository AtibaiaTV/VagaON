import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight, Briefcase } from "lucide-react";
import { ESPECIALIDADES } from "@/constants/especialidades";

const TIPO_LABEL: Record<string, string> = {
  clt: "CLT", temporario: "Temporário", sazonal: "Sazonal",
};

interface VagaCard {
  _id: string;
  titulo: string;
  tipo: string;
  especialidade: string;
  cidade: string;
  estado: string;
  salario: { tipo: string; max: number | null; periodo: string };
  empresaId: { nomeFantasia: string };
}

function formatarSalario(s: VagaCard["salario"]) {
  if (!s || s.tipo === "a_combinar") return "A combinar";
  const p: Record<string, string> = { hora: "/h", dia: "/dia", mes: "/mês" };
  return `R$ ${s.max?.toLocaleString("pt-BR")}${p[s.periodo] ?? ""}`;
}

export default function VagasDestaque({ vagas }: { vagas: VagaCard[] }) {
  return (
    <section className="py-20 bg-[#f0faf5]">
      <div className="max-w-6xl mx-auto px-6">

        {/* Intro — estilo CriarPerfilBox */}
        <div className="grid lg:grid-cols-2 gap-8 items-center mb-16">

          {/* Esquerda — texto */}
          <div>
            <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-4 bg-primary/10 px-3 py-1 rounded-full">
              Oportunidades
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">
              Vagas em destaque
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Oportunidades reais publicadas por restaurantes, hotéis, bares e eventos em todo o Brasil. Novas vagas todos os dias.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/vagas">
                <Button size="lg" className="gap-2 px-8 h-12 font-semibold">
                  Ver todas as vagas
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/cadastro/profissional">
                <Button size="lg" variant="outline" className="gap-2 px-8 h-12 border-primary/30 text-primary hover:bg-primary/5">
                  Criar meu perfil
                </Button>
              </Link>
            </div>
          </div>

          {/* Direita — mock card com header verde */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-xl border border-border/20">

              {/* Header verde */}
              <div style={{ backgroundColor: "#1a5c38" }} className="px-5 pt-5 pb-4 relative">
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#4ade80] via-[#2DB87A] to-[#143f28]" />
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                    <Briefcase className="h-5 w-5 text-white/80" strokeWidth={1.75} />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-400/20 text-white border border-white/20 shrink-0">CLT</span>
                </div>
                <h3 className="font-bold text-base text-white leading-snug mb-0.5">Garçom / Garçonete</h3>
                <p className="text-sm text-white/65">Restaurante Bella Vista</p>
              </div>

              {/* Corpo branco */}
              <div className="bg-white px-5 py-4">
                <div className="mb-4">
                  <span className="inline-flex items-center text-xs font-medium bg-primary/10 text-primary px-2.5 py-0.5 rounded-md">
                    Garçom
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border/40">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary/60" />São Paulo, SP
                  </span>
                  <span className="text-sm font-semibold text-foreground">R$ 2.500/mês</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de vagas reais — cards com header verde */}
        {vagas.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {vagas.map((vaga) => (
                <Link key={vaga._id} href={`/vagas/${vaga._id}`}>
                  <div className="group h-full rounded-2xl overflow-hidden border border-border/30 hover:border-primary/30 hover:shadow-lg transition-all duration-200">

                    {/* Header verde */}
                    <div
                      style={{ backgroundColor: "#1a5c38" }}
                      className="px-5 pt-5 pb-4 relative group-hover:opacity-95 transition-opacity"
                    >
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#4ade80] via-[#2DB87A] to-[#143f28]" />
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                          <Briefcase className="h-5 w-5 text-white/80" strokeWidth={1.75} />
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/15 text-white border border-white/20 shrink-0 whitespace-nowrap">
                          {TIPO_LABEL[vaga.tipo]}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-white leading-snug mb-0.5">
                        {vaga.titulo}
                      </h3>
                      <p className="text-sm text-white/65">
                        {vaga.empresaId?.nomeFantasia}
                      </p>
                    </div>

                    {/* Corpo branco */}
                    <div className="bg-white px-5 py-4">
                      <div className="mb-4">
                        <Badge variant="secondary" className="text-xs font-medium bg-primary/10 text-primary hover:bg-primary/10">
                          {ESPECIALIDADES.find((e) => e.value === vaga.especialidade)?.label ?? vaga.especialidade}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-border/40">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 text-primary/60" />
                          {vaga.cidade}, {vaga.estado}
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {formatarSalario(vaga.salario)}
                        </span>
                      </div>
                    </div>

                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link href="/vagas">
                <Button variant="outline" className="gap-2 border-primary/30 text-primary">
                  Ver todas as vagas <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </>
        )}

      </div>
    </section>
  );
}
