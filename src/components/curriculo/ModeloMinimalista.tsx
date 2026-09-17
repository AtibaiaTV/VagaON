import type { ReactNode } from "react";
import { Link2, Mail, MapPin, Phone } from "lucide-react";
import type { DadosCurriculo } from "@/lib/curriculo";
import { Descricao, FotoCV } from "./comum";

const TINTA = "#2f3542";
const SUAVE = "#57606f";
const CLARO = "#a4b0be";
const LINHA = "#ced6e0";
const FAIXA = "#eaeff2";

function Secao({ titulo, semLinha = false, children }: { titulo: string; semLinha?: boolean; children: ReactNode }) {
  return (
    <section className="mt-[8mm]">
      <p className="text-[13pt] font-bold tracking-wide" style={{ color: TINTA }}>
        {titulo}
      </p>
      {!semLinha && <div className="h-px mt-[1.5mm]" style={{ backgroundColor: LINHA }} />}
      <div className="mt-[3.5mm]">{children}</div>
    </section>
  );
}

/** Modelo 2 — Minimalista Contemporâneo: cabeçalho suave, foto quadrada, uma coluna. */
export default function ModeloMinimalista({ d }: { d: DadosCurriculo }) {
  const contatos = [
    d.telefone && { icone: <Phone className="inline h-[3.5mm] w-[3.5mm]" />, texto: d.telefone },
    d.email && { icone: <Mail className="inline h-[3.5mm] w-[3.5mm]" />, texto: d.email },
    d.local && { icone: <MapPin className="inline h-[3.5mm] w-[3.5mm]" />, texto: d.local },
    d.linkedin && { icone: <Link2 className="inline h-[3.5mm] w-[3.5mm]" />, texto: d.linkedin },
  ].filter(Boolean) as { icone: ReactNode; texto: string }[];

  return (
    <article className="cv-pagina" style={{ color: TINTA }}>
      <header className="px-[13mm] py-[9mm] flex items-center gap-[8mm]" style={{ backgroundColor: FAIXA }}>
        <FotoCV src={d.foto} iniciais={d.iniciais} forma="quadrada" tamanho="30mm" raio="3mm" fundo="#ced6e0" cor={SUAVE} />
        <div className="min-w-0">
          <h1 className="text-[26pt] font-bold uppercase leading-[1.1] tracking-tight">{d.nome}</h1>
          {d.titulo && (
            <p className="text-[13.5pt] font-bold mt-[2mm]" style={{ color: SUAVE }}>
              {d.titulo}
            </p>
          )}
        </div>
      </header>

      <main className="px-[13mm] pb-[14mm]">
        {contatos.length > 0 && (
          <>
            <p className="mt-[7mm] text-[10pt] flex flex-wrap items-center gap-y-[1mm]" style={{ color: SUAVE }}>
              {contatos.map((c, i) => (
                <span key={i} className="inline-flex items-center gap-[1.5mm]">
                  {i > 0 && <span className="mx-[3mm]" style={{ color: LINHA }}>|</span>}
                  {c.icone}
                  {c.texto}
                </span>
              ))}
            </p>
            <div className="h-px mt-[3mm]" style={{ backgroundColor: LINHA }} />
          </>
        )}

        {d.resumo && (
          <Secao titulo="SOBRE MIM" semLinha>
            <p className="text-[10.5pt] leading-relaxed whitespace-pre-line" style={{ color: SUAVE }}>
              {d.resumo}
            </p>
          </Secao>
        )}

        {d.experiencias.length > 0 && (
          <Secao titulo="EXPERIÊNCIA PROFISSIONAL">
            <div className="space-y-[5mm]">
              {d.experiencias.map((e, i) => (
                <div key={i} className="break-inside-avoid">
                  <p className="text-[12pt] font-bold leading-snug">{[e.cargo, e.empresa].filter(Boolean).join(" — ")}</p>
                  <p className="text-[10pt] mt-[0.5mm]" style={{ color: CLARO }}>
                    {e.periodo}
                    {e.local && ` · ${e.local}`}
                  </p>
                  <Descricao texto={e.descricao} className="text-[10.5pt] leading-relaxed mt-[1.5mm]" />
                </div>
              ))}
            </div>
          </Secao>
        )}

        {d.formacao.length > 0 && (
          <Secao titulo="EDUCAÇÃO">
            <div className="space-y-[3.5mm]">
              {d.formacao.map((f, i) => (
                <div key={i} className="break-inside-avoid">
                  <p className="text-[11.5pt] font-bold leading-snug">{f.curso}</p>
                  {(f.instituicao || f.ano) && (
                    <p className="text-[10.5pt]" style={{ color: SUAVE }}>
                      {f.instituicao}
                      {f.ano && (f.instituicao ? ` (concluído em ${f.ano})` : `Concluído em ${f.ano}`)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Secao>
        )}

        {d.habilidades.length > 0 && (
          <Secao titulo="COMPETÊNCIAS">
            <div className="flex flex-wrap gap-[2mm]">
              {d.habilidades.map((h) => (
                <span key={h} className="text-[10pt] px-[3mm] py-[1mm] rounded-[2mm]" style={{ backgroundColor: FAIXA, color: TINTA }}>
                  {h}
                </span>
              ))}
            </div>
          </Secao>
        )}

        {(d.idiomas.length > 0 || d.disponibilidade) && (
          <Secao titulo="MAIS INFORMAÇÕES">
            <div className="text-[10.5pt] leading-relaxed space-y-[1mm]" style={{ color: SUAVE }}>
              {d.idiomas.length > 0 && (
                <p>
                  <span className="font-bold" style={{ color: TINTA }}>Idiomas:</span> {d.idiomas.join(" · ")}
                </p>
              )}
              {d.disponibilidade && (
                <p>
                  <span className="font-bold" style={{ color: TINTA }}>Disponibilidade:</span> {d.disponibilidade}
                </p>
              )}
            </div>
          </Secao>
        )}
      </main>
    </article>
  );
}
