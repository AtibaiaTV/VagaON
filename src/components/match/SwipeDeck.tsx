"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Heart, Star, X } from "lucide-react";

export type Direcao = "like" | "pass" | "super";

/** Quanto o card já foi arrastado, normalizado: -1..1 na horizontal, 0..1 para cima. */
export interface EstadoArrasto {
  horizontal: number;
  vertical: number;
  arrastando: boolean;
}

interface Props<T> {
  itens: T[];
  chave: (item: T) => string;
  renderizar: (item: T, topo: boolean) => ReactNode;
  /** Chamado assim que o card sai — otimista; trate erros mostrando um aviso. */
  aoDecidir: (item: T, direcao: Direcao) => void | Promise<void>;
  /** Chamado quando restam poucos cards, para buscar mais. */
  aoFicarNoFim?: (restantes: number) => void;
  vazio: ReactNode;
  rotulos?: { like: string; pass: string; super: string };
  /** Desabilita gestos e botões (ex.: limite diário atingido). */
  travado?: boolean;
}

const LIMIAR_X = 110;
const LIMIAR_Y = 140;
const DURACAO_SAIDA = 320;
const DISTANCIA_SAIDA = 1400;
const PREFETCH_QUANDO_RESTAM = 4;

const ROTULOS_PADRAO = { like: "TENHO INTERESSE", pass: "PASSAR", super: "MUITO INTERESSE" };

function limitar(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Deck de swipe genérico: gestos por pointer events (mouse e toque), setas do
 * teclado e botões. Não sabe o que é uma vaga ou um profissional — só empilha,
 * arrasta, decide e avança.
 */
export default function SwipeDeck<T>({
  itens,
  chave,
  renderizar,
  aoDecidir,
  aoFicarNoFim,
  vazio,
  rotulos = ROTULOS_PADRAO,
  travado = false,
}: Props<T>) {
  const [indice, setIndice] = useState(0);
  const [arrasto, setArrasto] = useState({ dx: 0, dy: 0, ativo: false });
  const [saindo, setSaindo] = useState<Direcao | null>(null);

  const origem = useRef<{ x: number; y: number } | null>(null);
  const arrastoRef = useRef(arrasto);
  arrastoRef.current = arrasto;
  const ocupado = useRef(false);

  const atual = itens[indice];
  const restantes = Math.max(0, itens.length - indice);

  useEffect(() => {
    if (restantes <= PREFETCH_QUANDO_RESTAM) aoFicarNoFim?.(restantes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restantes]);

  const decidir = useCallback(
    async (direcao: Direcao) => {
      if (!atual || ocupado.current || travado) return;
      ocupado.current = true;
      setSaindo(direcao);

      // A chamada de rede corre junto com a animação — o card não espera a API.
      const promessa = Promise.resolve(aoDecidir(atual, direcao)).catch(() => undefined);
      await new Promise((r) => setTimeout(r, DURACAO_SAIDA));

      setIndice((i) => i + 1);
      setSaindo(null);
      setArrasto({ dx: 0, dy: 0, ativo: false });
      ocupado.current = false;
      await promessa;
    },
    [atual, aoDecidir, travado]
  );

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.key === "ArrowRight") decidir("like");
      else if (e.key === "ArrowLeft") decidir("pass");
      else if (e.key === "ArrowUp") decidir("super");
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [decidir]);

  function aoPressionar(e: React.PointerEvent<HTMLDivElement>) {
    if (saindo || !atual || travado) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    origem.current = { x: e.clientX, y: e.clientY };
    setArrasto({ dx: 0, dy: 0, ativo: true });
  }

  function aoMover(e: React.PointerEvent<HTMLDivElement>) {
    if (!origem.current || saindo) return;
    setArrasto({ dx: e.clientX - origem.current.x, dy: e.clientY - origem.current.y, ativo: true });
  }

  function aoSoltar() {
    if (!origem.current) return;
    origem.current = null;
    const { dx, dy } = arrastoRef.current;

    if (dx > LIMIAR_X) decidir("like");
    else if (dx < -LIMIAR_X) decidir("pass");
    else if (dy < -LIMIAR_Y && Math.abs(dx) < LIMIAR_X * 0.6) decidir("super");
    else setArrasto({ dx: 0, dy: 0, ativo: false });
  }

  // ─── Transformações do card do topo ────────────────────────────────────────
  const { dx, dy, ativo } = arrasto;
  let transform = `translate(${dx}px, ${dy}px) rotate(${dx / 18}deg)`;
  if (saindo === "like") transform = `translate(${DISTANCIA_SAIDA}px, ${dy}px) rotate(30deg)`;
  if (saindo === "pass") transform = `translate(-${DISTANCIA_SAIDA}px, ${dy}px) rotate(-30deg)`;
  if (saindo === "super") transform = `translate(${dx}px, -${DISTANCIA_SAIDA}px) rotate(0deg)`;

  const transition = saindo
    ? `transform ${DURACAO_SAIDA}ms ease-in`
    : ativo
      ? "none"
      : "transform 260ms cubic-bezier(.2,.8,.2,1)";

  const horizontal = saindo === "like" ? 1 : saindo === "pass" ? -1 : limitar(dx / LIMIAR_X, -1, 1);
  const vertical = saindo === "super" ? 1 : limitar(-dy / LIMIAR_Y, 0, 1);

  if (!atual) {
    return <div className="flex flex-col items-center justify-center min-h-[420px]">{vazio}</div>;
  }

  const proximos = itens.slice(indice + 1, indice + 3);

  return (
    <div className="w-full">
      <div className="relative w-full h-[calc(100dvh-270px)] min-h-[460px] max-h-[660px]">
        {/* Cards de trás, do mais fundo para o mais próximo. */}
        {proximos
          .map((item, i) => ({ item, profundidade: i + 1 }))
          .reverse()
          .map(({ item, profundidade }) => (
            <div
              key={chave(item)}
              className="absolute inset-0 pointer-events-none"
              style={{
                transform: `scale(${1 - profundidade * 0.04}) translateY(${profundidade * 14}px)`,
                zIndex: 10 - profundidade,
                transition: "transform 260ms ease",
              }}
            >
              {renderizar(item, false)}
            </div>
          ))}

        {/* Card do topo — o único que recebe gestos. */}
        <div
          key={chave(atual)}
          className="absolute inset-0 touch-none select-none cursor-grab active:cursor-grabbing"
          style={{ transform, transition, zIndex: 20 }}
          onPointerDown={aoPressionar}
          onPointerMove={aoMover}
          onPointerUp={aoSoltar}
          onPointerCancel={aoSoltar}
        >
          {renderizar(atual, true)}

          {/* Carimbos */}
          <Carimbo texto={rotulos.like} cor="#2DB87A" opacidade={Math.max(0, horizontal)} lado="esquerda" />
          <Carimbo texto={rotulos.pass} cor="#ef4444" opacidade={Math.max(0, -horizontal)} lado="direita" />
          <Carimbo texto={rotulos.super} cor="#3b82f6" opacidade={vertical} lado="baixo" />
        </div>
      </div>

      {/* Botões */}
      <div className="flex items-center justify-center gap-5 mt-5">
        <BotaoDeck
          rotulo={rotulos.pass}
          onClick={() => decidir("pass")}
          desabilitado={travado}
          className="border-red-200 text-red-500 hover:bg-red-50"
          tamanho="md"
        >
          <X className="h-7 w-7" strokeWidth={2.5} />
        </BotaoDeck>
        <BotaoDeck
          rotulo={rotulos.super}
          onClick={() => decidir("super")}
          desabilitado={travado}
          className="border-blue-200 text-blue-500 hover:bg-blue-50"
          tamanho="sm"
        >
          <Star className="h-5 w-5" strokeWidth={2.5} />
        </BotaoDeck>
        <BotaoDeck
          rotulo={rotulos.like}
          onClick={() => decidir("like")}
          desabilitado={travado}
          className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
          tamanho="md"
        >
          <Heart className="h-7 w-7" strokeWidth={2.5} />
        </BotaoDeck>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-3 hidden sm:block">
        Arraste o card ou use as setas ← → ↑
      </p>
    </div>
  );
}

