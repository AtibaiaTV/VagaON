"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase, Search, SlidersHorizontal, X } from "lucide-react";
import { ESPECIALIDADES } from "@/constants/especialidades";
import FilterChip from "@/components/shared/FilterChip";
import VagaCard from "@/components/shared/VagaCard";

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

interface VagaCardItem {
  _id: string;
  titulo: string;
  tipo: string;
  especialidade: string;
  cidade: string;
  estado: string;
  salario: { tipo: string; max: number | null; periodo: string };
  empresaId: { nomeFantasia: string };
}

export default function VagasDestaque({ vagas }: { vagas: VagaCardItem[] }) {
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
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <FilterChip label="Gastronomia" active={area === "gastronomia"} onClick={() => setArea(area === "gastronomia" ? "todas" : "gastronomia")} />
                <FilterChip label="Hotelaria"   active={area === "hotelaria"}   onClick={() => setArea(area === "hotelaria"   ? "todas" : "hotelaria")} />
                <FilterChip label="Eventos"     active={area === "eventos"}     onClick={() => setArea(area === "eventos"     ? "todas" : "eventos")} />
              </div>
            </div>

            {/* Período */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Período</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <FilterChip label="CLT"        active={tipo === "clt"}        onClick={() => setTipo(tipo === "clt"        ? "todos" : "clt")} />
                <FilterChip label="Temporário" active={tipo === "temporario"} onClick={() => setTipo(tipo === "temporario" ? "todos" : "temporario")} />
                <FilterChip label="Sazonal"    active={tipo === "sazonal"}    onClick={() => setTipo(tipo === "sazonal"    ? "todos" : "sazonal")} />
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
              <VagaCard key={vaga._id} vaga={vaga} />
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
