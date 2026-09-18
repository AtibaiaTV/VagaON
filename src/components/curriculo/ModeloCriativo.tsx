import type { ReactNode } from "react";
import { COR_PADRAO, coresCriativo, type DadosCurriculo } from "@/lib/curriculo";
import { Descricao, FotoCV } from "./comum";

/** Texto: fixo, independente da cor de detalhe. */
const PRETO = "#111111";
const TEXTO = "#333333";

function SecaoNum({
  n,
  titulo,
  cor,
  linha,
  destaque = false,
  children,
}: {
  n: string;
  titulo: string;
  cor: string;
  linha: string;
  destaque?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="mt-[9mm]">
      <p className="text-[11.5pt] font-bold tracking-wide" style={{ color: cor }}>
        {n} / {titulo}
      </p>
      <div className={destaque ? "h-[2px]" : "h-px"} style={{ backgroundColor: destaque ? cor : linha, marginTop: "1.5mm", marginBottom: "4mm" }} />
      {children}
    </section>
  );
}

function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <p className="text-[10.5pt] leading-relaxed">
      <span className="font-bold" style={{ color: PRETO }}>
        {rotulo}:
      </span>{" "}
      <span style={{ color: TEXTO }}>{children}</span>
    </p>
  );
}

/** Modelo 3 — Criativo: barra lateral colorida, seções numeradas, foto redonda no canto. */
export default function ModeloCriativo({ d, cor = COR_PADRAO.criativo }: { d: DadosCurriculo; cor?: string }) {
  const { destaque: AZUL, linha: LINHA } = coresCriativo(cor);
  // Numera só as seções que existem, para não ficar "01, 03".
  const secoes = [
    d.resumo ? "perfil" : null,
    d.experiencias.length ? "experiencia" : null,
    d.formacao.length ? "formacao" : null,
    "skills",
  ].filter(Boolean) as string[];
  const numero = (s: string) => String(secoes.indexOf(s) + 1).padStart(2, "0");

  const contato = [d.telefone && `Telefone: ${d.telefone}`, d.email && `E-mail: ${d.email}`, d.nascimento && `Nascimento: ${d.nascimento}`, d.linkedin, d.local].filter(Boolean).join("  |  ");

  return (
    <article className="cv-pagina relative" style={{ color: TEXTO }}>
      <div className="absolute left-0 top-0 bottom-0 w-[4mm]" style={{ backgroundColor: AZUL }} />
      <div className="cv-fundo-fixo" style={{ backgroundColor: AZUL, width: "4mm" }} />

      <div className="pl-[16mm] pr-[13mm] pt-[13mm] pb-[14mm]">
        <header className="flex items-start justify-between gap-[8mm]">
          <div className="min-w-0 pt-[2mm]">
            <h1 className="text-[27pt] font-bold uppercase leading-[1.1] tracking-tight" style={{ color: PRETO }}>
              {d.nome}
            </h1>
            {d.titulo && (
              <p className="text-[15pt] font-medium mt-[2mm]" style={{ color: AZUL }}>
                {d.titulo}
              </p>
            )}
          </div>
          <FotoCV src={d.foto} iniciais={d.iniciais} forma="redonda" tamanho="27mm" fundo={LINHA} cor={AZUL} />
        </header>

        {d.resumo && (
          <SecaoNum n={numero("perfil")} titulo="PERFIL" cor={AZUL} linha={LINHA} destaque>
            <p className="text-[10.5pt] leading-relaxed whitespace-pre-line">{d.resumo}</p>
          </SecaoNum>
        )}

        {d.experiencias.length > 0 && (
          <SecaoNum n={numero("experiencia")} titulo="EXPERIÊNCIA" cor={AZUL} linha={LINHA}>
            <div className="space-y-[5mm]">
              {d.experiencias.map((e, i) => (
                <div key={i} className="break-inside-avoid">
                  <p className="text-[12pt] font-bold leading-snug" style={{ color: PRETO }}>
                    {e.empresa || e.cargo}
                  </p>
                  <p className="text-[10pt] mt-[0.5mm]" style={{ color: AZUL }}>
                    Período: {e.periodo}
                    {e.empresa && e.cargo && ` | ${e.cargo}`}
                    {e.local && ` | ${e.local}`}
                  </p>
                  <Descricao texto={e.descricao} className="text-[10.5pt] leading-relaxed mt-[1.5mm]" />
                </div>
              ))}
            </div>
          </SecaoNum>
        )}

        {d.formacao.length > 0 && (
          <SecaoNum n={numero("formacao")} titulo="FORMAÇÃO" cor={AZUL} linha={LINHA}>
            <div className="space-y-[3.5mm]">
              {d.formacao.map((f, i) => (
                <div key={i} className="break-inside-avoid">
                  <p className="text-[11.5pt] font-bold leading-snug" style={{ color: PRETO }}>
                    {f.curso}
                  </p>
                  {(f.instituicao || f.ano) && (
                    <p className="text-[10.5pt]" style={{ color: AZUL }}>
                      {[f.instituicao, f.ano].filter(Boolean).join(" | ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SecaoNum>
        )}

        <SecaoNum n={numero("skills")} titulo="SKILLS & CONTATO" cor={AZUL} linha={LINHA}>
          <div className="space-y-[2mm]">
            {d.especialidades.length > 0 && <Linha rotulo="Funções">{d.especialidades.join(", ")}</Linha>}
            {d.habilidades.length > 0 && <Linha rotulo="Habilidades">{d.habilidades.join(", ")}</Linha>}
            {d.idiomas.length > 0 && <Linha rotulo="Idiomas">{d.idiomas.join(", ")}</Linha>}
            {d.disponibilidade && <Linha rotulo="Disponibilidade">{d.disponibilidade}</Linha>}
            {contato && <Linha rotulo="Contato">{contato}</Linha>}
          </div>
        </SecaoNum>
      </div>
    </article>
  );
}