function Carimbo({
  texto,
  cor,
  opacidade,
  lado,
}: {
  texto: string;
  cor: string;
  opacidade: number;
  lado: "esquerda" | "direita" | "baixo";
}) {
  const posicao =
    lado === "esquerda"
      ? "top-6 left-6 -rotate-12"
      : lado === "direita"
        ? "top-6 right-6 rotate-12"
        : "bottom-24 left-1/2 -translate-x-1/2";
  return (
    <div
      className={`absolute ${posicao} px-3 py-1 rounded-lg border-4 font-black text-xl tracking-wider uppercase pointer-events-none`}
      style={{ color: cor, borderColor: cor, opacity: opacidade, backgroundColor: "rgba(255,255,255,0.85)" }}
    >
      {texto}
    </div>
  );
}

function BotaoDeck({
  children,
  rotulo,
  onClick,
  desabilitado,
  className,
  tamanho,
}: {
  children: ReactNode;
  rotulo: string;
  onClick: () => void;
  desabilitado: boolean;
  className: string;
  tamanho: "sm" | "md";
}) {
  const dim = tamanho === "md" ? "w-16 h-16" : "w-12 h-12";
  return (
    <button
      type="button"
      aria-label={rotulo}
      title={rotulo}
      onClick={onClick}
      disabled={desabilitado}
      className={`${dim} rounded-full bg-white border-2 shadow-md flex items-center justify-center transition-transform active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}
