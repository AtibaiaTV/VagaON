"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MapPin, Loader2, Navigation, Search, Briefcase, X } from "lucide-react";
import { ESTADOS } from "@/constants/estados";
import FilterChip from "@/components/shared/FilterChip";
import VagaCard, { type VagaCardData } from "@/components/shared/VagaCard";

const TIPO_LABEL: Record<string, string> = {
  clt: "CLT",
  temporario: "Temporário",
  sazonal: "Sazonal",
};

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
const RAIOS = [
  { value: "cidade", label: "Só minha cidade" },
  { value: "estado", label: "Minha região (estado)" },
];

function normalizar(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export default function VagasListaPublica() {
  const [superCategoria, setSuperCategoria] = useState("");
  const [tipo, setTipo] = useState("");
  const [cidade, setCidade] = useState("");
  const [cidadeInput, setCidadeInput] = useState("");
  const [estadoLocal, setEstadoLocal] = useState("");
  const [raio, setRaio] = useState<"cidade" | "estado">("cidade");
  const [busca, setBusca] = useState("");
  const [buscaInput, setBuscaInput] = useState("");
  const [sugestoes, setSugestoes] = useState<string[]>([]);
  const [showSugestoes, setShowSugestoes] = useState(false);
  const [vagas, setVagas] = useState<VagaCardData[]>([]);
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
    if (raio === "estado" && estadoLocal) {
      params.set("estado", estadoLocal);
    } else if (cidade) {
      params.set("cidade", cidade);
    }
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
  }, [superCategoria, tipo, cidade, estadoLocal, raio, busca, pagina]);

  useEffect(() => { fetchVagas(); }, [fetchVagas]);

  /* ── Autocomplete no cargo ── */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (buscaInput.trim().length < 2) { setSugestoes([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/vagas?busca=${encodeURIComponent(buscaInput.trim())}`);
        const data = await res.json();
        const titulos = Array.from(new Set<string>((data.vagas ?? []).map((v: VagaCardData) => v.titulo))).slice(0, 6);
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

  function aplicarCidade() { setCidade(cidadeInput.trim()); setEstadoLocal(""); setPagina(1); }
  function limparCidade() { setCidadeInput(""); setCidade(""); setEstadoLocal(""); setPagina(1); }

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
      const nomeEstado = data.address?.state || "";
      const uf = ESTADOS.find((e) => normalizar(e.label) === normalizar(nomeEstado))?.value ?? "";
      setEstadoLocal(uf);
      if (nomeCidade) { setCidadeInput(nomeCidade); setCidade(nomeCidade); }
      setPagina(1);
    } catch { /* ignore */ } finally {
      setDetectandoLocal(false);
    }
  }

  const usandoRaioEstado = raio === "estado" && !!estadoLocal;
  const filtroAtivo = superCategoria || tipo || cidade || busca || usandoRaioEstado;

  /* ══════════════════════════════════════════════════════ */
  return (
    <div className="space-y-5">

      {/* ── Painel de filtros ── */}
      <div className="bg-white rounded-2xl border border-border/40 shadow-sm overflow-hidden">

        {/* Busca por cargo */}
        <div className="p-4 pb-3">
          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Cargo</label>
          <div className="relative" ref={buscaWrapRef}>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={buscaInput}
              onChange={(e) => setBuscaInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") aplicarBusca(); if (e.key === "Escape") setShowSugestoes(false); }}
              onFocus={() => sugestoes.length > 0 && setShowSugestoes(true)}
              placeholder="Ex: Recepcionista, Chef, Garçom..."
              className="w-full pl-10 pr-28 py-3 text-sm rounded-xl border border-border bg-[#f4f7f5] focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {buscaInput && (
                <button
                  onClick={limparBusca}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-border shadow-xl z-50 overflow-hidden">
                <p className="px-4 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Sugestões</p>
                {sugestoes.map((s) => (
                  <button
                    key={s}
                    onMouseDown={() => aplicarBusca(s)}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left hover:bg-primary/5 transition-colors border-t border-border/40"
                  >
                    <Search className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                    <span className="truncate text-foreground">{s}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Área + Contrato em linha */}
        <div className="px-4 py-3 border-t border-border/40 flex flex-wrap gap-x-6 gap-y-3">
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Área</label>
            <div className="flex flex-wrap gap-1.5">
              {SUPER_CATS.map((cat) => (
                <FilterChip
                  key={cat.value}
                  label={<><span>{cat.emoji}</span> {cat.label}</>}
                  active={superCategoria === cat.value}
                  onClick={() => toggleSuperCategoria(cat.value)}
                />
              ))}
            </div>
          </div>

          <div className="w-px bg-border self-stretch hidden sm:block" />

          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Contrato</label>
            <div className="flex flex-wrap gap-1.5">
              {TIPOS.map((t) => (
                <FilterChip key={t.value} label={t.label} active={tipo === t.value} onClick={() => toggleTipo(t.value)} />
              ))}
            </div>
          </div>
        </div>

        {/* Cidade + Perto de mim + Raio */}
        <div className="px-4 py-3 border-t border-border/40 space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Cidade</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={cidadeInput}
                  onChange={(e) => setCidadeInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && aplicarCidade()}
                  placeholder="Ex: São Paulo, Campinas..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-border bg-[#f4f7f5] focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                />
                {cidadeInput && (
                  <button onClick={limparCidade} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors">
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
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-primary/30 bg-primary/5 text-xs font-semibold text-primary hover:bg-primary/10 transition-all disabled:opacity-50 shrink-0"
              >
                {detectandoLocal ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                <span className="hidden sm:inline">Perto de mim</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Raio de busca</label>
            <div className="flex flex-wrap gap-1.5">
              {RAIOS.map((r) => (
                <FilterChip
                  key={r.value}
                  label={r.label}
                  active={raio === r.value}
                  onClick={() => { setRaio(r.value as "cidade" | "estado"); setPagina(1); }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Tags dos filtros ativos */}
        {filtroAtivo && (
          <div className="px-4 py-2.5 bg-primary/5 border-t border-border/40 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground">Ativos:</span>
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
            {usandoRaioEstado ? (
              <FilterTag label={`📍 Estado de ${ESTADOS.find((e) => e.value === estadoLocal)?.label ?? estadoLocal}`} onRemove={limparCidade} />
            ) : cidade ? (
              <FilterTag label={`📍 ${cidade}`} onRemove={limparCidade} />
            ) : null}
            <button
              onClick={() => { setSuperCategoria(""); setTipo(""); limparCidade(); limparBusca(); setRaio("cidade"); }}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
            >
              Limpar tudo
            </button>
          </div>
        )}
      </div>

      {/* Contagem de resultados */}
      {!loading && (
        <p className="text-sm text-muted-foreground">
          {total === 0
            ? "Nenhuma vaga encontrada"
            : <><span className="font-semibold text-foreground">{total}</span> vaga{total !== 1 ? "s" : ""} encontrada{total !== 1 ? "s" : ""}{filtroAtivo ? " com esses filtros" : ""}</>
          }
        </p>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
        </div>
      ) : vagas.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Briefcase className="h-7 w-7 text-primary/60" />
          </div>
          <h2 className="text-base font-semibold text-foreground mb-1">Nenhuma vaga encontrada</h2>
          <p className="text-sm text-muted-foreground">Tente ajustar ou remover algum filtro.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {vagas.map((vaga) => (
              <VagaCard key={vaga._id} vaga={vaga} />
            ))}
          </div>

          {paginas > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground disabled:opacity-40 hover:bg-primary/5 hover:border-primary/40 transition-colors"
              >
                ← Anterior
              </button>
              <span className="px-3 py-2 text-sm text-muted-foreground font-medium">
                {pagina} / {paginas}
              </span>
              <button
                onClick={() => setPagina((p) => Math.min(paginas, p + 1))}
                disabled={pagina === paginas}
                className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground disabled:opacity-40 hover:bg-primary/5 hover:border-primary/40 transition-colors"
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
