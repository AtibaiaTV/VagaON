import { redirect } from "next/navigation";
import { ChefHat } from "lucide-react";
import { auth } from "@/lib/auth";
import { normalizarOrigem } from "@/lib/servicos/cadastro-rapido";
import PaginaEntrada from "@/components/entrada/PaginaEntrada";
import FormCurriculoRapido from "./FormCurriculoRapido";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cadastre seu currículo em 1 minuto — VagaON",
  description: "Vagas de garçom, cozinheiro, bartender, recepcionista e mais. Cadastro gratuito, direto do celular.",
};

/** Entrada rápida do profissional (QR Code ou link): conta + perfil mínimo, depois completa. */
export default async function CurriculoRapidoPage({ searchParams }: { searchParams: { origem?: string } }) {
  const session = await auth();
  if (session?.user.role === "profissional") redirect("/perfil/editar");
  if (session) redirect("/painel");

  return (
    <PaginaEntrada
      titulo="Cadastre seu currículo em 1 minuto"
      subtitulo="Grátis. Depois você completa o perfil enviando o currículo em PDF ou preenchendo passo a passo."
      icone={<ChefHat className="h-6 w-6 text-primary" />}
    >
      <FormCurriculoRapido origem={normalizarOrigem(searchParams.origem)} />
    </PaginaEntrada>
  );
}
