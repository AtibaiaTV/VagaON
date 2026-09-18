import type { Session } from "next-auth";
import { acessoDaEmpresa } from "@/lib/servicos/planos";
import Candidatura from "@/models/Candidatura";
import Empresa from "@/models/Empresa";
import Match from "@/models/Match";
import { filtroEmpresaDoUsuario } from "./equipe";

/**
 * Quem pode abrir o perfil (ou o currículo) de um profissional:
 * - admin: sempre, sem empresa nem plano;
 * - empresa: sempre no Pro; sem o Pro, só quem já se relacionou com ela
 *   (candidatura ou match) — o candidato que veio até ela nunca fica escondido.
 *
 * Presume `connectDB()` já chamado.
 */
export type AcessoProfissional =
  | { ok: true; ehAdmin: boolean }
  | { ok: false; motivo: "sem-sessao" | "papel" | "paywall" };

export async function acessoAoProfissional(session: Session | null, profissionalId: string): Promise<AcessoProfissional> {
  if (!session) return { ok: false, motivo: "sem-sessao" };
  if (session.user.role === "admin") return { ok: true, ehAdmin: true };
  if (session.user.role !== "empresa") return { ok: false, motivo: "papel" };

  const empresa = await Empresa.findOne(filtroEmpresaDoUsuario(session.user.id)).select("_id assinatura").lean();
  if (empresa && !acessoDaEmpresa(empresa).limites.bancoCurriculos) {
    const relacionado =
      (await Candidatura.exists({ empresaId: empresa._id, profissionalId })) ||
      (await Match.exists({ empresaId: empresa._id, profissionalId }));
    if (!relacionado) return { ok: false, motivo: "paywall" };
  }
  return { ok: true, ehAdmin: false };
}
