import { auth } from "@/lib/auth";
import { consultarConvite } from "@/lib/servicos/equipe";
import Logo from "@/components/layout/Logo";
import BrandBand from "@/components/shared/BrandBand";
import AceitarConvite from "./AceitarConvite";

export const dynamic = "force-dynamic";

export const metadata = { title: "Convite para a equipe — VagaON" };

/**
 * Página pública do convite. Sem conta: nome + senha e entra. Com conta do
 * mesmo e-mail: um clique. Logado com outra conta: pede para sair antes.
 */
export default async function ConvitePage({ params }: { params: { token: string } }) {
  const [c, session] = await Promise.all([consultarConvite(params.token), auth()]);

  const dados =
    c.estado === "valido"
      ? {
          estado: "valido" as const,
          empresa: c.empresa.nomeFantasia,
          email: c.convite.email,
          nome: c.convite.nome,
          contaExiste: c.contaExiste,
        }
      : { estado: c.estado };

  const sessao = session
    ? { email: session.user.email ?? "", mesmaConta: (session.user.email ?? "").toLowerCase() === (dados.estado === "valido" ? dados.email : "") }
    : null;

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <BrandBand color="dark" dots circles={false} className="hidden lg:flex flex-col justify-between p-12">
        <div className="relative">
          <Logo size="md" variant="white" />
        </div>
        <div className="relative">
          <blockquote className="text-white/90 text-2xl font-semibold leading-snug mb-4">
            Vagas, candidatos e entrevistas num lugar só, para a equipe inteira.
          </blockquote>
          <p className="text-white/50 text-sm">Você foi convidado(a) para operar uma empresa no VagaON.</p>
        </div>
        <div className="relative text-white/50 text-xs">VagaON · Gastronomia & Hotelaria</div>
      </BrandBand>

      <div className="flex items-center justify-center px-6 py-12 bg-[#f4f7f5]">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex justify-center mb-8">
            <Logo size="md" />
          </div>
          <AceitarConvite token={params.token} dados={dados} sessao={sessao} />
        </div>
      </div>
    </div>
  );
}
