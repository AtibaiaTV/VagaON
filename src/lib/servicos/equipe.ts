import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { emailConfigurado, enviarEmail } from "@/lib/notificacoes/canais/email";
import ConviteEmpresa, { type IConviteEmpresa } from "@/models/ConviteEmpresa";
import Empresa, { type IEmpresa, type PapelEmpresa } from "@/models/Empresa";
import User from "@/models/User";
import { ErroAtor } from "./erros";
import { exigirRecurso } from "./planos";

/**
 * Multiusuário por empresa.
 *
 * A empresa tem um DONO (`Empresa.userId`, quem criou a conta) e zero ou
 * mais GERENTES (`Empresa.membros`). Gerente faz tudo no dia a dia — vaga,
 * funil, chat, Descobrir, perfil da empresa — mas não mexe em plano nem na
 * equipe. Todo User da equipe tem role "empresa" e profileId = empresa.
 *
 * A pergunta "qual é a empresa deste usuário?" é sempre respondida por
 * `filtroEmpresaDoUsuario`, nunca por `{ userId }` direto.
 */

export const VALIDADE_CONVITE_DIAS = 7;
export const MAX_MEMBROS = 10;

/* eslint-disable @typescript-eslint/no-explicit-any */
type Doc = Record<string, any>;

// ─── Resolução ─────────────────────────────────────────────────────────────

/** Filtro Mongo: a empresa em que o usuário é dono ou gerente. */
export function filtroEmpresaDoUsuario(userId: string | mongoose.Types.ObjectId) {
  return { $or: [{ userId }, { "membros.userId": userId }] };
}

export function papelNaEmpresa(empresa: Doc, userId: string): PapelEmpresa | null {
  if (String(empresa.userId) === String(userId)) return "dono";
  const membro = (empresa.membros ?? []).find((m: Doc) => String(m.userId) === String(userId));
  return membro ? "gerente" : null;
}

export function exigirDono(empresa: Doc, userId: string) {
  if (papelNaEmpresa(empresa, userId) !== "dono") {
    throw new ErroAtor(403, "Só o dono da empresa pode fazer isso.");
  }
}

/** Ids de todos que operam a empresa (dono primeiro). Para avisar a equipe inteira. */
export function usuariosDaEmpresa(empresa: Doc): string[] {
  const ids = [String(empresa.userId), ...(empresa.membros ?? []).map((m: Doc) => String(m.userId))];
  return Array.from(new Set(ids));
}

// ─── Listagem ──────────────────────────────────────────────────────────────

export interface MembroListado {
  userId: string;
  nome: string;
  email: string;
  papel: PapelEmpresa;
  status: string;
  desde: string | null;
}

export interface ConviteListado {
  id: string;
  email: string;
  nome: string;
  criadoEm: string;
  expiraEm: string;
  vencido: boolean;
  link: string;
}

