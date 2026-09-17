import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Empresa, { type IEmpresa } from "@/models/Empresa";
import Profissional, { type IProfissional } from "@/models/Profissional";

/**
 * Quem está agindo no match: o perfil (não o User) do lado autenticado.
 * Centraliza o "sessão → perfil" que toda rota de match precisa.
 */
export type Ator =
  | { tipo: "profissional"; userId: string; profissional: IProfissional }
  | { tipo: "empresa"; userId: string; empresa: IEmpresa };

export class ErroAtor extends Error {
  constructor(
    public status: number,
    mensagem: string
  ) {
    super(mensagem);
  }
}

export async function resolverAtor(): Promise<Ator> {
  const session = await auth();
  if (!session?.user) throw new ErroAtor(401, "Não autorizado.");

  await connectDB();
  const userId = session.user.id;

  if (session.user.role === "profissional") {
    const profissional = await Profissional.findOne({ userId });
    if (!profissional) throw new ErroAtor(404, "Complete seu perfil antes de usar o match.");
    return { tipo: "profissional", userId, profissional };
  }

  if (session.user.role === "empresa") {
    const empresa = await Empresa.findOne({ userId });
    if (!empresa) throw new ErroAtor(404, "Perfil de empresa não encontrado.");
    return { tipo: "empresa", userId, empresa };
  }

  throw new ErroAtor(403, "O match é para profissionais e empresas.");
}

export function exigirProfissional(ator: Ator) {
  if (ator.tipo !== "profissional") throw new ErroAtor(403, "Disponível apenas para profissionais.");
  return ator.profissional;
}

export function exigirEmpresa(ator: Ator) {
  if (ator.tipo !== "empresa") throw new ErroAtor(403, "Disponível apenas para empresas.");
  return ator.empresa;
}
