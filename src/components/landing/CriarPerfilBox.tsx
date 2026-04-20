import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChefHat, MapPin, Briefcase, CheckCircle, ArrowRight } from "lucide-react";

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
        <div className="grid lg:grid-cols-2 gap-8 items-center">

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

          {/* Direita — card de perfil ilustrativo */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-sm">
              {/* Card de perfil mock */}
              <div className="bg-white rounded-2xl shadow-xl border border-border/40 overflow-hidden">
                {/* Header do card */}
                <div className="bg-[#1a5c38] px-6 py-8 text-white text-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center mx-auto mb-3">
                    <ChefHat className="h-8 w-8 text-white" />
                  </div>
                  <p className="font-bold text-lg">Seu nome aqui</p>
                  <p className="text-white/70 text-sm mt-0.5">Cozinheiro · São Paulo, SP</p>
                </div>

                {/* Corpo do card */}
                <div className="p-5 space-y-4">
                  {/* Especialidades */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Especialidades</p>
                    <div className="flex flex-wrap gap-1.5">
                      {["Cozinha Italiana", "Grelhados", "Sushiman"].map((tag) => (
                        <span key={tag} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      Disponível em São Paulo e região
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Briefcase className="h-4 w-4 text-primary" />
                      CLT e Temporário
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="pt-2">
                    <div className="w-full h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">Perfil 100% completo ✓</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Badge flutuante */}
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-primary" />
                Cadastro em menos de 5 minutos
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
