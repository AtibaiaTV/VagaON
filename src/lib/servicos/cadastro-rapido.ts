import bcrypt from "bcryptjs";
import { ESPECIALIDADES } from "@/constants/especialidades";
import { ESTADOS } from "@/constants/estados";
import { calcularCompletude } from "@/lib/completude";
import { connectDB } from "@/lib/db";
import { iaConfigurada } from "@/lib/ia/cliente";
import { estruturarVaga } from "@/lib/ia/vaga";
import { notifyRedesaTalento } from "@/lib/redesa-webhook";
import Empresa from "@/models/Empresa";
import Profissional from "@/models/Profissional";
import User from "@/models/User";
import Vaga from "@/models/Vaga";
import { ErroAtor } from "./erros";
import { alertarSemFalhar } from "./alerta-vaga";
import { registrarHistoricoVaga } from "./historico-vaga";
import { enviarCodigoVerificacao } from "./whatsapp-verificacao";

/**
 * Manda o código de confirmação do WhatsApp logo no cadastro: a pessoa
 * acabou de digitar o número e está com o celular na mão. Silencioso — sem
 * canal ligado ou com falha, o painel oferece de novo.
 */
async function confirmarWhatsAppNoCadastro(userId: unknown, role: string) {
  await enviarCodigoVerificacao(String(userId), role, { silencioso: true }).catch(() => null);
}

/**
 * Entrada rápida pelo QR Code ou link: uma tela, quatro ou cinco campos,
 * conta criada e a pessoa já entra logada. Profissional cai no perfil para
 * completar (ou importar o currículo); empresa sai com a primeira vaga no ar.
 */

const UF_VALIDAS = new Set(ESTADOS.map((e) => e.value));
const ESPECIALIDADES_VALIDAS = new Set(ESPECIALIDADES.map((e) => e.value));
const TIPOS_VAGA = new Set(["clt", "temporario", "sazonal"]);

export function texto(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** `?origem=` vira uma etiqueta curta e segura (ex.: "cartaz-balcao"). */
export function normalizarOrigem(v: unknown): string | null {
  const s = texto(v, 60)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-|-$/g, "");
  return s || null;
}

interface Conta {
  nome: string;
  telefone: string;
  email: string;
  senha: string;
  cidade: string;
  estado: string;
}