export function linkDoConvite(token: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}/convite/${token}`;
}

export async function listarEquipe(empresa: IEmpresa): Promise<{ membros: MembroListado[]; convites: ConviteListado[] }> {
  await connectDB();
  const ids = usuariosDaEmpresa(empresa);
  const [users, convites] = await Promise.all([
    User.find({ _id: { $in: ids } }).select("name email status createdAt").lean(),
    ConviteEmpresa.find({ empresaId: empresa._id, aceitoEm: null, canceladoEm: null })
      .sort({ createdAt: -1 })
      .lean(),
  ]);
  const porId = new Map(users.map((u) => [String(u._id), u]));
  const agora = Date.now();

  const membros: MembroListado[] = [];
  const dono = porId.get(String(empresa.userId));
  if (dono) {
    membros.push({ userId: String(dono._id), nome: dono.name, email: dono.email, papel: "dono", status: dono.status, desde: null });
  }
  for (const m of empresa.membros ?? []) {
    const u = porId.get(String(m.userId));
    if (!u) continue;
    membros.push({
      userId: String(u._id),
      nome: u.name,
      email: u.email,
      papel: "gerente",
      status: u.status,
      desde: m.desde ? new Date(m.desde).toISOString() : null,
    });
  }

  return {
    membros,
    convites: convites.map((c) => ({
      id: String(c._id),
      email: c.email,
      nome: c.nome,
      criadoEm: new Date(c.createdAt).toISOString(),
      expiraEm: new Date(c.expiraEm).toISOString(),
      vencido: new Date(c.expiraEm).getTime() < agora,
      link: linkDoConvite(c.token),
    })),
  };
}

// ─── Convite ───────────────────────────────────────────────────────────────

function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Cria (ou renova) o convite e manda o e-mail, se o Resend estiver ligado.
 * Devolve o link em qualquer caso: o dono pode mandar por WhatsApp.
 */
export async function convidarGerente(
  empresa: IEmpresa,
  donoId: string,
  entrada: { email: string; nome?: string }
): Promise<{ convite: ConviteListado; emailEnviado: boolean }> {
  exigirDono(empresa, donoId);
  exigirRecurso(empresa, "multiusuario");

  const email = (entrada.email ?? "").trim().toLowerCase();
  const nome = (entrada.nome ?? "").trim().slice(0, 120);
  if (!emailValido(email)) throw new ErroAtor(400, "Informe um e-mail válido.");

  await connectDB();

  if ((empresa.membros?.length ?? 0) >= MAX_MEMBROS) {
    throw new ErroAtor(400, `A equipe já tem o máximo de ${MAX_MEMBROS} pessoas.`);
  }

  const existente = await User.findOne({ email }).select("_id role profileId").lean();
  if (existente) {
    if (usuariosDaEmpresa(empresa).includes(String(existente._id))) {
      throw new ErroAtor(409, "Esta pessoa já faz parte da equipe.");
    }
    if (existente.role !== "empresa") {
      throw new ErroAtor(409, `Este e-mail já tem conta de ${existente.role} no VagaON. Use outro e-mail para o gerente.`);
    }
    const outra = await Empresa.exists(filtroEmpresaDoUsuario(existente._id));
    if (outra) throw new ErroAtor(409, "Este e-mail já opera outra empresa no VagaON. Use outro e-mail.");
  }

  // Um convite pendente por e-mail: renova em vez de acumular.
  await ConviteEmpresa.updateMany(
    { empresaId: empresa._id, email, aceitoEm: null, canceladoEm: null },
    { $set: { canceladoEm: new Date() } }
  );

  const convite = await ConviteEmpresa.create({
    empresaId: empresa._id,
    email,
    nome,
    token: randomBytes(24).toString("base64url"),
    convidadoPor: donoId,
    expiraEm: new Date(Date.now() + VALIDADE_CONVITE_DIAS * 86_400_000),
  });

  let emailEnviado = false;
  if (emailConfigurado()) {
    const r = await enviarEmail(email, nome || email, {
      categoria: "sistema",
      titulo: `Convite para gerenciar ${empresa.nomeFantasia} no VagaON`,
      corpo:
        `Você foi convidado(a) para ajudar a gerenciar as vagas e os candidatos de ${empresa.nomeFantasia} no VagaON. ` +
        `O convite vale ${VALIDADE_CONVITE_DIAS} dias.`,
      url: `/convite/${convite.token}`,
    }).catch(() => null);
    emailEnviado = Boolean(r?.ok);
  }

  return {
    convite: {
      id: String(convite._id),
      email,
      nome,
      criadoEm: convite.createdAt.toISOString(),
      expiraEm: convite.expiraEm.toISOString(),
      vencido: false,
      link: linkDoConvite(convite.token),
    },
    emailEnviado,
  };
}

export async function cancelarConvite(empresa: IEmpresa, donoId: string, conviteId: string): Promise<void> {
  exigirDono(empresa, donoId);
  await connectDB();
  const r = await ConviteEmpresa.updateOne(
    { _id: conviteId, empresaId: empresa._id, aceitoEm: null },
    { $set: { canceladoEm: new Date() } }
  );
  if (r.matchedCount === 0) throw new ErroAtor(404, "Convite não encontrado.");
}

export async function removerGerente(empresa: IEmpresa, donoId: string, userId: string): Promise<void> {
  exigirDono(empresa, donoId);
  if (String(userId) === String(empresa.userId)) throw new ErroAtor(400, "O dono não pode ser removido.");
  await connectDB();
  const r = await Empresa.updateOne({ _id: empresa._id }, { $pull: { membros: { userId } } });
  if (r.modifiedCount === 0) throw new ErroAtor(404, "Esta pessoa não está na equipe.");
  // A conta fica, mas sem empresa: se voltar a entrar, cai no perfil vazio.
  await User.updateOne({ _id: userId, profileId: empresa._id }, { $set: { profileId: null } });
}

// ─── Aceite ────────────────────────────────────────────────────────────────

export type EstadoConvite =
  | { estado: "valido"; convite: IConviteEmpresa; empresa: IEmpresa; contaExiste: boolean }
  | { estado: "vencido" | "usado" | "cancelado" | "inexistente" };

export async function consultarConvite(token: string): Promise<EstadoConvite> {
  await connectDB();
  const convite = await ConviteEmpresa.findOne({ token });
  if (!convite) return { estado: "inexistente" };
  if (convite.aceitoEm) return { estado: "usado" };
  if (convite.canceladoEm) return { estado: "cancelado" };
  if (convite.expiraEm.getTime() < Date.now()) return { estado: "vencido" };
  const empresa = await Empresa.findById(convite.empresaId);
  if (!empresa) return { estado: "cancelado" };
  const contaExiste = Boolean(await User.exists({ email: convite.email }));
  return { estado: "valido", convite, empresa, contaExiste };
}

/**
 * Aceita o convite. Sem conta: cria User (role empresa) com nome e senha.
 * Com conta do mesmo e-mail: vincula, desde que seja conta de empresa sem
 * outra empresa. Devolve o e-mail para o cliente fazer o login.
 */
export async function aceitarConvite(
  token: string,
  entrada: { nome?: string; senha?: string }
): Promise<{ email: string; contaCriada: boolean; empresaNome: string }> {
  const c = await consultarConvite(token);
  if (c.estado !== "valido") {
    const motivo: Record<string, string> = {
      vencido: "Este convite venceu. Peça um novo ao dono da empresa.",
      usado: "Este convite já foi usado.",
      cancelado: "Este convite foi cancelado.",
      inexistente: "Convite não encontrado.",
    };
    throw new ErroAtor(410, motivo[c.estado]);
  }
  const { convite, empresa } = c;

  if ((empresa.membros?.length ?? 0) >= MAX_MEMBROS) {
    throw new ErroAtor(400, "A equipe desta empresa já está cheia.");
  }

  let userId: mongoose.Types.ObjectId;
  let contaCriada = false;

  const existente = await User.findOne({ email: convite.email });
  if (existente) {
    if (existente.role !== "empresa") {
      throw new ErroAtor(409, "Este e-mail já tem conta de outro tipo no VagaON. Peça um convite para outro e-mail.");
    }
    if (existente.status === "suspenso") throw new ErroAtor(403, "Esta conta está suspensa.");
    const jaNaEquipe = usuariosDaEmpresa(empresa).includes(String(existente._id));
    if (!jaNaEquipe) {
      const outra = await Empresa.exists({ ...filtroEmpresaDoUsuario(existente._id), _id: { $ne: empresa._id } });
      if (outra) throw new ErroAtor(409, "Esta conta já opera outra empresa.");
    }
    userId = existente._id as mongoose.Types.ObjectId;
    // Conta antiga sem senha (ex.: veio da RedeSA) pode definir uma agora.
    if (!existente.password && entrada.senha) {
      if (entrada.senha.length < 8) throw new ErroAtor(400, "A senha deve ter pelo menos 8 caracteres.");
      existente.password = await bcrypt.hash(entrada.senha, 12);
      await existente.save();
    }
  } else {
    const nome = (entrada.nome ?? convite.nome ?? "").trim();
    const senha = entrada.senha ?? "";
    if (!nome) throw new ErroAtor(400, "Informe seu nome.");
    if (senha.length < 8) throw new ErroAtor(400, "A senha deve ter pelo menos 8 caracteres.");
    const novo = await User.create({
      name: nome,
      email: convite.email,
      password: await bcrypt.hash(senha, 12),
      role: "empresa",
      status: "ativo",
      profileId: empresa._id,
      origemCadastro: "convite-equipe",
    });
    userId = novo._id as mongoose.Types.ObjectId;
    contaCriada = true;
  }

  if (String(userId) !== String(empresa.userId)) {
    await Empresa.updateOne(
      { _id: empresa._id, "membros.userId": { $ne: userId } },
      { $push: { membros: { userId, papel: "gerente", convidadoPor: convite.convidadoPor, desde: new Date() } } }
    );
  }
  await User.updateOne({ _id: userId }, { $set: { profileId: empresa._id } });
  await ConviteEmpresa.updateOne({ _id: convite._id }, { $set: { aceitoEm: new Date(), aceitoPor: userId } });

  return { email: convite.email, contaCriada, empresaNome: empresa.nomeFantasia };
}
