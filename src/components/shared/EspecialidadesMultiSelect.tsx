"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { ESPECIALIDADES, CATEGORIAS, labelEspecialidade } from "@/constants/especialidades";

interface Props {
  selecionadas: string[];
  onChange: (selecionadas: string[]) => void;
}

/** Seletor múltiplo com busca e agrupamento por categoria — para perfil do profissional */
export default function EspecialidadesMultiSelect({ selecionadas, onChange }: Props) {
  const [busca, setBusca] = useState("");
  const [categoriaAberta, setCategoriaAberta] = useState<string | null>(null);

  const filtradas = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    if (!termo) return ESPECIALIDADES;
    return ESPECIALIDADES.filter((e) => e.label.toLowerCase().includes(termo));
  }, [busca]);

  const agrupadas = useMemo(() => {
    if (busca.trim()) {
      // Busca ativa: mostra resultado flat sem agrupamento
      return [{ categoriaLabel: "Resultados", itens: filtradas }];
    }
    return CATEGORIAS.map((cat) => ({
      categoriaLabel: cat.label,
      catValue: cat.value,
      itens: ESPECIALIDADES.filter((e) => e.categoria === cat.value),
    })).filter((g) => g.itens.length > 0);
  }, [busca, filtradas]);

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
              <button type="button" onClick={() => remover(v)} className="hover:opacity-70 ml-0.5">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Campo de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar função..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Lista agrupada */}
      <div className="border rounded-lg overflow-hidden max-h-72 overflow-y-auto">
        {agrupadas.map((grupo) => (
          <div key={grupo.categoriaLabel}>
            {/* Header da categoria (clicável para expandir/recolher quando sem busca) */}
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-2 bg-muted/60 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:bg-muted transition-colors sticky top-0"
              onClick={() =>
                setCategoriaAberta(
                  categoriaAberta === grupo.categoriaLabel ? null : grupo.categoriaLabel
                )
              }
              disabled={!!busca.trim()}
            >
              <span>{grupo.categoriaLabel}</span>
              <span className="font-normal normal-case tracking-normal">
                {grupo.itens.filter((i) => selecionadas.includes(i.value)).length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {grupo.itens.filter((i) => selecionadas.includes(i.value)).length} selecionadas
                  </Badge>
                )}
              </span>
            </button>

            {/* Itens da categoria */}
            {(busca.trim() || categoriaAberta === grupo.categoriaLabel || !busca.trim()) && (
              <div>
                {grupo.itens.map((esp) => {
                  const ativa = selecionadas.includes(esp.value);
                  return (
                    <button
                      key={esp.value}
                      type="button"
                      onClick={() => toggle(esp.value)}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
                        ativa
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted/50 text-foreground"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                          ativa ? "bg-primary border-primary" : "border-muted-foreground/30"
                        }`}
                      >
                        {ativa && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      {esp.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {filtradas.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhuma função encontrada para &quot;{busca}&quot;
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {selecionadas.length} função{selecionadas.length !== 1 ? "ões" : ""} selecionada{selecionadas.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
