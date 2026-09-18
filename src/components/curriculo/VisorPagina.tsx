"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** 210 mm a 96 dpi — largura real da página; na tela é reduzida para caber. */
export const LARGURA_PX = 794;
export const ALTURA_PX = 1123;

/**
 * Mostra a página do currículo em tamanho real, reduzida por transform para
 * caber no container. Em impressão o CSS global remove a redução.
 */
export default function VisorPagina({ children, chave }: { children: ReactNode; chave?: string }) {
  const [escala, setEscala] = useState(1);
  const [altura, setAltura] = useState(ALTURA_PX);
  const visor = useRef<HTMLDivElement>(null);
  const pagina = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = visor.current;
    const pg = pagina.current;
    if (!el || !pg) return;
    const medir = () => {
      const e = Math.min(1, el.clientWidth / LARGURA_PX);
      setEscala(e);
      setAltura(Math.ceil(pg.offsetHeight * e));
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    ro.observe(pg);
    return () => ro.disconnect();
  }, [chave]);

  return (
    <div ref={visor} className="cv-visor overflow-hidden" style={{ height: altura }}>
      <div
        ref={pagina}
        className="cv-escalado shadow-xl"
        style={{ width: LARGURA_PX, transform: `scale(${escala})`, transformOrigin: "top left" }}
      >
        {children}
      </div>
    </div>
  );
}
