import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { MODELO_PADRAO, corDoModelo, ehModeloCurriculo, montarDadosCurriculo, normalizarCores } from "@/lib/curriculo";
import Profissional from "@/models/Profissional";
import User from "@/models/User";
import CurriculoPublico from "@/components/curriculo/CurriculoPublico";

export const dynamic = "force-dynamic";

/** Só tokens no formato que geramos (base64url de 16 bytes). */
function tokenValido(t: string) {
  return /^[A-Za-z0-9_-]{16,32}$/.test(t);
}

async function carregar(token: string) {
  if (!tokenValido(token)) return null;
  await connectDB();
  const prof = await Profissional.findOne({ "curriculoPublico.token": token, "curriculoPublico.ativo": true }).lean();
  if (!prof) return null;
  const user = await User.findById(prof.userId).select("email").lean();
  return { prof, email: user?.email ?? null };
}

export async function generateMetadata({ params }: { params: { token: string } }): Promise<Metadata> {
  const r = await carregar(params.token);
  return {
    title: r ? `Currículo de ${r.prof.nomeCompleto} — VagaON` : "Currículo não encontrado — VagaON",
    // Link privado, compartilhado pela própria pessoa: fora dos buscadores.
    robots: { index: false, follow: false },
  };
}

/** Página pública do currículo, aberta por quem recebeu o link no WhatsApp. */
export default async function CurriculoPublicoPage({ params }: { params: { token: string } }) {
  const r = await carregar(params.token);
  if (!r) notFound();

  const modelo = ehModeloCurriculo(r.prof.curriculoModelo) ? r.prof.curriculoModelo : MODELO_PADRAO;
  return (
    <CurriculoPublico
      dados={montarDadosCurriculo(r.prof, r.email)}
      modelo={modelo}
      cor={corDoModelo(modelo, normalizarCores(r.prof.curriculoCores))}
    />
  );
}
