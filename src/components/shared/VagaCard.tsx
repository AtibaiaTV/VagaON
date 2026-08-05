import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase } from "lucide-react";
import { ESPECIALIDADES } from "@/constants/especialidades";

export interface VagaCardData {
  _id: string;
  titulo: string;
  tipo: string;
  especialidade: string;
  cidade: string;
  estado: string;
  salario: { tipo: string; min?: number | null; max: number | null; periodo: string };
  empresaId?: { nomeFantasia: string };
}

const TIPO_LABEL: Record<string, string> = { clt: "CLT", temporario: "Temporário", sazonal: "Sazonal" };
const TIPO_COR: Record<string, string> = {
  clt: "bg-blue-400/20 text-white border-blue-300/30",
  temporario: "bg-amber-400/20 text-white border-amber-300/30",
  sazonal: "bg-violet-400/20 text-white border-violet-300/30",
};

export function formatarSalario(s: VagaCardData["salario"]) {
  if (!s || s.tipo === "a_combinar") return "A combinar";
  const p: Record<string, string> = { hora: "/h", dia: "/dia", mes: "/mês" };
  if (s.min && s.max) return `R$ ${s.min.toLocaleString("pt-BR")} – ${s.max.toLocaleString("pt-BR")}${p[s.periodo] ?? ""}`;
  return `R$ ${s.max?.toLocaleString("pt-BR")}${p[s.periodo] ?? ""}`;
}

export default function VagaCard({ vaga }: { vaga: VagaCardData }) {
  return (
    <Link href={`/vagas/${vaga._id}`}>
      <div className="group h-full rounded-2xl overflow-hidden border border-border/30 hover:border-primary/40 hover:shadow-lg transition-all duration-200">
        {/* Header verde */}
        <div style={{ backgroundColor: "#1a5c38" }} className="px-5 pt-5 pb-4 relative">
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#4ade80] via-[#2DB87A] to-[#143f28]" />
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <Briefcase className="h-5 w-5 text-white/80" strokeWidth={1.75} />
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 whitespace-nowrap ${
                TIPO_COR[vaga.tipo] ?? "bg-white/15 text-white border-white/20"
              }`}
            >
              {TIPO_LABEL[vaga.tipo] ?? vaga.tipo}
            </span>
          </div>
          <h3 className="font-bold text-base text-white leading-snug mb-0.5 group-hover:text-[#4ade80] transition-colors line-clamp-2">
            {vaga.titulo}
          </h3>
          <p className="text-sm text-white/65">{vaga.empresaId?.nomeFantasia}</p>
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
            <span className="text-sm font-semibold text-foreground">{formatarSalario(vaga.salario)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
