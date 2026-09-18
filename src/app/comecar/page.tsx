import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Building2, ChefHat } from "lucide-react";
import { auth } from "@/lib/auth";
import { normalizarOrigem } from "@/lib/servicos/cadastro-rapido";
import Logo from "@/components/layout/Logo";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Comece agora — VagaON",
  description: "Profissional: cadastre seu currículo em 1 minuto. Empresa: publique sua vaga em 1 minuto. Grátis.",
};

/** Destino do QR geral: a pessoa diz quem é e cai no cadastro rápido certo. */
export default async function ComecarPage({ searchParams }: { searchParams: { origem?: string } }) {
  const session = await auth();
  if (session) redirect("/painel");
  const origem = normalizarOrigem(searchParams.origem);
  const q = origem ? `?origem=${encodeURIComponent(origem)}` : "";

  const opcoes = [
    {
      href: `/curriculo${q}`,
      icone: <ChefHat className="h-7 w-7 text-white" />,
      titulo: "Sou profissional",
      texto: "Garçom, cozinheiro, bartender, camareira, recepção… Cadastre seu currículo em 1 minuto e receba vagas da região.",
      cta: "Cadastrar meu currículo",
    },
    {
      href: `/anunciar${q}`,
      icone: <Building2 className="h-7 w-7 text-white" />,
      titulo: "Sou empresa",
      texto: "Restaurante, bar, hotel, buffet ou evento. Descreva a vaga como falaria com alguém e ela entra no ar na hora.",
      cta: "Publicar minha vaga",
    },
  ];

  return (
    <div className="min-h-screen bg-[#1a5c38] flex flex-col">
      <div className="max-w-lg mx-auto w-full px-4 pt-8 pb-4 flex items-center justify-between">
        <Logo size="md" variant="white" />
        <Link href="/entrar" className="text-white/80 text-sm font-medium hover:text-white">
          Já tenho conta
        </Link>
      </div>
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-4">
        <div className="text-white mb-6">
          <h1 className="text-2xl font-bold leading-tight">Trabalho em gastronomia, hotelaria e eventos</h1>
          <p className="text-white/75 mt-2 text-sm">Grátis para profissionais. Escolha como quer começar:</p>
        </div>
        {opcoes.map((o) => (
          <Link key={o.href} href={o.href} className="block">
            <div className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#2DB87A] flex items-center justify-center shrink-0">{o.icone}</div>
                <div className="min-w-0">
                  <p className="text-lg font-bold">{o.titulo}</p>
                  <p className="text-sm text-muted-foreground mt-1">{o.texto}</p>
                  <p className="text-sm font-semibold text-primary mt-3 inline-flex items-center gap-1">
                    {o.cta} <ArrowRight className="h-4 w-4" />
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </main>
      <p className="text-center text-white/50 text-xs pb-6 px-4">Cadastro em 1 minuto · sem taxa para o profissional · vagas CLT, temporárias e sazonais</p>
    </div>
  );
}
