"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ESPECIALIDADES } from "@/constants/especialidades";
import { MapPin, Loader2, Navigation, Search, Briefcase, X } from "lucide-react";

const TIPO_LABEL: Record<string, string> = {
  clt: "CLT",
  temporario: "Temporário",
  sazonal: "Sazonal",
};
const TIPO_COR: Record<string, string> = {
  clt: "bg-blue-50 text-blue-700 border-blue-200",
  temporario: "bg-amber-50 text-amber-700 border-amber-200",
  sazonal: "bg-violet-50 text-violet-700 border-violet-200",
};

interface VagaCard {
  _id: string;
  titulo: string;
  tipo: string;
  especialidade: string;
  cidade: string;
  estado: string;
  salario: { tipo: string; min: number | null; max: number | null; periodo: string };
  empresaId: { nomeFantasia: string; cidade: string; estado: string };
}

function formatarSalario(s: VagaCard["salario"]) {
  if (!s || s.tipo === "a_combinar") return "A combinar";
  const pl: Record<string, string> = { hora: "/h", dia: "/dia", mes: "/mês" };
  if (s.tipo === "fixo") return `R$ ${s.max?.toLocaleString("pt-BR")}${pl[s.periodo] ?? ""}`;
  if (s.min && s.max)
    return `R$ ${s.min.toLocaleString("pt-BR")} – ${s.max.toLocaleString("pt-BR")}${pl[s.periodo] ?? ""}`;
  return "A combinar";
}

const SUPER_CATS = [
  { value: "gastronomia", label: "Gastronomia", emoji: "🍽️" },
  { value: "hotelaria",   label: "Hotelaria",   emoji: "🏨" },
  { value: "eventos",     label: "Eventos",     emoji: "🎪" },
];
const TIPOS = [
  { value: "clt",        label: "CLT" },
  { value: "temporario", label: "Temporário" },
  { value: "sazonal",    label: "Sazonal" },
];

