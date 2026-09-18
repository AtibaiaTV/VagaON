import { normalizarOrigem } from "@/lib/servicos/cadastro-rapido";
import { DESTINOS_QR, ehDestinoQr, gerarQrSvg, urlDestino, type DestinoQr } from "@/lib/qr";
import BotaoImprimir from "./BotaoImprimir";

export const dynamic = "force-dynamic";

const TEXTOS: Record<DestinoQr, { titulo: string; subtitulo: string; passos: string[] }> = {
  comecar: {
    titulo: "Trabalho em gastronomia, hotelaria e eventos",
    subtitulo: "Profissionais e empresas se encontram aqui. Grátis.",
    passos: ["Aponte a câmera do celular para o código", "Diga se é profissional ou empresa", "Cadastro pronto em 1 minuto"],
  },
  curriculo: {
    titulo: "Procurando trabalho?",
    subtitulo: "Garçom, cozinheiro, bartender, camareira, recepção e mais. Vagas da sua região no celular.",
    passos: ["Aponte a câmera do celular para o código", "Cadastre seu currículo em 1 minuto", "Receba vagas que combinam com você"],
  },
  anunciar: {
    titulo: "Precisa de gente para o seu negócio?",
    subtitulo: "Restaurante, bar, hotel, buffet ou evento: publique a vaga grátis e receba candidatos da região.",
    passos: ["Aponte a câmera do celular para o código", "Descreva a vaga como falaria com alguém", "A vaga entra no ar na hora"],
  },
};

/** Cartaz A4 pronto para imprimir (o admin abre, confere e manda imprimir). */
export default async function CartazQrPage({ searchParams }: { searchParams: { destino?: string; origem?: string } }) {
  const destino: DestinoQr = ehDestinoQr(searchParams.destino) ? searchParams.destino : "comecar";
  const origem = normalizarOrigem(searchParams.origem);
  const url = urlDestino(destino, origem);
  const svg = await gerarQrSvg(url, { selo: true, tamanho: 640 });
  const t = TEXTOS[destino];
  const linkCurto = url.replace(/^https?:\/\//, "").replace(/\?.*$/, "");

  return (
    <div className="min-h-screen bg-[#e9edeb]">
      <div className="nao-imprimir max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Cartaz · {DESTINOS_QR[destino].rotulo} {origem && <span className="font-mono">({origem})</span>} · A4 retrato
        </p>
        <BotaoImprimir />
      </div>

      <div className="cv-pagina shadow-xl flex flex-col items-center text-center px-[18mm] pt-[22mm] pb-[16mm]" style={{ backgroundColor: "#fff" }}>
        <div className="w-full rounded-[6mm] px-[10mm] py-[8mm] text-white" style={{ backgroundColor: "#1a5c38" }}>
          <p className="text-[28pt] font-bold leading-[1.1]">{t.titulo}</p>
          <p className="text-[13pt] mt-[4mm] opacity-90">{t.subtitulo}</p>
        </div>

        <div className="mt-[12mm] w-[105mm] h-[105mm]" dangerouslySetInnerHTML={{ __html: svg.replace(/width="\d+" height="\d+"/, 'width="100%" height="100%"') }} />

        <ol className="mt-[10mm] text-left space-y-[3mm] text-[13pt]">
          {t.passos.map((p, i) => (
            <li key={i} className="flex items-center gap-[4mm]">
              <span className="w-[9mm] h-[9mm] rounded-full text-white font-bold flex items-center justify-center shrink-0 text-[12pt]" style={{ backgroundColor: "#2DB87A" }}>
                {i + 1}
              </span>
              {p}
            </li>
          ))}
        </ol>

        <p className="mt-[10mm] text-[12pt] text-[#57606f]">
          Ou acesse: <span className="font-bold text-[#1a5c38]">{linkCurto}</span>
        </p>

        <div className="mt-auto pt-[8mm] flex items-center gap-[3mm] text-[11pt] text-[#57606f]">
          <span className="font-bold text-[#1a5c38]">VAGA<span style={{ color: "#2DB87A" }}>ON</span></span>
          <span>· vagas e profissionais de gastronomia, hotelaria e eventos · grátis para o profissional</span>
        </div>
      </div>
    </div>
  );
}
