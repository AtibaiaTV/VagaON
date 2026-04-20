import Link from "next/link";
import { ChefHat, Building2, ArrowRight } from "lucide-react";
import Logo from "@/components/layout/Logo";

export default function CadastroPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* Lado esquerdo — verde */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: "#1a5c38" }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative">
          <Logo size="md" variant="white" />
        </div>

        <div className="relative space-y-8">
          {/* Frase principal */}
          <blockquote className="text-white/90 text-2xl font-semibold leading-snug">
            "Sua próxima oportunidade em gastronomia, hotelaria e eventos começa aqui. Cadastre-se e seja encontrado pelas melhores empresas do Brasil."
          </blockquote>
          <p className="text-white/50 text-sm">Plataforma 100% gratuita para profissionais</p>

          {/* Benefícios */}
          <div className="space-y-3">
            {[
              "Cadastro gratuito e sem burocracia",
              "CLT, temporário e sazonal",
              "Profissionais verificados",
              "Vagas em todo o Brasil",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#4ade80]/30 border border-[#4ade80]/50 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-[#4ade80]" />
                </div>
                <p className="text-white/80 text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-xs font-bold">V</span>
          </div>
          <div>
            <p className="text-white text-sm font-medium">VagaON</p>
            <p className="text-white/50 text-xs">Gastronomia & Hotelaria</p>
          </div>
        </div>
      </div>

      {/* Lado direito */}
      <div className="flex items-center justify-center px-6 py-12 bg-[#f4f7f5]">
        <div className="w-full max-w-sm">

          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <Logo size="md" />
          </div>

          {/* Cabeçalho */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Criar conta</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Como você vai usar a plataforma?
            </p>
          </div>

          {/* Opções */}
          <div className="space-y-3">

            {/* Profissional */}
            <Link href="/cadastro/profissional">
              <div className="group w-full bg-white hover:border-primary border-2 border-transparent rounded-2xl p-5 flex items-start gap-4 cursor-pointer transition-all hover:shadow-md">
                <div className="w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary/15 flex items-center justify-center shrink-0 transition-colors">
                  <ChefHat className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base text-foreground">Sou Profissional</p>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                    Quero encontrar vagas como garçom, cozinheiro, barman, recepcionista e muito mais.
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
              </div>
            </Link>

            {/* Empresa */}
            <Link href="/cadastro/empresa">
              <div className="group w-full bg-white hover:border-primary border-2 border-transparent rounded-2xl p-5 flex items-start gap-4 cursor-pointer transition-all hover:shadow-md mt-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary/15 flex items-center justify-center shrink-0 transition-colors">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base text-foreground">Sou Empresa</p>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                    Quero publicar vagas e encontrar profissionais para meu restaurante, hotel, bar ou evento.
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
              </div>
            </Link>
          </div>

          {/* Login */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            Já tem conta?{" "}
            <Link href="/entrar" className="text-primary hover:underline font-semibold">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
