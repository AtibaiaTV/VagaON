import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2 } from "lucide-react";

export default function CTA() {
  return (
    <section className="py-20 bg-primary relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/5 rounded-full" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
          Pronto para começar?
        </h2>
        <p className="text-white/75 text-lg mb-10 max-w-xl mx-auto">
          Cadastre-se agora gratuitamente. Em menos de 5 minutos seu perfil ou sua
          primeira vaga já estará no ar.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/cadastro/profissional">
            <Button
              size="lg"
              className="w-full sm:w-auto gap-2 text-base px-8 h-12 bg-white text-primary hover:bg-white/90 font-semibold"
            >
              Criar perfil de profissional
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/cadastro/empresa">
            <Button
              size="lg"
              className="w-full sm:w-auto gap-2 text-base px-8 h-12 bg-transparent border-2 border-white/40 hover:bg-white/10 text-white"
            >
              <Building2 className="h-5 w-5" />
              Cadastrar minha empresa
            </Button>
          </Link>
        </div>

        {/* Prova social simples */}
        <p className="mt-10 text-white/50 text-sm">
          Sem cartão de crédito · Sem contrato · Cancele quando quiser
        </p>
      </div>
    </section>
  );
}
