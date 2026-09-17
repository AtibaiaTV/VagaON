"use client";

import Link from "next/link";
import { Building2, Heart, MessageCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { IMatch } from "@/models/Match";

interface Props {
  match: { id: string; score: number; snapshot: IMatch["snapshot"] };
  /** Lado de quem está vendo — define qual avatar vai à esquerda. */
  lado: "profissional" | "empresa";
  aoFechar: () => void;
}

function Avatar({ src, alt, fallback }: { src: string | null; alt: string; fallback: React.ReactNode }) {
  return (
    <div className="w-24 h-24 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-[#1a5c38] flex items-center justify-center">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        fallback
      )}
    </div>
  );
}

/** "Deu match!" — o momento que justifica o produto inteiro. */
export default function MatchOverlay({ match, lado, aoFechar }: Props) {
  const { snapshot } = match;
  const outroNome = lado === "profissional" ? snapshot.empresaNome : snapshot.profissionalNome;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      style={{ background: "radial-gradient(circle at 50% 30%, #1f7a4a 0%, #143f28 60%, #0b2417 100%)" }}
      role="dialog"
      aria-modal="true"
    >
      <div className="text-center max-w-sm w-full animate-in fade-in zoom-in-95 duration-300">
        <p className="text-[#4ade80] font-black text-4xl sm:text-5xl tracking-tight drop-shadow">Deu match!</p>
        <p className="text-white/80 mt-2 text-sm">
          Você e <span className="font-semibold text-white">{outroNome}</span> têm interesse mútuo.
        </p>

        <div className="flex items-center justify-center gap-4 my-8">
          <Avatar
            src={snapshot.profissionalFoto}
            alt={snapshot.profissionalNome}
            fallback={<User className="h-10 w-10 text-[#4ade80]" />}
          />
          <div className="w-12 h-12 rounded-full bg-[#2DB87A] flex items-center justify-center shadow-lg">
            <Heart className="h-6 w-6 text-white fill-current" />
          </div>
          <Avatar
            src={snapshot.empresaLogo}
            alt={snapshot.empresaNome}
            fallback={<Building2 className="h-10 w-10 text-[#4ade80]" />}
          />
        </div>

        <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3 mb-6">
          <p className="text-white font-semibold text-sm leading-snug">{snapshot.vagaTitulo}</p>
          <p className="text-white/60 text-xs mt-0.5">
            {snapshot.cidade}, {snapshot.estado} · aderência {match.score}%
          </p>
        </div>

        <div className="space-y-3">
          <Link href={`/matches/${match.id}`} className="block">
            <Button size="lg" className="w-full bg-[#2DB87A] hover:bg-[#25a06a] text-white font-bold gap-2">
              <MessageCircle className="h-5 w-5" />
              Enviar mensagem
            </Button>
          </Link>
          <Button
            size="lg"
            variant="ghost"
            className="w-full text-white/80 hover:text-white hover:bg-white/10"
            onClick={aoFechar}
          >
            Continuar descobrindo
          </Button>
        </div>
      </div>
    </div>
  );
}
