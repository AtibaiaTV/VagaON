"use client";

import { useState } from "react";
import { Check, Copy, Download, Printer, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DESTINOS_QR, DestinoQr } from "@/lib/qr";

const ORIGENS_SUGERIDAS = ["cartaz", "balcao", "adesivo", "instagram", "whatsapp", "evento"];

/** Escolhe destino, origem e selo; baixa SVG/PNG, copia o link, abre o cartaz. */
export default function GeradorQr({ base, destinos }: { base: string; destinos: typeof DESTINOS_QR }) {
  const [destino, setDestino] = useState<DestinoQr>("comecar");
  const [origem, setOrigem] = useState("cartaz");
  const [selo, setSelo] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [gerandoPng, setGerandoPng] = useState(false);

  const origemLimpa = origem.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-|-$/g, "");
  const link = `${base}${destinos[destino].caminho}${origemLimpa ? `?origem=${encodeURIComponent(origemLimpa)}` : ""}`;
  const svgUrl = `/api/qr?destino=${destino}&origem=${encodeURIComponent(origemLimpa)}&selo=${selo ? 1 : 0}`;
  const nome = `qr-vagaon-${destino}${origemLimpa ? `-${origemLimpa}` : ""}`;

  async function baixarSvg() {
    const svg = await fetch(`${svgUrl}&tamanho=1024`).then((r) => r.text());
    baixar(new Blob([svg], { type: "image/svg+xml" }), `${nome}.svg`);
  }

  async function baixarPng() {
    setGerandoPng(true);
    try {
      const svg = await fetch(`${svgUrl}&tamanho=1024`).then((r) => r.text());
      const img = new Image();
      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      await new Promise<void>((ok, erro) => {
        img.onload = () => ok();
        img.onerror = () => erro(new Error("svg"));
        img.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 1024, 1024);
      ctx.drawImage(img, 0, 0, 1024, 1024);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => b && baixar(b, `${nome}.png`), "image/png");
    } finally {
      setGerandoPng(false);
    }
  }

  function baixar(blob: Blob, arquivo: string) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = arquivo;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  }

  async function copiar() {
    await navigator.clipboard.writeText(link).catch(() => {});
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  const mensagem =
    destino === "anunciar"
      ? `Precisa de garçom, cozinheiro ou equipe pro evento? Publique sua vaga grátis em 1 minuto no VagaON: ${link}`
      : destino === "curriculo"
        ? `Procurando trabalho em restaurante, bar, hotel ou evento? Cadastre seu currículo grátis em 1 minuto no VagaON: ${link}`
        : `VagaON: vagas e profissionais de gastronomia, hotelaria e eventos. Cadastro grátis em 1 minuto: ${link}`;

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      <div className="space-y-5 bg-white rounded-2xl border p-5">
        <div className="space-y-2">
          <Label>Para onde o QR leva</Label>
          <div className="grid sm:grid-cols-3 gap-2">
            {(Object.keys(destinos) as DestinoQr[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDestino(d)}
                className={`text-left rounded-xl border-2 px-3 py-2.5 transition-colors ${
                  destino === d ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <p className="text-sm font-semibold">{destinos[d].rotulo}</p>
                <p className="text-[11px] text-muted-foreground">{destinos[d].descricao}</p>
                <p className="text-[11px] font-mono text-primary mt-1">{destinos[d].caminho}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="origem">Etiqueta de origem (onde este QR vai ficar)</Label>
          <Input id="origem" value={origem} onChange={(e) => setOrigem(e.target.value)} placeholder="cartaz, balcao, instagram…" className="max-w-xs" />
          <div className="flex flex-wrap gap-1.5">
            {ORIGENS_SUGERIDAS.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setOrigem(o)}
                className={`text-xs px-2.5 py-1 rounded-full border ${origemLimpa === o ? "bg-[#1a5c38] text-white border-[#1a5c38]" : "bg-white hover:border-primary/50"}`}
              >
                {o}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Cada material com uma etiqueta diferente: a tabela abaixo mostra quantos cadastros vieram de cada um.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={selo} onChange={(e) => setSelo(e.target.checked)} className="h-4 w-4 rounded border-input" />
          Selo VagaON no centro
        </label>

        <div className="space-y-2">
          <Label>Link (funciona igual ao QR)</Label>
          <div className="flex flex-wrap items-center gap-2">
            <code className="text-xs bg-muted rounded-md px-2 py-1.5 break-all">{link}</code>
            <Button type="button" size="sm" variant="outline" onClick={copiar} className="gap-1.5">
              {copiado ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
              {copiado ? "copiado" : "copiar"}
            </Button>
            <a href={`https://wa.me/?text=${encodeURIComponent(mensagem)}`} target="_blank" rel="noopener">
              <Button type="button" size="sm" variant="outline" className="gap-1.5">
                <Share2 className="h-3.5 w-3.5" /> enviar por WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-white rounded-2xl border p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={svgUrl} alt={`QR Code para ${link}`} className="w-full aspect-square" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" onClick={baixarSvg} className="gap-1.5 bg-white">
            <Download className="h-4 w-4" /> SVG
          </Button>
          <Button type="button" variant="outline" onClick={baixarPng} disabled={gerandoPng} className="gap-1.5 bg-white">
            <Download className="h-4 w-4" /> PNG
          </Button>
        </div>
        <a href={`/cartaz?destino=${destino}&origem=${encodeURIComponent(origemLimpa)}`} target="_blank" rel="noopener" className="block">
          <Button type="button" className="w-full gap-2">
            <Printer className="h-4 w-4" /> Cartaz para imprimir (A4)
          </Button>
        </a>
        <p className="text-[11px] text-muted-foreground">
          SVG para gráfica e adesivo (vetor, não perde qualidade); PNG para redes e WhatsApp.
        </p>
      </div>
    </div>
  );
}
