"use client";

import { useRef, useState } from "react";
import { Loader2, Video, X } from "lucide-react";

export interface VideoPerfil {
  url: string;
  publicId: string;
  /** Segundos. */
  duracao: number;
}

export const VIDEO_MAX_SEGUNDOS = 60;
export const VIDEO_MAX_MB = 60;

interface Props {
  video: VideoPerfil | null;
  onChange: (v: VideoPerfil | null) => void;
  onErro: (msg: string) => void;
}

function lerDuracao(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(v.duration);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler o vídeo."));
    };
    v.src = url;
  });
}

export function formatarDuracao(s: number): string {
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

/**
 * Vídeo curto de apresentação (até 60 s). Sobe direto do navegador para o
 * Cloudinary com assinatura do servidor — o corpo não passa pela Vercel,
 * cujo limite é 4,5 MB. O perfil só grava a URL quando a pessoa salva.
 */
export default function VideoApresentacao({ video, onChange, onErro }: Props) {
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  async function aoEscolher(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("video/")) return onErro("Envie um arquivo de vídeo (MP4, MOV ou WebM).");
    if (file.size > VIDEO_MAX_MB * 1024 * 1024) return onErro(`Vídeo acima de ${VIDEO_MAX_MB} MB. Grave em resolução menor.`);

    let duracao: number;
    try {
      duracao = await lerDuracao(file);
    } catch {
      return onErro("Não foi possível ler o vídeo. Tente outro formato (MP4).");
    }
    if (!Number.isFinite(duracao)) duracao = 0;
    if (duracao > VIDEO_MAX_SEGUNDOS + 2) {
      return onErro(`O vídeo tem ${formatarDuracao(duracao)}. O máximo é ${VIDEO_MAX_SEGUNDOS} segundos — corte antes de enviar.`);
    }

    setEnviando(true);
    setProgresso(0);
    try {
      const ass = await fetch("/api/upload/video", { method: "POST" });
      const a = await ass.json().catch(() => ({}));
      if (!ass.ok) throw new Error(a?.error ?? "Upload de vídeo indisponível.");

      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", a.apiKey);
      fd.append("timestamp", String(a.timestamp));
      fd.append("folder", a.folder);
      fd.append("signature", a.signature);

      const resultado = await new Promise<{ secure_url: string; public_id: string; duration?: number }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${a.cloudName}/video/upload`);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgresso(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => {
          try {
            const r = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && r.secure_url) resolve(r);
            else reject(new Error(r?.error?.message ?? "Falha no envio do vídeo."));
          } catch {
            reject(new Error("Falha no envio do vídeo."));
          }
        };
        xhr.onerror = () => reject(new Error("Sem conexão durante o envio."));
        xhr.send(fd);
      });

      onChange({
        url: resultado.secure_url,
        publicId: resultado.public_id,
        duracao: Math.round(resultado.duration ?? duracao),
      });
    } catch (err) {
      onErro(err instanceof Error ? err.message : "Falha no envio do vídeo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="rounded-xl border border-border/60 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Video className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Vídeo de apresentação (opcional)</p>
          <p className="text-xs text-muted-foreground">
            Até {VIDEO_MAX_SEGUNDOS} segundos, no celular mesmo: quem você é, o que faz e o que busca. As empresas veem
            no seu card — perfis com vídeo chamam mais atenção.
          </p>
        </div>
      </div>

      {video ? (
        <div className="space-y-2">
          <video
            src={video.url}
            controls
            playsInline
            preload="metadata"
            className="w-full max-h-64 rounded-lg bg-black"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Duração {formatarDuracao(video.duracao)}</span>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => inputRef.current?.click()} className="font-medium text-primary hover:underline" disabled={enviando}>
                Trocar vídeo
              </button>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="inline-flex items-center gap-1 hover:text-destructive"
                disabled={enviando}
              >
                <X className="h-3 w-3" /> Remover
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={enviando}
          className="w-full rounded-lg border-2 border-dashed border-border px-4 py-4 text-sm text-center hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:opacity-60"
        >
          {enviando ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Enviando… {progresso}%
            </span>
          ) : (
            <span className="text-primary font-medium">Gravar ou escolher um vídeo</span>
          )}
        </button>
      )}

      {enviando && video && (
        <p className="text-xs text-muted-foreground inline-flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando novo vídeo… {progresso}%
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/*"
        capture="user"
        className="sr-only"
        onChange={aoEscolher}
        disabled={enviando}
      />
    </div>
  );
}
