import mongoose from "mongoose";
import type { CrossPlatformPayload } from "@/lib/cross-platform-auth";
import { connectDB } from "@/lib/db";
import Empresa, { type IEmpresa } from "@/models/Empresa";
import User, { type IUser } from "@/models/User";
import { ErroAtor } from "./erros";

/**
 * Conta do VagaON correspondente a um estabelecimento da RedeSA.
 *
 * O dono nunca digita senha aqui: quem garante quem ele é, é o backoffice da
 * RedeSA, por token assinado com CROSS_PLATFORM_SECRET. Este módulo é o único
 * lugar que cria ou encontra a dupla User + Empresa a partir do `redesaId`,
 * usado tanto pelo SSO quanto pela API de vagas.
 */

/** O token do SSO passa pelo navegador: vida curta, contada a partir do `iat`. */
export const VALIDADE_TOKEN_SSO = "5m";

export type SetorEmpresa = IEmpresa["setor"];

export function mapearCategoria(category?: string): SetorEmpresa {
  if (!category) return "outros";
  const map: Record<string, SetorEmpresa> = {
    gastronomy: "restaurante",
    accommodation: "hotel",
  };
  return map[category] ?? "outros";
}

export interface ContaRedesa {
  user: IUser;
  empresa: IEmpresa;
  /** Primeira vez que este estabelecimento vira conta no VagaON. */
  criada: boolean;
}

function emailDoToken(payload: CrossPlatformPayload): string {
  const email = (payload.email ?? "").trim().toLowerCase();
  if (!email) {
    throw new ErroAtor(
      400,
      "O estabelecimento precisa de e-mail cadastrado na RedeSA para ter conta no VagaON."
    );
  }
  return email;
}

/**
 * Encontra (ou cria) a conta do estabelecimento. Quatro situações, nesta ordem:
 *
 * 1. Empresa com `redesaId` e User de verdade → devolve os dois.
 * 2. Empresa com `redesaId` cujo `userId` não aponta para User nenhum — era o
 *    que a auto-provisão antiga deixava — → cria ou adota o User e conserta.
 * 3. Já existe User com aquele e-mail e papel "empresa" sem vínculo RedeSA →
 *    adota, para não criar conta duplicada de quem já usava o VagaON.
 * 4. Nada existe → cria User (sem senha) + Empresa.
 *
 * Um e-mail que já é de profissional ou de admin nunca é adotado: seria fundir
 * duas identidades sem que ninguém tenha pedido.
 */
export async function garantirContaRedesa(payload: CrossPlatformPayload): Promise<ContaRedesa> {
  await connectDB();

  const empresaExistente = await Empresa.findOne({ redesaId: payload.establishmentId });

  if (empresaExistente) {
    const user = await User.findById(empresaExistente.userId);
    if (user) {
      if (user.status === "suspenso") throw new ErroAtor(403, "Esta conta está suspensa no VagaON.");
      return { user, empresa: empresaExistente, criada: false };
    }
    // Empresa órfã: ninguém consegue entrar nela hoje. Conserta o vínculo.
    const dono = await adotarOuCriarUser(payload, empresaExistente._id as mongoose.Types.ObjectId);
    empresaExistente.userId = dono._id as mongoose.Types.ObjectId;
    await empresaExistente.save();
    return { user: dono, empresa: empresaExistente, criada: false };
  }

  const email = emailDoToken(payload);
  const userExistente = await User.findOne({ email });

  if (userExistente) {
    if (userExistente.role !== "empresa") {
      throw new ErroAtor(
        409,
        `O e-mail ${email} já tem conta de ${userExistente.role} no VagaON. Use outro e-mail no cadastro da RedeSA.`
      );
    }
    if (userExistente.status === "suspenso") throw new ErroAtor(403, "Esta conta está suspensa no VagaON.");

    const empresaDoUser = await Empresa.findOne({ userId: userExistente._id });
    if (empresaDoUser) {
      // Empresa que já existia no VagaON passa a ser a mesma da RedeSA.
      empresaDoUser.redesaId = payload.establishmentId;
      await empresaDoUser.save();
      return { user: userExistente, empresa: empresaDoUser, criada: false };
    }

    const empresa = await criarEmpresa(payload, userExistente._id as mongoose.Types.ObjectId);
    await User.updateOne({ _id: userExistente._id }, { $set: { profileId: empresa._id } });
    return { user: userExistente, empresa, criada: true };
  }

  const user = await User.create({
    name: payload.establishmentName,
    email,
    // Sem senha: a entrada é sempre pela RedeSA. Para usar o login normal do
    // VagaON, a pessoa define uma senha depois, pelo próprio perfil.
    password: null,
    role: "empresa",
    status: "ativo",
    origemCadastro: "redesa",
  });
  const empresa = await criarEmpresa(payload, user._id as mongoose.Types.ObjectId);
  await User.updateOne({ _id: user._id }, { $set: { profileId: empresa._id } });
  user.profileId = empresa._id as mongoose.Types.ObjectId;

  return { user, empresa, criada: true };
}

async function adotarOuCriarUser(
  payload: CrossPlatformPayload,
  empresaId: mongoose.Types.ObjectId
): Promise<IUser> {
  const email = emailDoToken(payload);
  const existente = await User.findOne({ email });
  if (existente) {
    if (existente.role !== "empresa") {
      throw new ErroAtor(
        409,
        `O e-mail ${email} já tem conta de ${existente.role} no VagaON. Use outro e-mail no cadastro da RedeSA.`
      );
    }
    if (existente.status === "suspenso") throw new ErroAtor(403, "Esta conta está suspensa no VagaON.");
    await User.updateOne({ _id: existente._id }, { $set: { profileId: empresaId } });
    return existente;
  }
  return User.create({
    name: payload.establishmentName,
    email,
    password: null,
    role: "empresa",
    status: "ativo",
    profileId: empresaId,
    origemCadastro: "redesa",
  });
}

async function criarEmpresa(
  payload: CrossPlatformPayload,
  userId: mongoose.Types.ObjectId
): Promise<IEmpresa> {
  return Empresa.create({
    userId,
    redesaId: payload.establishmentId,
    nomeFantasia: payload.establishmentName,
    razaoSocial: payload.establishmentName,
    email: (payload.email ?? "").trim().toLowerCase(),
    telefone: payload.phone ?? "",
    cidade: payload.city ?? "",
    estado: payload.state,
    setor: mapearCategoria(payload.category),
  });
}

/** Dados da sessão do NextAuth para esta conta. */
export function sessaoDaConta(conta: ContaRedesa) {
  return {
    id: String(conta.user._id),
    name: conta.user.name,
    email: conta.user.email,
    role: conta.user.role,
    profileId: conta.user.profileId ? String(conta.user.profileId) : String(conta.empresa._id),
    status: conta.user.status,
  };
}