function validarConta(c: Conta) {
  if (c.nome.length < 2) throw new ErroAtor(400, "Informe o nome.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) throw new ErroAtor(400, "E-mail inválido.");
  if (c.senha.length < 8) throw new ErroAtor(400, "A senha deve ter pelo menos 8 caracteres.");
  const digitos = c.telefone.replace(/\D/g, "");
  if (digitos.length < 10 || digitos.length > 13) throw new ErroAtor(400, "Informe um WhatsApp com DDD.");
  if (!c.cidade) throw new ErroAtor(400, "Informe a cidade.");
  if (!UF_VALIDAS.has(c.estado)) throw new ErroAtor(400, "Informe o estado.");
}

async function garantirEmailLivre(email: string) {
  if (await User.exists({ email })) throw new ErroAtor(409, "Este e-mail já tem conta. Entre para continuar.");
}

export interface EntradaProfissionalRapido extends Conta {
  especialidade: string;
  origem: string | null;
}

export async function criarProfissionalRapido(e: EntradaProfissionalRapido) {
  validarConta(e);
  if (!ESPECIALIDADES_VALIDAS.has(e.especialidade)) throw new ErroAtor(400, "Escolha sua função principal.");
  await connectDB();
  await garantirEmailLivre(e.email);

  const user = await User.create({
    name: e.nome,
    email: e.email,
    password: await bcrypt.hash(e.senha, 12),
    role: "profissional",
    status: "ativo",
    origemCadastro: e.origem,
  });

  const dados = {
    userId: user._id,
    nomeCompleto: e.nome,
    telefone: e.telefone,
    cidade: e.cidade,
    estado: e.estado,
    especialidades: [e.especialidade],
    disponibilidade: { tipo: ["clt", "temporario", "sazonal"], imediata: true, dataDisponivel: null },
    experiencias: [],
    habilidades: [],
  };
  const profissional = await Profissional.create({ ...dados, completude: calcularCompletude(dados) });
  await User.updateOne({ _id: user._id }, { $set: { profileId: profissional._id } });

  await notifyRedesaTalento({ vagaonCandidatoId: String(profissional._id), nome: e.nome, email: e.email, telefone: e.telefone });
  await confirmarWhatsAppNoCadastro(user._id, "profissional");

  return { userId: String(user._id), profissionalId: String(profissional._id) };
}

export interface EntradaEmpresaRapida extends Conta {
  origem: string | null;
  vaga: { texto: string; especialidade: string; tipo: string };
}

/** Sem IA: o texto vira título (primeira frase) e descrição. */
function vagaSimples(v: EntradaEmpresaRapida["vaga"]) {
  const primeira = v.texto.split(/[.\n!?]/)[0]?.trim() || v.texto;
  return {
    titulo: primeira.slice(0, 120),
    descricao: v.texto,
    requisitos: "",
    tipo: v.tipo,
    especialidade: v.especialidade,
  };
}

export async function criarEmpresaRapida(e: EntradaEmpresaRapida) {
  validarConta(e);
  if (e.vaga.texto.length < 8) throw new ErroAtor(400, "Descreva a vaga com um pouco mais de detalhe.");
  if (!ESPECIALIDADES_VALIDAS.has(e.vaga.especialidade)) throw new ErroAtor(400, "Escolha a função da vaga.");
  if (!TIPOS_VAGA.has(e.vaga.tipo)) throw new ErroAtor(400, "Escolha o tipo de contrato.");
  await connectDB();
  await garantirEmailLivre(e.email);

  const user = await User.create({
    name: e.nome,
    email: e.email,
    password: await bcrypt.hash(e.senha, 12),
    role: "empresa",
    status: "ativo",
    origemCadastro: e.origem,
  });
  const empresa = await Empresa.create({
    userId: user._id,
    nomeFantasia: e.nome,
    telefone: e.telefone,
    email: e.email,
    cidade: e.cidade,
    estado: e.estado,
  });
  await User.updateOne({ _id: user._id }, { $set: { profileId: empresa._id } });

  // Com a chave de IA, o texto informal vira anúncio completo; sem ela (ou
  // se a IA falhar), publica o básico e a empresa edita depois.
  let dadosVaga: Record<string, unknown> = vagaSimples(e.vaga);
  let montadaPorIA = false;
  if (iaConfigurada()) {
    try {
      const { dados } = await estruturarVaga(e.vaga.texto, { nomeFantasia: e.nome, cidade: e.cidade, estado: e.estado });
      dadosVaga = {
        titulo: dados.titulo || dadosVaga.titulo,
        descricao: dados.descricao || e.vaga.texto,
        requisitos: dados.requisitos,
        tipo: dados.tipo || e.vaga.tipo,
        especialidade: dados.especialidade || e.vaga.especialidade,
        especialidadesAceitas: dados.especialidadesAceitas,
        salario: { ...dados.salario, moeda: "BRL" },
        periodo: dados.periodo,
        anosExperienciaMin: dados.anosExperienciaMin,
        habilidadesDesejadas: dados.habilidadesDesejadas,
        turno: dados.turno,
        escala: dados.escala,
        posicoes: dados.posicoes,
        afirmativa: dados.afirmativa,
        perguntasTriagem: dados.perguntasTriagem,
      };
      montadaPorIA = true;
    } catch (err) {
      console.warn("[cadastro-rapido] IA indisponível, publicando vaga simples:", err);
    }
  }

  const vaga = await Vaga.create({
    empresaId: empresa._id,
    cidade: e.cidade,
    estado: e.estado,
    remoto: false,
    status: "ativa",
    aprovadaPorAdmin: true,
    ...dadosVaga,
    // Sem prazo, como no formulário: fica no ar até a empresa decidir.
    expiresAt: null,
  });

  await registrarHistoricoVaga(vaga._id, "criada", { tipo: "empresa", userId: user._id, nome: e.nome }, `entrada rápida${montadaPorIA ? " (estruturada por IA)" : ""}`);
  await confirmarWhatsAppNoCadastro(user._id, "empresa");
  await alertarSemFalhar(vaga._id, "entrada-rapida");

  return { userId: String(user._id), empresaId: String(empresa._id), vagaId: String(vaga._id), montadaPorIA };
}
