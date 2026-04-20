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

  const qtd = selecionadas.length;

  return (
    <div className="space-y-3">

      {/* Chips selecionadas */}
      {qtd > 0 && (
        <div className="flex flex-wrap gap-1.5 p-3 rounded-lg border" style={{ backgroundColor: "#f0faf5", borderColor: "#a3d9be" }}>
          {selecionadas.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ backgroundColor: "#2DB87A", color: "#ffffff" }}
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

      {/* Resultados da busca */}
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
                    className="px-3 py-1.5 rounded-full text-sm font-medium border transition-all"
                    style={
                      ativa
                        ? { backgroundColor: "#2DB87A", color: "#fff", borderColor: "#2DB87A" }
                        : { backgroundColor: "#fff", color: "#111", borderColor: "#d1d5db" }
                    }
                  >
                    {esp.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Categorias acordeão */}
      {!termoBusca && (
        <div className="border rounded-lg divide-y divide-border/60">
          {grupos.map(({ cat, itens }) => {
            const aberta = categoriasAbertas.has(cat.value);
            const qtdSel = itens.filter((i) => selecionadas.includes(i.value)).length;
            return (
              <div key={cat.value}>
                <button
                  type="button"
                  onClick={() => toggleCategoria(cat.value)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-left hover:bg-muted/40 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {cat.label}
                    {qtdSel > 0 && (
                      <span
                        className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: "#2DB87A", color: "#fff" }}
                      >
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

                {aberta && (
                  <div className="px-4 pb-4 pt-1 flex flex-wrap gap-2 bg-muted/20">
                    {itens.map((esp) => {
                      const ativa = selecionadas.includes(esp.value);
                      return (
                        <button
                          key={esp.value}
                          type="button"
                          onClick={() => toggle(esp.value)}
                          className="px-3 py-1.5 rounded-full text-sm font-medium border transition-all"
                          style={
                            ativa
                              ? { backgroundColor: "#2DB87A", color: "#fff", borderColor: "#2DB87A" }
                              : { backgroundColor: "#fff", color: "#111", borderColor: "#d1d5db" }
                          }
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

      {/* Contador */}
      <p className="text-xs text-muted-foreground">
        {qtd === 0 ? "Nenhuma função selecionada" : qtd === 1 ? "1 função selecionada" : `${qtd} funções selecionadas`}
      </p>
    </div>
  );
}
