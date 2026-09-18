import type { CSSProperties } from "react";

/** Foto do perfil ou iniciais, no formato que cada modelo pede. */
export function FotoCV({
  src,
  iniciais,
  forma,
  tamanho,
  fundo,
  cor,
  borda,
  raio = "3mm",
}: {
  src: string | null;
  iniciais: string;
  forma: "redonda" | "quadrada";
  tamanho: string;
  fundo: string;
  cor: string;
  borda?: string;
  raio?: string;
}) {
  const estilo: CSSProperties = {
    width: tamanho,
    height: tamanho,
    borderRadius: forma === "redonda" ? "50%" : raio,
    backgroundColor: fundo,
    color: cor,
    border: borda,
    flexShrink: 0,
    overflow: "hidden",
  };
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" style={{ ...estilo, objectFit: "cover" }} />;
  }
  return (
    <div style={{ ...estilo, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14pt" }}>
      {iniciais}
    </div>
  );
}

/**
 * Descrição de experiência: cada linha vira um item com marcador, a menos que
 * a pessoa já tenha digitado o marcador.
 */
export function Descricao({ texto, className }: { texto: string; className?: string }) {
  const linhas = texto
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!linhas.length) return null;
  return (
    <div className={className}>
      {linhas.map((l, i) => (
        <p key={i} style={{ paddingLeft: "3.5mm", textIndent: "-3.5mm" }}>
          {/^[•\-–*]/.test(l) ? l : `• ${l}`}
        </p>
      ))}
    </div>
  );
}
