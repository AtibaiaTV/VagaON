import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase, CheckCircle, ArrowRight, User, Star, Clock } from "lucide-react";

const beneficios = [
  "Perfil visível para centenas de empresas",
  "Candidate-se com um clique",
  "CLT · Temporário · Sazonal",
  "Sem taxas — 100% gratuito",
];

export default function CriarPerfilBox() {
  return (
    <section className="py-20 bg-[#f0faf5]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Esquerda — texto */}
          <div>
            <span className="inline-block text-xs font-semibold text-primary uppercase tracking-widest mb-4 bg-primary/10 px-3 py-1 rounded-full">
              Para profissionais
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">
              Crie seu perfil e apareça para milhares de empresas
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Preencha suas especialidades, experiências e disponibilidade. Em minutos
              seu currículo estará disponível para restaurantes, hotéis e eventos.
            </p>
            <ul className="space-y-3 mb-8">
              {beneficios.map((b) => (
                <li key={b} className="flex items-center gap-3 text-sm text-foreground whitespace-nowrap">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
            <Link href="/cadastro/profissional">
              <Button size="lg" className="gap-2 px-8 h-12 font-semibold">
                Criar meu perfil grátis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Direita — currículo mock */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-border/20">

              {/* Header verde */}
              <div style={{ backgroundColor: "#1a5c38" }} className="px-6 pt-7 pb-5 text-white text-center relative">
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#4ade80] via-[#2DB87A] to-[#143f28]" />
                {/* Foto */}
                <div className="w-20 h-20 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center mx-auto mb-3">
                  <User className="h-10 w-10 text-white/80" strokeWidth={1.5} />
                </div>
                <p className="font-bold text-lg leading-tight">Maria Santos</p>
                <p className="text-white/70 text-sm mt-0.5">Cozinheira</p>
              </div>

              {/* Corpo — 2 colunas */}
              <div className="grid grid-cols-5">

                {/* Coluna esquerda — verde escuro */}
                <div style={{ backgroundColor: "#143f28" }} className="col-span-2 p-4 space-y-5">
                  <div>
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Contato</p>
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-white/70 flex items-center gap-1.5">
                        <MapPin className="h-2.5 w-2.5 shrink-0" />São Paulo, SP
                      </p>
                      <p className="text-[10px] text-white/70 truncate">maria@email.com</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Especialidades</p>
                    <div className="space-y-1">
                      {["Cozinha Italiana", "Grelhados", "Confeitaria"].map((e) => (
                        <span key={e} className="block text-[10px] text-white/80 bg-white/10 rounded px-2 py-0.5">
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Disponível</p>
                    <div className="space-y-1">
                      {["CLT", "Temporário"].map((t) => (
                        <p key={t} className="text-[10px] text-white/80 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] shrink-0" />{t}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Coluna direita — branca */}
                <div className="col-span-3 bg-white p-4 space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-1">
                      <span className="w-3 h-px bg-primary inline-block" />Experiência
                    </p>
                    <div className="space-y-2.5">
                      <div>
                        <p className="text-[11px] font-semibold text-foreground leading-tight">Sous Chef</p>
                        <p className="text-[10px] text-muted-foreground">Restaurante Pátio · 2022–2024</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">Responsável pelo cardápio e equipe de cozinha.</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-foreground leading-tight">Cozinheira</p>
                        <p className="text-[10px] text-muted-foreground">Hotel Vista · 2019–2022</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-1">
                      <span className="w-3 h-px bg-primary inline-block" />Habilidades
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {["Gestão", "BPF", "HACCP"].map((h) => (
                        <span key={h} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">{h}</span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/40">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-primary fill-primary" />
                      <p className="text-[10px] font-semibold text-primary">Perfil 100% completo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Badge */}
            <div className="hidden" />
          </div>
        </div>

        {/* Badge abaixo */}
        <div className="mt-6 flex items-center justify-end gap-2 text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4 text-primary" />
          Cadastro em menos de 5 minutos
        </div>
      </div>
    </section>
  );
}
