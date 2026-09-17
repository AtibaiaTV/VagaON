"use client";

import { MAX_RESPOSTA_CHARS } from "@/lib/triagem";

interface Props {
  perguntas: string[];
  respostas: string[];
  onChange: (respostas: string[]) => void;
  /** Prefixo dos ids, para não colidir quando há dois formulários na página. */
  idPrefixo?: string;
  compacto?: boolean;
}

/** Lista de perguntas da vaga com um campo de resposta para cada. */
export default function PerguntasTriagem({ perguntas, respostas, onChange, idPrefixo = "triagem", compacto = false }: Props) {
  if (!perguntas.length) return null;

  function atualizar(i: number, valor: string) {
    const nova = perguntas.map((_, j) => respostas[j] ?? "");
    nova[i] = valor;
    onChange(nova);
  }

  return (
    <div className={compacto ? "space-y-3" : "space-y-4"}>
      {perguntas.map((p, i) => (
        <div key={i} className="space-y-1">
          <label htmlFor={`${idPrefixo}-${i}`} className="text-sm font-medium leading-snug block">
            <span className="text-primary font-bold mr-1">{i + 1}.</span>
            {p}
          </label>
          <textarea
            id={`${idPrefixo}-${i}`}
            value={respostas[i] ?? ""}
            onChange={(e) => atualizar(i, e.target.value)}
            rows={compacto ? 2 : 3}
            maxLength={MAX_RESPOSTA_CHARS}
            placeholder="Sua resposta"
            className="w-full text-sm rounded-lg border border-input bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      ))}
    </div>
  );
}
