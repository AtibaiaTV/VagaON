"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, X, ChevronDown, ChevronUp } from "lucide-react";
import { ESPECIALIDADES, CATEGORIAS, labelEspecialidade } from "@/constants/especialidades";

interface Props {
  selecionadas: string[];
  onChange: (selecionadas: string[]) => void;
}

export default function EspecialidadesMultiSelect({ selecionadas, onChange }: Props) {
  const [busca, setBusca] = useState("");
  const [categoriasAbertas, setCategoriasAbertas] = useState<Set<string>>(new Set());

  const termoBusca = busca.toLowerCase().trim();

  const resultadosBusca = useMemo(() => {
    if (!termoBusca) return [];
    return ESPECIALIDADES.filter((e) => e.label.toLowerCase().includes(termoBusca));
  }, [termoBusca]);

  const grupos = useMemo(() => {
    return CATEGORIAS.map((cat) => ({
      cat,
      itens: ESPECIALIDADES.filter((e) => e.categoria === cat.value),
    })).filter((g) => g.itens.length > 0);
  }, []);

  function toggle(value: string) {
    onChange(
      selecionadas.includes(value)
        ? selecionadas.filter((v) => v !== value)
        : [...selecionadas, value]
    );
  }

  function remover(value: string) {
    onChange(selecionadas.filter((v) => v !== value));
  }

  function toggleCategoria(catValue: string) {
    setCategoriasAbertas((prev) => {
      const next = new Set(prev);
      if (next.has(catValue)) next.delete(catValue);
      else next.add(catValue);
      return next;
    });
  }

  return (
    <div className="space-y-3">

      {/* Chips selecionadas */}
      {selecionadas.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-3 bg-primary/5 rounded-lg border border-primary/20">
          {selecionadas.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 text-xs bg-primary text-white px-2.5 py-1 rounded-full font-medium"
            >
              {labelEspecialidade(v)}
              <button
                type="button"
                onClick={() => remover(v)}
                className="hover:opacity-70 ml-0.5"
                aria-label={`Remover ${labelEspecialidade(v)}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Campo de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar função..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9 pr-9"
        />
        {busca && (
          <button
            type="button"
            onClick={() => setBusca("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Resultados da busca — chips inline, sem container de scroll */}
      {termoBusca && (
        <div className="border rounded-lg p-3">
          {resultadosBusca.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              Nenhuma função encontrada para &quot;{busca}&quot;
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {resultadosBusca.map((esp) => {
                const ativa = selecionadas.includes(esp.value);
                return (
                  <button
                    key={esp.value}
                    type="button"
                    onClick={() => toggle(esp.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      ativa
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-white text-foreground border-border hover:border-primary hover:text-primary"
                    }`}
                  >
                    {esp.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Categorias acordeão — sem busca */}
      {!termoBusca && (
        <div className="border rounded-lg divide-y divide-border/60">
          {grupos.map(({ cat, itens }) => {
            const aberta = categoriasAbertas.has(cat.value);
            const qtdSel = itens.filter((i) => selecionadas.includes(i.value)).length;
            return (
              <div key={cat.value}>
                {/* Header da categoria */}
                <button
                  type="button"
                  onClick={() => toggleCategoria(cat.value)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-left hover:bg-muted/40 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {cat.label}
                    {qtdSel > 0 && (
                      <span className="text-xs font-medium bg-primary text-white px-1.5 py-0.5 rounded-full">
                        {qtdSel}
                      </span>
                    )}
                  </span>
                  {aberta ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>

                {/* Chips da categoria — aparecem abaixo do header */}
                {aberta && (
                  <div className="px-4 pb-4 pt-1 flex flex-wrap gap-2 bg-muted/20">
                    {itens.map((esp) => {
                      const ativa = selecionadas.includes(esp.value);
                      return (
                        <button
                          key={esp.value}
                          type="button"
                          onClick={() => toggle(esp.value)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                            ativa
                              ? "bg-primary text-white border-primary shadow-sm"
                              : "bg-white text-foreground border-border hover:border-primary hover:text-primary"
                          }`}
                        >
                          {esp.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {selecionadas.length} função{selecionadas.length !== 1 ? "ões" : ""} selecionada{selecionadas.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
