import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Briefcase, Clock, CheckCircle } from "lucide-react";

const vagasDestaque = [
  { cargo: "Garçom", empresa: "Restaurante Bella Vista", cidade: "São Paulo, SP", tipo: "CLT" },
  { cargo: "Barman", empresa: "Hotel Grand Plaza", cidade: "Rio de Janeiro, RJ", tipo: "Temporário" },
  { cargo: "Cozinheiro", empresa: "Bistrô do Chef", cidade: "Curitiba, PR", tipo: "CLT" },
];

const vantagens = [
  "Cadastro gratuito e sem burocracia",
  "CLT, temporário e sazonal",
  "Profissionais verificados",
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#1a5c38]">
      {/* Padrão de pontos sutil */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.07]"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Esquerda */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-xs font-medium px-4 py-1.5 rounded-full mb-6 uppercase tracking-widest border border-white/20">
              <span className="w-1.5 h-1.5 bg-[#4ade80] rounded-full animate-pulse" />
              Plataforma gratuita para profissionais
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold leading-[1.1] tracking-tight text-white mb-6">
              Encontre o emprego certo em Gastronomia e Hotelaria
            </h1>

            <p className="text-lg text-white/70 leading-relaxed mb-8 max-w-lg">
              Conectamos garçons, cozinheiros, barmans e recepcionistas com
              restaurantes, hotéis, bares e eventos. CLT, temporário ou sazonal.
            </p>

            <ul className="space-y-2.5 mb-10">
              {vantagens.map((v) => (
                <li key={v} className="flex items-center gap-2.5 text-sm text-white/80">
                  <CheckCircle className="h-4 w-4 text-[#4ade80] shrink-0" />
                  {v}
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/cadastro/profissional">
                <Button size="lg" className="w-full sm:w-auto gap-2 text-base px-7 h-12 font-semibold bg-white text-[#1a5c38] hover:bg-white/90">
                  Sou profissional
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/cadastro/empresa">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto gap-2 text-base px-7 h-12 border-2 border-white/30 text-white hover:bg-white/10 hover:text-white"
                >
                  Sou empresa
                </Button>
              </Link>
            </div>
          </div>

          {/* Direita — painel de vagas */}
          <div className="relative hidden lg:block">
            <div className="absolute -top-3 -right-3 z-10 bg-white text-[#1a5c38] text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
              100% Gratuito
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-white font-semibold text-sm">Vagas abertas agora</p>
                  <p className="text-white/50 text-xs mt-0.5">Atualizadas em tempo real</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs bg-white/10 text-white/80 px-2.5 py-1 rounded-full font-medium border border-white/20">
                  <span className="w-1.5 h-1.5 bg-[#4ade80] rounded-full animate-pulse" />
                  Ao vivo
                </span>
              </div>

              <div className="space-y-3">
                {vagasDestaque.map((v, i) => (
                  <div key={i} className="bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl p-4 transition-colors cursor-default">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                        <Briefcase className="h-4 w-4 text-white/80" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-white">{v.cargo}</p>
                        <p className="text-xs text-white/55 truncate">{v.empresa}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="flex items-center gap-1 text-xs text-white/45">
                            <MapPin className="h-3 w-3" />{v.cidade}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-white/45">
                            <Clock className="h-3 w-3" />{v.tipo}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-white/15 text-center">
                <Link href="/vagas" className="text-sm text-white/70 hover:text-white font-medium transition-colors">
                  Ver todas as vagas abertas →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
