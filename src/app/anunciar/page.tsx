import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { iaConfigurada } from "@/lib/ia/cliente";
import { normalizarOrigem } from "@/lib/servicos/cadastro-rapido";
import PaginaEntrada from "@/components/entrada/PaginaEntrada";
import FormAnunciarRapido from "./FormAnunciarRapido";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Publique sua vaga em 1 minuto — VagaON",
  description: "Restaurante, bar, hotel ou evento: descreva a vaga como falaria com alguém e receba candidatos da região.",
};

/** Entrada rápida da empresa (QR Code ou link): conta + empresa + primeira vaga no ar. */
export default async function AnunciarRapidoPage({ searchParams }: { searchParams: { origem?: string } }) {
  const session = await auth();
  if (session?.user.role === "empresa") redirect("/vagas/nova");
  if (session) redirect("/painel");

  return (
    <PaginaEntrada
      titulo="Publique sua vaga em 1 minuto"
      subtitulo="Grátis. Descreva a vaga como falaria com alguém; ela entra no ar na hora e os candidatos da região começam a aparecer."
      icone={<Building2 className="h-6 w-6 text-primary" />}
    >
      <FormAnunciarRapido origem={normalizarOrigem(searchParams.origem)} comIA={iaConfigurada()} />
    </PaginaEntrada>
  );
}
