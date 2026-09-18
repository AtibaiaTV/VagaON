"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";

export interface CidadeSugerida {
  cidade: string;
  uf: string;
  /** Quantos registros (profissionais ou vagas) existem nela. */
  n: number;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  /** Escolheu uma sugestão (ou confirmou com Enter o que digitou). */
  onSelect: (c: { cidade: string; uf: string | null }) => void;
  /** Limpou o campo. */
  onClear?: () => void;
  /** De onde vêm as sugestões: onde há profissionais ou onde há vagas ativas. */
  contexto: "profissionais" | "vagas";
  /** Restringe as sugestões a esta UF, se houver. */
  uf?: string;
  placeholder?: string;
  className?: string;
}

/**
 * Campo de cidade com sugestões do que existe no banco (ver
 * /api/geo/cidades). Setas, Enter e Escape funcionam; clique também.
 */
export default function AutocompleteCidade({ value, onChange, onSelect, onClear, contexto, uf, placeholder = "Cidade", className = "" }: Props) {
  const [sugestoes, setSugestoes] = useState<CidadeSugerida[]>([]);
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(-1);
  const raiz = useRef<HTMLDivElement>(null);
  const listaId = useId();

  // Busca com atraso curto; ignora respostas fora de ordem.
  useEffect(() => {
    if (!aberto) return;
    let cancelado = false;
    const t = setTimeout(async () => {
      const p = new URLSearchParams({ q: value, contexto });
      if (uf) p.set("uf", uf);
      const r = await fetch(`/api/geo/cidades?${p}`).catch(() => null);
      const d = r?.ok ? await r.json().catch(() => null) : null;
      if (!cancelado) {
        setSugestoes(Array.isArray(d?.sugestoes) ? d.sugestoes : []);
        setAtivo(-1);
      }
    }, 150);
    return () => {
      cancelado = true;
      clearTimeout(t);
    };
  }, [value, uf, contexto, aberto]);

  // Fecha ao clicar fora.
  useEffect(() => {
    function fora(e: MouseEvent) {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  function escolher(s: CidadeSugerida) {
    onChange(s.cidade);
    onSelect({ cidade: s.cidade, uf: s.uf || null });
    setAberto(false);
  }

  function teclado(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAberto(true);
      setAtivo((i) => Math.min(i + 1, sugestoes.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAtivo((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (aberto && ativo >= 0 && sugestoes[ativo]) escolher(sugestoes[ativo]);
      else {
        onSelect({ cidade: value.trim(), uf: null });
        setAberto(false);
      }
    } else if (e.key === "Escape") {
      setAberto(false);
    }
  }

  return (
    <div ref={raiz} className={`relative ${className}`}>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setAberto(true);
        }}
        onFocus={() => setAberto(true)}
        onKeyDown={teclado}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={aberto && sugestoes.length > 0}
        aria-controls={listaId}
        aria-autocomplete="list"
        autoComplete="off"
        className="w-full h-10 rounded-lg border px-3 pr-8 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        aria-label="Cidade"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            setSugestoes([]);
            setAberto(false);
            onClear?.();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Limpar cidade"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {aberto && sugestoes.length > 0 && (
        <ul
          id={listaId}
          role="listbox"
          className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-lg border bg-white shadow-lg text-sm"
        >
          {sugestoes.map((s, i) => (
            <li
              key={`${s.uf}:${s.cidade}`}
              role="option"
              aria-selected={i === ativo}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => escolher(s)}
              onMouseEnter={() => setAtivo(i)}
              className={`flex items-center justify-between gap-2 px-3 py-2 cursor-pointer ${i === ativo ? "bg-primary/10" : "hover:bg-muted"}`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <MapPin className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                <span className="truncate">
                  {s.cidade}
                  {s.uf && <span className="text-muted-foreground"> · {s.uf}</span>}
                </span>
              </span>
              <span className="text-xs text-muted-foreground shrink-0">{s.n}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
