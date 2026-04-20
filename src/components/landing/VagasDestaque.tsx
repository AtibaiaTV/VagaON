import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight, Briefcase, Clock } from "lucide-react";
import { ESPECIALIDADES } from "@/constants/especialidades";

const TIPO_LABEL: Record<string, string> = {
  clt: "CLT", temporario: "Temporário", sazonal: "Sazonal",
};
const TIPO_COR: Record<string, string> = {
  clt: "bg-blue-100 text-blue-700",
  temporario: "bg-amber-100 text-amber-700",
  sazonal: "bg-violet-100 text-violet-700",
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
  if (vagas.length === 0) return null;

  return (
    <section className="py-20 bg-[#f0faf5]">
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-3 bg-primary/10 px-3 py-1 rounded-full">
              Oportunidades
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight">Vagas em destaque</h2>
            <p className="text-muted-foreground mt-2">Publicadas recentemente por empresas verificadas.</p>
          </div>
          <Link href="/vagas" className="hidden sm:block shrink-0">
            <Button variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/5">
              Ver todas <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Grid de vagas */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vagas.map((vaga) => (
            <Link key={vaga._id} href={`/vagas/${vaga._id}`}>
              <div className="group h-full bg-white rounded-2xl border border-border/50 hover:border-primary/40 hover:shadow-lg transition-all duration-200 overflow-hidden">
                {/* Barra colorida no topo */}
                <div className="h-1.5 bg-gradient-to-r from-primary to-[#7de06a]" />

                <div className="p-5">
                  {/* Header do card */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                      <Briefcase className="h-5 w-5 text-primary" strokeWidth={1.75} />
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${TIPO_COR[vaga.tipo]}`}>
                      {TIPO_LABEL[vaga.tipo]}
                    </span>
                  </div>

                  {/* Título e empresa */}
                  <h3 className="font-bold text-base leading-snug mb-1 group-hover:text-primary transition-colors">
                    {vaga.titulo}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {vaga.empresaId?.nomeFantasia}
                  </p>

                  {/* Tag especialidade */}
                  <div className="mb-4">
                    <Badge variant="secondary" className="text-xs font-medium">
                      {ESPECIALIDADES.find((e) => e.value === vaga.especialidade)?.label ?? vaga.especialidade}
                    </Badge>
                  </div>

                  {/* Rodapé */}
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

        {/* Ver todas — mobile */}
        <div className="mt-8 text-center sm:hidden">
          <Link href="/vagas">
            <Button variant="outline" className="gap-2 border-primary/30 text-primary">
              Ver todas as vagas <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}
