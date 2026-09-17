import { Star } from "lucide-react";

/** Cinco estrelas preenchidas conforme a nota (aceita meia: 4,5). */
export default function Estrelas({ nota, tamanho = 16 }: { nota: number; tamanho?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${nota} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const cheia = nota >= i;
        const meia = !cheia && nota >= i - 0.5;
        return (
          <span key={i} className="relative inline-block" style={{ width: tamanho, height: tamanho }}>
            <Star className="absolute inset-0 text-gray-300" style={{ width: tamanho, height: tamanho }} />
            {(cheia || meia) && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: cheia ? "100%" : "50%" }}>
                <Star className="fill-amber-400 text-amber-400" style={{ width: tamanho, height: tamanho }} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
