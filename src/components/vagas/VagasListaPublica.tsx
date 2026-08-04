"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ESPECIALIDADES } from "@/constants/especialidades";
import { MapPin, Loader2, Navigation, Search, Briefcase } from "lucide-react";

const TIPO_LABEL: Record<string, string> = {
  clt: "CLT",
  temporario: "Temporário",
  sazonal: "Sazonal",
};
const TIPO_COR: Record<string, string> = {
  clt: "bg-blue-100 text-blue-700",
  temporario: "bg-orange-100 text-orange-700",
  sazonal: "bg-purple-100 text-purple-700",
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

function formatarSalario(salario: VagaCard["salario"]) {
  if (salario?.tipo === "a_combinar") return "A combinar";
  const pl: Record<string, string> = { hora: "/h", dia: "/dia", mes: "/mês" };
  if (salario?.tipo === "fixo") return `R$ ${salario.max?.toLocaleString("pt-BR")}${pl[salario.periodo]}`;
  if (salario?.min && salario?.max)
    return `R$ ${salario.min.toLocaleString("pt-BR")} – ${salario.max.toLocaleString("pt-BR")}${pl[salario.periodo]}`;
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
  const [vagas, setVagas] = useState<VagaCard[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [paginas, setPaginas] = useState(1);
  const [loading, setLoading] = useState(true);
  const [detectandoLocal, setDetectandoLocal] = useState(false);

  const fetchVagas = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (superCategoria) params.set("superCategoria", superCategoria);
    if (tipo) params.set("tipo", tipo);
    if (cidade) params.set("cidade", cidade);
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
  }, [superCategoria, tipo, cidade, pagina]);

  useEffect(() => {
    fetchVagas();
  }, [fetchVagas]);

  function toggleSuperCategoria(v: string) {
    setSuperCategoria((prev) => (prev === v ? "" : v));
    setPagina(1);
  }
  function toggleTipo(v: string) {
    setTipo((prev) => (prev === v ? "" : v));
    setPagina(1);
  }
  function aplicarCidade() {
    setCidade(cidadeInput.trim());
    setPagina(1);
  }
  function limparCidade() {
    setCidadeInput("");
    setCidade("");
    setPagina(1);
  }

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
      const nomeCidade =
        data.address?.city ||
        data.address?.town ||
        data.address?.municipality ||
        data.address?.village ||
        "";
      if (nomeCidade) {
        setCidadeInput(nomeCidade);
        setCidade(nomeCidade);
        setPagina(1);
      }
    } catch {
      // geolocation denied or Nominatim error — silently ignore
    } finally {
      setDetectandoLocal(false);
    }
  }

  const filtroAtivo = superCategoria || tipo || cidade;

  return (
    <div className="space-y-6">
      {/* Barra de filtros */}
      <div className="bg-white rounded-xl border border-border/60 p-4 space-y-4 shadow-sm">

        {/* Categoria */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Área</p>
          <div className="flex flex-wrap gap-2">
            {SUPER_CATS.map((cat) => (
              <button
                key={cat.value}
                onClick={() => toggleSuperCategoria(cat.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  superCategoria === cat.value
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-foreground border-border hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tipo de contrato */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Contrato</p>
          <div className="flex flex-wrap gap-2">
            {TIPOS.map((t) => (
              <button
                key={t.value}
                onClick={() => toggleTipo(t.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  tipo === t.value
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-foreground border-border hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cidade + Perto de mim */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Cidade</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                value={cidadeInput}
                onChange={(e) => setCidadeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && aplicarCidade()}
                placeholder="Buscar por cidade..."
                className="pl-8 pr-8"
              />
              {cidadeInput && (
                <button
                  onClick={limparCidade}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-lg leading-none"
                >
                  ×
                </button>
              )}
            </div>
            <button
              onClick={aplicarCidade}
              disabled={!cidadeInput}
              className="px-3 py-2 rounded-md bg-primary text-white text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              Buscar
            </button>
            <button
              onClick={usarLocalizacao}
              disabled={detectandoLocal}
              title="Usar minha localização"
              className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-sm font-medium hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:opacity-50"
            >
              {detectandoLocal ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Perto de mim</span>
            </button>
          </div>
        </div>

        {/* Tags de filtros ativos */}
        {filtroAtivo && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50">
            <span className="text-xs text-muted-foreground">Filtros:</span>
            {superCategoria && (
              <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
                {SUPER_CATS.find((c) => c.value === superCategoria)?.label}
                <button onClick={() => { setSuperCategoria(""); setPagina(1); }} className="hover:opacity-70">×</button>
              </span>
            )}
            {tipo && (
              <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
                {TIPO_LABEL[tipo]}
                <button onClick={() => { setTipo(""); setPagina(1); }} className="hover:opacity-70">×</button>
              </span>
            )}
            {cidade && (
              <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
                📍 {cidade}
                <button onClick={limparCidade} className="hover:opacity-70">×</button>
              </span>
            )}
            <button
              onClick={() => { setSuperCategoria(""); setTipo(""); limparCidade(); }}
              className="text-xs text-muted-foreground hover:text-foreground underline ml-auto"
            >
              Limpar tudo
            </button>
          </div>
        )}
      </div>

      {/* Contagem */}
      {!loading && (
        <p className="text-sm text-muted-foreground">
          {total === 0
            ? "Nenhuma vaga encontrada"
            : `${total} vaga${total !== 1 ? "s" : ""} encontrada${total !== 1 ? "s" : ""}`}
        </p>
      )}

      {/* Lista de vagas */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : vagas.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-1">Nenhuma vaga encontrada</h2>
          <p className="text-sm text-muted-foreground">Tente ajustar os filtros acima.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {vagas.map((vaga) => (
              <Link key={vaga._id} href={`/vagas/${vaga._id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-semibold leading-tight">{vaga.titulo}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${TIPO_COR[vaga.tipo] ?? ""}`}>
                        {TIPO_LABEL[vaga.tipo] ?? vaga.tipo}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {vaga.empresaId?.nomeFantasia}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="secondary" className="text-xs">
                        {ESPECIALIDADES.find((e) => e.value === vaga.especialidade)?.label ?? vaga.especialidade}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {vaga.cidade}, {vaga.estado}
                      </span>
                      <span>{formatarSalario(vaga.salario)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Paginação */}
          {paginas > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Anterior
              </button>
              <span className="px-3 py-1.5 text-sm text-muted-foreground">
                {pagina} / {paginas}
              </span>
              <button
                onClick={() => setPagina((p) => Math.min(paginas, p + 1))}
                disabled={pagina === paginas}
                className="px-3 py-1.5 rounded-md border text-sm disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