export default function VagasListaPublica() {
  const [superCategoria, setSuperCategoria] = useState("");
  const [tipo, setTipo] = useState("");
  const [cidade, setCidade] = useState("");
  const [cidadeInput, setCidadeInput] = useState("");
  const [busca, setBusca] = useState("");
  const [buscaInput, setBuscaInput] = useState("");
  const [sugestoes, setSugestoes] = useState<string[]>([]);
  const [showSugestoes, setShowSugestoes] = useState(false);
  const [vagas, setVagas] = useState<VagaCard[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [paginas, setPaginas] = useState(1);
  const [loading, setLoading] = useState(true);
  const [detectandoLocal, setDetectandoLocal] = useState(false);

  const buscaWrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Fetch vagas ── */
  const fetchVagas = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (superCategoria) params.set("superCategoria", superCategoria);
    if (tipo) params.set("tipo", tipo);
    if (cidade) params.set("cidade", cidade);
    if (busca) params.set("busca", busca);
    params.set("pagina", pagina.toString());
    try {
      const res = await fetch(`/api/vagas?${params}`);
      const data = await res.json();
      setVagas(data.vagas ?? []);
      setTotal(data.total ?? 0);
      setPaginas(data.paginas ?? 1);
    } catch {
      setVagas([]);
    } finally {
      setLoading(false);
    }
  }, [superCategoria, tipo, cidade, busca, pagina]);

  useEffect(() => { fetchVagas(); }, [fetchVagas]);

  /* ── Autocomplete no cargo ── */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (buscaInput.trim().length < 2) { setSugestoes([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/vagas?busca=${encodeURIComponent(buscaInput.trim())}`);
        const data = await res.json();
        const titulos = [...new Set<string>((data.vagas ?? []).map((v: VagaCard) => v.titulo))].slice(0, 6);
        setSugestoes(titulos);
        setShowSugestoes(titulos.length > 0);
      } catch {
        setSugestoes([]);
      }
    }, 280);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [buscaInput]);

  /* ── Fechar dropdown ao clicar fora ── */
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (buscaWrapRef.current && !buscaWrapRef.current.contains(e.target as Node))
        setShowSugestoes(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  /* ── Handlers ── */
  function aplicarBusca(valor?: string) {
    const v = (valor ?? buscaInput).trim();
    setBuscaInput(v);
    setBusca(v);
    setShowSugestoes(false);
    setPagina(1);
  }
  function limparBusca() { setBuscaInput(""); setBusca(""); setSugestoes([]); setPagina(1); }

  function aplicarCidade() { setCidade(cidadeInput.trim()); setPagina(1); }
  function limparCidade() { setCidadeInput(""); setCidade(""); setPagina(1); }

  function toggleSuperCategoria(v: string) { setSuperCategoria((p) => (p === v ? "" : v)); setPagina(1); }
  function toggleTipo(v: string) { setTipo((p) => (p === v ? "" : v)); setPagina(1); }

  async function usarLocalizacao() {
    if (!navigator.geolocation) return;
    setDetectandoLocal(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
      );
      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=pt-BR`,
        { headers: { "User-Agent": "VagaON/1.0" } }
      );
      const data = await res.json();
      const nomeCidade = data.address?.city || data.address?.town || data.address?.municipality || data.address?.village || "";
      if (nomeCidade) { setCidadeInput(nomeCidade); setCidade(nomeCidade); setPagina(1); }
    } catch { /* ignore */ } finally {
      setDetectandoLocal(false);
    }
  }

  const filtroAtivo = superCategoria || tipo || cidade || busca;

  /* ══════════════════════════════════════════════════════ */
  return (
    <div className="space-y-5">

      {/* ── Painel de filtros ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Busca por cargo */}
        <div className="p-4 pb-3">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Cargo</label>
          <div className="relative" ref={buscaWrapRef}>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={buscaInput}
              onChange={(e) => setBuscaInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") aplicarBusca(); if (e.key === "Escape") setShowSugestoes(false); }}
              onFocus={() => sugestoes.length > 0 && setShowSugestoes(true)}
              placeholder="Ex: Recepcionista, Chef, Garçom..."
              className="w-full pl-10 pr-28 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {buscaInput && (
                <button
                  onClick={limparBusca}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  aria-label="Limpar"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => aplicarBusca()}
                className="px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 active:scale-95 transition-all"
              >
                Buscar
              </button>
            </div>

            {/* Dropdown de sugestões */}
            {showSugestoes && sugestoes.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
                <p className="px-4 pt-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Sugestões</p>
                {sugestoes.map((s) => (
                  <button
                    key={s}
                    onMouseDown={() => aplicarBusca(s)}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left hover:bg-slate-50 transition-colors border-t border-slate-50"
                  >
                    <Search className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                    <span className="truncate text-slate-700">{s}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Área + Contrato em linha */}
        <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap gap-x-6 gap-y-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Área</label>
            <div className="flex flex-wrap gap-1.5">
              {SUPER_CATS.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => toggleSuperCategoria(cat.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    superCategoria === cat.value
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:bg-primary/5"
                  }`}
                >
                  <span>{cat.emoji}</span>{cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px bg-slate-150 self-stretch hidden sm:block" />

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Contrato</label>
            <div className="flex flex-wrap gap-1.5">
              {TIPOS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => toggleTipo(t.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    tipo === t.value
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:bg-primary/5"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cidade */}
        <div className="px-4 py-3 border-t border-slate-100">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Cidade</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={cidadeInput}
                onChange={(e) => setCidadeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && aplicarCidade()}
                placeholder="Ex: São Paulo, Campinas..."
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              />
              {cidadeInput && (
                <button onClick={limparCidade} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={aplicarCidade}
              className="px-3.5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 active:scale-95 transition-all shrink-0"
            >
              Buscar
            </button>
            <button
              onClick={usarLocalizacao}
              disabled={detectandoLocal}
              title="Usar minha localização"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:border-primary/40 hover:bg-primary/5 transition-all disabled:opacity-50 shrink-0"
            >
              {detectandoLocal ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
              <span className="hidden sm:inline">Perto de mim</span>
            </button>
          </div>
        </div>

        {/* Tags dos filtros ativos */}
        {filtroAtivo && (
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400">Ativos:</span>
            {busca && (
              <FilterTag label={`🔍 ${busca}`} onRemove={limparBusca} />
            )}
            {superCategoria && (
              <FilterTag
                label={`${SUPER_CATS.find((c) => c.value === superCategoria)?.emoji} ${SUPER_CATS.find((c) => c.value === superCategoria)?.label}`}
                onRemove={() => { setSuperCategoria(""); setPagina(1); }}
              />
            )}
            {tipo && (
              <FilterTag label={TIPO_LABEL[tipo]} onRemove={() => { setTipo(""); setPagina(1); }} />
            )}
            {cidade && (
              <FilterTag label={`📍 ${cidade}`} onRemove={limparCidade} />
            )}
            <button
              onClick={() => { setSuperCategoria(""); setTipo(""); limparCidade(); limparBusca(); }}
              className="ml-auto text-xs text-slate-400 hover:text-slate-600 underline-offset-2 hover:underline transition-colors"
            >
              Limpar tudo
            </button>
          </div>
        )}
      </div>

      {/* Contagem de resultados */}
      {!loading && (
        <p className="text-sm text-slate-500">
          {total === 0
            ? "Nenhuma vaga encontrada"
            : <><span className="font-semibold text-slate-800">{total}</span> vaga{total !== 1 ? "s" : ""} encontrada{total !== 1 ? "s" : ""}{filtroAtivo ? " com esses filtros" : ""}</>
          }
        </p>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        </div>
      ) : vagas.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
            <Briefcase className="h-7 w-7 text-slate-400" />
          </div>
          <h2 className="text-base font-semibold text-slate-700 mb-1">Nenhuma vaga encontrada</h2>
          <p className="text-sm text-slate-400">Tente ajustar ou remover algum filtro.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {vagas.map((vaga) => (
              <Link key={vaga._id} href={`/vagas/${vaga._id}`}>
                <div className="group bg-white rounded-xl border border-slate-200 hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer p-5 h-full flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-semibold text-slate-800 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      {vaga.titulo}
                    </h3>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${TIPO_COR[vaga.tipo] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {TIPO_LABEL[vaga.tipo] ?? vaga.tipo}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-3">{vaga.empresaId?.nomeFantasia}</p>
                  <div className="mb-3">
                    <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2.5 py-1 font-medium">
                      {ESPECIALIDADES.find((e) => e.value === vaga.especialidade)?.label ?? vaga.especialidade}
                    </span>
                  </div>
                  <div className="mt-auto flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {vaga.cidade}, {vaga.estado}
                    </span>
                    <span className="font-semibold text-slate-600">{formatarSalario(vaga.salario)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {paginas > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                ← Anterior
              </button>
              <span className="px-3 py-2 text-sm text-slate-400 font-medium">
                {pagina} / {paginas}
              </span>
              <button
                onClick={() => setPagina((p) => Math.min(paginas, p + 1))}
                disabled={pagina === paginas}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Próxima →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary rounded-full px-2.5 py-1 font-semibold">
      {label}
      <button onClick={onRemove} className="ml-0.5 hover:opacity-70 transition-opacity">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
