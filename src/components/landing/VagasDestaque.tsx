"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight, Briefcase, Search, SlidersHorizontal, X } from "lucide-react";
import { ESPECIALIDADES } from "@/constants/especialidades";

// ── Mapeamento de área ─────────────────────────────────────────────────────
const GASTRONOMIA = ["cozinha", "bar", "salao", "caixa_financeiro", "compras_estoque", "limpeza_manutencao", "seguranca", "gestao_admin"];
const HOTELARIA    = ["hospedagem", "governanca", "lazer_hospede", "transporte"];
const EVENTOS      = ["eventos_catering", "audiovisual", "beleza", "decoracao", "entretenimento", "marketing_comunicacao", "comercial_reservas", "tecnologia"];

function getArea(especialidade: string): "gastronomia" | "hotelaria" | "eventos" | "outro" {
  const cat = ESPECIALIDADES.find((e) => e.value === especialidade)?.categoria ?? "";
  if (GASTRONOMIA.includes(cat)) return "gastronomia";
  if (HOTELARIA.includes(cat))   return "hotelaria";
  if (EVENTOS.includes(cat))     return "eventos";
  return "outro";
}

const TIPO_LABEL: Record<string, string> = { clt: "CLT", temporario: "Temporário", sazonal: "Sazonal" };
const TIPO_COR: Record<string, string> = {
  clt: "bg-blue-400/20 text-white border-blue-300/30",
  temporario: "bg-amber-400/20 text-white border-amber-300/30",
  sazonal: "bg-violet-400/20 text-white border-violet-300/30",
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

// ── Chip de filtro ──────────────────────────────────────────────────────────
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all border whitespace-nowrap ${
        active
          ? "bg-primary text-white border-primary shadow-sm"
          : "bg-white text-foreground border-border hover:border-primary/50 hover:text-primary"
      }`}
    >
      {label}
    </button>
  );
}

export default function VagasDestaque({ vagas }: { vagas: VagaCard[] }) {
  const [busca, setBusca] = useState("");
  const [area, setArea] = useState<string>("todas");
  const [tipo, setTipo] = useState<string>("todos");
  const [estado, setEstado] = useState<string>("todos");

  // Extrair cidades únicas das vagas
  const cidades = useMemo(() => {
    const set = new Set(vagas.map((v) => v.cidade).filter(Boolean));
    return Array.from(set).sort();
  }, [vagas]);

  // Filtrar vagas
  const vagasFiltradas = useMemo(() => {
    return vagas.filter((v) => {
      const matchBusca = !busca ||
        v.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        v.cidade.toLowerCase().includes(busca.toLowerCase()) ||
        v.empresaId?.nomeFantasia?.toLowerCase().includes(busca.toLowerCase());
      const matchArea  = area === "todas" || getArea(v.especialidade) === area;
      const matchTipo  = tipo === "todos" || v.tipo === tipo;
      const matchEstado = estado === "todos" || v.cidade === estado;
      return matchBusca && matchArea && matchTipo && matchEstado;
    });
  }, [vagas, busca, area, tipo, estado]);

  const temFiltro = area !== "todas" || tipo !== "todos" || estado !== "todos" || busca;

  function limparFiltros() {
    setBusca(""); setArea("todas"); setTipo("todos"); setEstado("todos");
  }

  return (
    <section className="py-20 bg-[#f0faf5]">
      <div className="max-w-6xl mx-auto px-6">

        {/* Cabeçalho */}
        <div className="flex items-end justify-between gap-4 mb-10">
          <div>
            <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-3 bg-primary/10 px-3 py-1 rounded-full">
              Oportunidades
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
              Vagas disponíveis
            </h2>
            <p className="text-muted-foreground text-base mt-2">
              Oportunidades reais em gastronomia, hotelaria e eventos em todo o Brasil.
            </p>
          </div>
          <Link href="/vagas" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline shrink-0">
            Ver todas as vagas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Barra de Filtros */}
        <div className="bg-white rounded-2xl shadow-sm border border-border/40 p-5 mb-8 space-y-4">

          {/* Busca por texto */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por cargo, cidade ou empresa..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-[#f4f7f5] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            {busca && (
              <button onClick={() => setBusca("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filtros em 3 colunas iguais */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 pt-1">

            {/* Área */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Área</p>
              <div className="flex flex-wrap gap-2">
                <Chip label="Todas" active={area === "todas"} onClick={() => setArea("todas")} />
                <Chip label="Gastronomia" active={area === "gastronomia"} onClick={() => setArea("gastronomia")} />
                <Chip label="Hotelaria" active={area === "hotelaria"} onClick={() => setArea("hotelaria")} />
                <Chip label="Eventos" active={area === "eventos"} onClick={() => setArea("eventos")} />
              </div>
            </div>

            {/* Período */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Período</p>
              <div className="flex flex-wrap gap-2">
                <Chip label="Todos" active={tipo === "todos"} onClick={() => setTipo("todos")} />
                <Chip label="CLT" active={tipo === "clt"} onClick={() => setTipo("clt")} />
                <Chip label="Temporário" active={tipo === "temporario"} onClick={() => setTipo("temporario")} />
                <Chip label="Sazonal" active={tipo === "sazonal"} onClick={() => setTipo("sazonal")} />
              </div>
            </div>

            {/* Cidade */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cidade</p>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="h-10 w-full px-4 rounded-xl border border-border bg-[#f4f7f5] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
              >
                <option value="todos">Todas as cidades</option>
                {cidades.map((cidade) => (
                  <option key={cidade} value={cidade}>{cidade}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Linha de resultado + limpar */}
          <div className="flex items-center justify-between pt-1 border-t border-border/40">
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>
                <span className="font-semibold text-foreground">{vagasFiltradas.length}</span>
                {" "}vaga{vagasFiltradas.length !== 1 ? "s" : ""} encontrada{vagasFiltradas.length !== 1 ? "s" : ""}
              </span>
            </p>
            {temFiltro && (
              <button
                onClick={limparFiltros}
                className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
              >
                <X className="h-3 w-3" />Limpar filtros
              </button>
            )}
          </div>
        </div>

        {/* Grid de vagas */}
        {vagasFiltradas.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-border/40">
            <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold text-foreground mb-1">Nenhuma vaga encontrada</p>
            <p className="text-sm text-muted-foreground mb-4">Tente ajustar os filtros ou busque por outro termo.</p>
            <button onClick={limparFiltros} className="text-sm text-primary hover:underline font-medium">
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vagasFiltradas.map((vaga) => (
              <Link key={vaga._id} href={`/vagas/${vaga._id}`}>
                <div className="group h-full rounded-2xl overflow-hidden border border-border/30 hover:border-primary/40 hover:shadow-lg transition-all duration-200">

                  {/* Header verde */}
                  <div
                    style={{ backgroundColor: "#1a5c38" }}
                    className="px-5 pt-5 pb-4 relative"
                  >
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#4ade80] via-[#2DB87A] to-[#143f28]" />
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                        <Briefcase className="h-5 w-5 text-white/80" strokeWidth={1.75} />
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 whitespace-nowrap ${TIPO_COR[vaga.tipo]}`}>
                        {TIPO_LABEL[vaga.tipo]}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-white leading-snug mb-0.5 group-hover:text-[#4ade80] transition-colors">
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
        )}

        {/* Link "Ver todas" — mobile */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/vagas">
            <Button className="gap-2 font-semibold px-8 h-11">
              Ver todas as vagas
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}
