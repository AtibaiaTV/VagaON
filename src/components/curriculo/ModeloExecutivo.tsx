import type { ReactNode } from "react";
import type { DadosCurriculo } from "@/lib/curriculo";
import { Descricao, FotoCV } from "./comum";

const ESCURO = "#2c3e50";
const DESTAQUE = "#1abc9c";
const CINZA = "#7f8c8d";

function SecaoLateral({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-[9mm] break-inside-avoid">
      <p className="text-[11pt] font-bold text-white tracking-wide">{titulo}</p>
      <div className="h-[2px] mt-[1.5mm] mb-[3mm]" style={{ backgroundColor: DESTAQUE }} />
      <div className="text-[9.5pt] leading-relaxed space-y-[1.5mm]" style={{ color: "#bdc3c7" }}>
        {children}
      </div>
    </section>
  );
}

function SecaoPrincipal({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-[9mm]">
      <p className="text-[11.5pt] font-bold tracking-wide" style={{ color: ESCURO }}>
        {titulo}
      </p>
      <div className="h-px mt-[1.5mm] mb-[4mm]" style={{ backgroundColor: ESCURO }} />
      {children}
    </section>
  );
}

/** Modelo 1 — Moderno Executivo: duas colunas, lateral escura, foto redonda. */
export default function ModeloExecutivo({ d }: { d: DadosCurriculo }) {
  return (
    <article className="cv-pagina grid grid-cols-[68mm_1fr]" style={{ color: ESCURO }}>
      {/* Em impressão, mantém a lateral escura em todas as páginas. */}
      <div className="cv-fundo-fixo" style={{ backgroundColor: ESCURO, width: "68mm" }} />

      <aside className="px-[8mm] pt-[14mm] pb-[12mm] text-white" style={{ backgroundColor: ESCURO }}>
        <div className="flex justify-center">
          <FotoCV src={d.foto} iniciais={d.iniciais} forma="redonda" tamanho="34mm" fundo="#34495e" cor="#fff" borda="3px solid #fff" />
        </div>

        <SecaoLateral titulo="CONTATO">
          {d.telefone && <p>{d.telefone}</p>}
          {d.email && <p className="break-all">{d.email}</p>}
          {d.local && <p>{d.local}</p>}
          {d.linkedin && <p className="break-all">{d.linkedin}</p>}
        </SecaoLateral>

        {d.habilidades.length > 0 && (
          <SecaoLateral titulo="COMPETÊNCIAS">
            {d.habilidades.map((h) => (
              <p key={h}>• {h}</p>
            ))}
          </SecaoLateral>
        )}

        {d.idiomas.length > 0 && (
          <SecaoLateral titulo="IDIOMAS">
            {d.idiomas.map((i) => (
              <p key={i}>• {i}</p>
            ))}
          </SecaoLateral>
        )}

        {d.disponibilidade && (
          <SecaoLateral titulo="DISPONIBILIDADE">
            <p>{d.disponibilidade}</p>
          </SecaoLateral>
        )}
      </aside>

      <main className="px-[10mm] pt-[16mm] pb-[14mm]">
        <h1 className="text-[24pt] font-bold uppercase leading-[1.1] tracking-tight">{d.nome}</h1>
        {d.titulo && (
          <p className="text-[13.5pt] font-bold mt-[2mm]" style={{ color: DESTAQUE }}>
            {d.titulo}
          </p>
        )}

        {d.resumo && (
          <SecaoPrincipal titulo="PERFIL PROFISSIONAL">
            <p className="text-[10.5pt] leading-relaxed whitespace-pre-line" style={{ color: CINZA }}>
              {d.resumo}
            </p>
          </SecaoPrincipal>
        )}

        {d.experiencias.length > 0 && (
          <SecaoPrincipal titulo="EXPERIÊNCIA PROFISSIONAL">
            <div className="space-y-[5mm]">
              {d.experiencias.map((e, i) => (
                <div key={i} className="break-inside-avoid">
                  <p className="text-[11.5pt] font-bold leading-snug">
                    {[e.empresa, e.cargo].filter(Boolean).join(" | ")}
                  </p>
                  <p className="text-[10pt] mt-[0.5mm]" style={{ color: DESTAQUE }}>
                    {e.periodo}
                    {e.local && ` · ${e.local}`}
                  </p>
                  <Descricao texto={e.descricao} className="text-[10.5pt] leading-relaxed mt-[1.5mm]" />
                </div>
              ))}
            </div>
          </SecaoPrincipal>
        )}

        {d.formacao.length > 0 && (
          <SecaoPrincipal titulo="FORMAÇÃO ACADÊMICA">
            <div className="space-y-[3.5mm]">
              {d.formacao.map((f, i) => (
                <div key={i} className="break-inside-avoid">
                  <p className="text-[11.5pt] font-bold leading-snug">{f.curso}</p>
                  {(f.instituicao || f.ano) && (
                    <p className="text-[10.5pt]" style={{ color: CINZA }}>
                      {[f.instituicao, f.ano].filter(Boolean).join(" | ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SecaoPrincipal>
        )}
      </main>
    </article>
  );
}
