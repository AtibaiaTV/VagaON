"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X, SlidersHorizontal } from "lucide-react";
import FilterChip from "@/components/shared/FilterChip";
import { ESTADOS } from "@/constants/estados";
import { CATEGORIAS } from "@/constants/especialidades";

/**
 * Filtros do banco de profissionais. Tudo vive na URL (?tipo=&cat=&uf=…):
 * a página é um Server Component que lê os searchParams e consulta o banco,
 * então o link fica compartilhável e o "voltar" do navegador funciona.
 */

export const TIPOS_CONTRATO = [
  { value: "clt", label: "CLT" },
  { value: "temporario", label: "Temporário" },
  { value: "sazonal", label: "Sazonal" },
];

export const RAIOS_KM = [10, 25, 50, 100, 200];

export const ORDENS = [
  { value: "relevancia", label: "Perfil mais completo" },
  { value: "distancia", label: "Mais perto" },
  { value: "recentes", label: "Cadastro mais recente" },
  { value: "atualizados", label: "Atualizado há menos tempo" },
  { value: "ativos", label: "Ativo há menos tempo" },
];

interface Props {
  /** Há ponto de referência (cidade da empresa ou cidade filtrada) para raio e distância. */
  temReferencia: boolean;
  referenciaLabel: string | null;
}

export default function FiltrosProfissionais({ temReferencia, referenciaLabel }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const q = sp.get("q") ?? "";
  const tipo = sp.get("tipo") ?? "";
  const cat = sp.get("cat") ?? "";
  const uf = sp.get("uf") ?? "";
  const cidade = sp.get("cidade") ?? "";
  const raio = sp.get("raio") ?? "";
  const ordem = sp.get("ordem") ?? "relevancia";

  const [qInput, setQInput] = useState(q);
  const [cidadeInput, setCidadeInput] = useState(cidade);
  useEffect(() => setQInput(q), [q]);
  useEffect(() => setCidadeInput(cidade), [cidade]);

  function definir(mudancas: Record<string, string>) {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(mudancas)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    router.push(`${pathname}${p.size ? `?${p}` : ""}`);
  }

  const ativos: { label: string; limpar: () => void }[] = [];
  if (q) ativos.push({ label: `"${q}"`, limpar: () => definir({ q: "" }) });
  if (tipo) ativos.push({ label: TIPOS_CONTRATO.find((t) => t.value === tipo)?.label ?? tipo, limpar: () => definir({ tipo: "" }) });
  if (cat) ativos.push({ label: CATEGORIAS.find((c) => c.value === cat)?.label ?? cat, limpar: () => definir({ cat: "" }) });
  if (uf) ativos.push({ label: uf, limpar: () => definir({ uf: "" }) });
  if (cidade) ativos.push({ label: cidade, limpar: () => definir({ cidade: "" }) });
  if (raio) ativos.push({ label: `até ${raio} km`, limpar: () => definir({ raio: "" }) });

  return (
    <div className="rounded-2xl border bg-white p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <SlidersHorizontal className="h-4 w-4 text-primary" />
        Filtrar profissionais
      </div>

      {/* Busca por nome */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          definir({ q: qInput.trim() });
        }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          placeholder="Buscar por nome…"
          className="w-full h-10 rounded-lg border pl-9 pr-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </form>

      {/* Regime */}
      <div className="flex flex-wrap gap-2">
        {TIPOS_CONTRATO.map((t) => (
          <FilterChip key={t.value} label={t.label} active={tipo === t.value} onClick={() => definir({ tipo: tipo === t.value ? "" : t.value })} />
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Área */}
        <select
          value={cat}
          onChange={(e) => definir({ cat: e.target.value })}
          className="h-10 rounded-lg border px-3 text-sm bg-white"
          aria-label="Área"
        >
          <option value="">Todas as áreas</option>
          {CATEGORIAS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        {/* UF */}
        <select
          value={uf}
          onChange={(e) => definir({ uf: e.target.value })}
          className="h-10 rounded-lg border px-3 text-sm bg-white"
          aria-label="Estado"
        >
          <option value="">Todos os estados</option>
          {ESTADOS.map((e) => (
            <option key={e.value} value={e.value}>{e.label}</option>
          ))}
        </select>

        {/* Cidade */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            definir({ cidade: cidadeInput.trim() });
          }}
          className="relative"
        >
          <input
            value={cidadeInput}
            onChange={(e) => setCidadeInput(e.target.value)}
            placeholder="Cidade"
            className="w-full h-10 rounded-lg border px-3 pr-8 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            aria-label="Cidade"
          />
          {cidadeInput && (
            <button
              type="button"
              onClick={() => { setCidadeInput(""); definir({ cidade: "" }); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpar cidade"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        {/* Raio */}
        <select
          value={raio}
          onChange={(e) => definir({ raio: e.target.value })}
          disabled={!temReferencia}
          className="h-10 rounded-lg border px-3 text-sm bg-white disabled:opacity-50"
          aria-label="Distância máxima"
          title={temReferencia ? `Distância a partir de ${referenciaLabel}` : "Informe a cidade da sua empresa no perfil, ou filtre por cidade, para usar o raio"}
        >
          <option value="">Qualquer distância</option>
          {RAIOS_KM.map((k) => (
            <option key={k} value={String(k)}>até {k} km{referenciaLabel ? ` de ${referenciaLabel}` : ""}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {ativos.map((a) => (
            <span key={a.label} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
              {a.label}
              <button type="button" onClick={a.limpar} aria-label={`Remover ${a.label}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {ativos.length > 0 && (
            <button type="button" onClick={() => router.push(pathname)} className="text-xs text-muted-foreground underline underline-offset-2">
              limpar tudo
            </button>
          )}
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Ordenar por
          <select
            value={ordem}
            onChange={(e) => definir({ ordem: e.target.value === "relevancia" ? "" : e.target.value })}
            className="h-8 rounded-md border px-2 text-xs bg-white"
          >
            {ORDENS.map((o) => (
              <option key={o.value} value={o.value} disabled={o.value === "distancia" && !temReferencia}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
