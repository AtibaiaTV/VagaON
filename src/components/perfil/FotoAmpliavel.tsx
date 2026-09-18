"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface Props {
  src: string | null;
  nome: string;
  /** Classe do círculo (tamanho, borda). */
  className?: string;
  /** Tamanho da inicial quando não há foto. */
  classeInicial?: string;
}

/**
 * Foto de perfil que abre em tamanho grande ao clicar. Sem foto, mostra a
 * inicial e não abre nada. Fecha com Esc, clique fora ou no X.
 */
export default function FotoAmpliavel({ src, nome, className = "w-28 h-28", classeInicial = "text-4xl" }: Props) {
  const [aberta, setAberta] = useState(false);

  useEffect(() => {
    if (!aberta) return;
    const fechar = (e: KeyboardEvent) => e.key === "Escape" && setAberta(false);
    window.addEventListener("keydown", fechar);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", fechar);
      document.body.style.overflow = "";
    };
  }, [aberta]);

  if (!src) {
    return (
      <div className={`${className} rounded-full bg-white/20 flex items-center justify-center shrink-0 border-2 border-white/20`}>
        <span className={`${classeInicial} font-bold text-white`}>{nome.charAt(0).toUpperCase()}</span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberta(true)}
        className={`${className} rounded-full overflow-hidden shrink-0 border-2 border-white/30 hover:border-white/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white transition-colors`}
        title="Ver a foto em tamanho grande"
        aria-label={`Ampliar a foto de ${nome}`}
      >
        <img src={src} alt={nome} className="w-full h-full object-cover" />
      </button>

      {aberta && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Foto de ${nome}`}
          onClick={() => setAberta(false)}
          className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <button
            type="button"
            onClick={() => setAberta(false)}
            className="absolute top-4 right-4 rounded-full bg-white/10 hover:bg-white/25 p-2 text-white"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={src}
            alt={nome}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain cursor-default"
          />
          <p className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-sm">{nome}</p>
        </div>
      )}
    </>
  );
}
