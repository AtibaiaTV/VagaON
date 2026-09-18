import mongoose, { Schema, Document, Model } from "mongoose";
import {
  ESCALA_VALUES,
  NIVEL_IDIOMA_VALUES,
  RAIO_PADRAO_KM,
  TURNO_VALUES,
} from "@/constants/match";
import { geocodificarCidade } from "@/constants/municipios";
import { MODELO_PADRAO, MODELO_VALUES, type ModeloCurriculo } from "@/lib/curriculo";

interface IIdioma {
  idioma: string;
  nivel: string;
}

interface IFormacao {
  curso: string;
  instituicao: string;
  /** Ano de conclusão (texto, para aceitar "cursando"). */
  ano: string;
}

interface IExperiencia {
  _id?: mongoose.Types.ObjectId;
  cargo: string;
  empresa: string;
  cidade: string;
  estado: string;
  dataInicio: Date;
  dataFim: Date | null;
  descricao: string;
}

export interface IProfissional extends Document {
  userId: mongoose.Types.ObjectId;
  nomeCompleto: string;
  cpf: string;
  dataNascimento: Date | null;
  telefone: string;
  fotoPerfil: string | null;
  cidade: string;
  estado: string;
  cep: string;
  /** Endereço residencial. Empresa vê só o bairro; endereço completo é para o admin. */
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  dispostoViajar: boolean;
  especialidades: string[];
  resumoProfissional: string;
  disponibilidade: {
    tipo: string[];
    imediata: boolean;
    dataDisponivel: Date | null;
  };
  experiencias: IExperiencia[];
  /** Graduações, cursos técnicos e cursos livres — aparece no currículo impresso. */
  formacao: IFormacao[];
  habilidades: string[];
  linkedinUrl: string | null;
  curriculoUrl: string | null;
  completude: number;
  /** Vídeo curto de apresentação (Cloudinary). Mostrado às empresas, nunca pontuado. */
  videoApresentacao: { url: string; publicId: string; duracao: number; enviadoEm: Date } | null;
  /** Modelo preferido do currículo para impressão (/perfil/curriculo). */
  curriculoModelo: ModeloCurriculo;
  /** Cor de detalhe escolhida por modelo (hex), ex.: { executivo: "#8e2a3b" }. */
  curriculoCores: Map<string, string>;
  /**
   * Link público do currículo (/cv/[token]) para compartilhar por WhatsApp.
   * Criado sob demanda pelo próprio profissional; `ativo: false` desliga sem
   * perder o token.
   */
  curriculoPublico: { token: string; ativo: boolean; criadoEm: Date } | null;

  // ─── Sinais usados pelo motor de match ──────────────────────────────────────
  /** GeoJSON Point [lng, lat] — permite pré-filtro por raio com índice 2dsphere. */
  localizacao: { type: "Point"; coordinates: [number, number] } | null;
  /** Distância máxima que aceita percorrer até o trabalho, em km. */
  raioKm: number;
  /** Outras cidades em que aceita trabalhar (mudança ou temporada). O motor usa a menor distância entre a vaga e qualquer cidade do profissional. */
  cidadesInteresse: { cidade: string; estado: string; localizacao: { type: "Point"; coordinates: [number, number] } | null }[];
  pretensaoSalarial: {
    min: number | null;
    periodo: "hora" | "dia" | "mes";
  };
  turnos: string[];
  escalas: string[];
  idiomas: IIdioma[];
  /** Derivado de `experiencias` — mantido em campo próprio para pontuar sem recalcular. */
  anosExperiencia: number;
  match: {
    /** Aparece no Descobrir das empresas e no banco de currículos. */
    ativo: boolean;
    /** Por que está pausado (null quando ativo). */
    motivoPausa: "manual" | "contratado" | "inatividade" | null;
    pausadoEm: Date | null;
    /** Última vez que a pessoa usou o app (painel, Descobrir, swipe). */
    ultimaAtividade: Date | null;
    /** Aviso de inatividade enviado; 7 dias depois sem atividade, o cron pausa. */
    avisoInatividadeEm: Date | null;
    /** Último resumo semanal de vagas enviado (cron). */
    resumoSemanalEm: Date | null;
  };
  /** Agregado das avaliações publicadas recebidas de empresas. Recalculado a cada publicação. */
  reputacao: {
    media: number | null;
    total: number;
    recomendacoes: number;
    porCriterio: Map<string, number>;
    pontosFortes: string[];
    atualizadoEm: Date | null;
  };

  createdAt: Date;
  updatedAt: Date;
}

const IdiomaSchema = new Schema<IIdioma>(
  {
    idioma: { type: String, required: true },
    nivel: { type: String, enum: NIVEL_IDIOMA_VALUES, default: "basico" },
  },
  { _id: false }
);

const FormacaoSchema = new Schema<IFormacao>(
  {
    curso: { type: String, required: true },
    instituicao: { type: String, default: "" },
    ano: { type: String, default: "" },
  },
  { _id: false }
);

const ExperienciaSchema = new Schema<IExperiencia>({
  cargo: { type: String, required: true },
  empresa: { type: String, required: true },
  cidade: { type: String, required: true },
  estado: { type: String, required: true },
  dataInicio: { type: Date, required: true },
  dataFim: { type: Date, default: null },
  descricao: { type: String, default: "" },
});

const VideoSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    duracao: { type: Number, default: 0, min: 0 },
    enviadoEm: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ProfissionalSchema = new Schema<IProfissional>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    nomeCompleto: { type: String, required: true },
    cpf: { type: String, default: "" },
    dataNascimento: { type: Date, default: null },
    telefone: { type: String, default: "" },
    fotoPerfil: { type: String, default: null },
    cidade: { type: String, default: "" },
    estado: { type: String, default: "" },
    cep: { type: String, default: "" },
    logradouro: { type: String, default: "" },
    numero: { type: String, default: "" },
    complemento: { type: String, default: "" },
    bairro: { type: String, default: "" },
    dispostoViajar: { type: Boolean, default: false },
    especialidades: [{ type: String }],
    resumoProfissional: { type: String, default: "" },
    disponibilidade: {
      tipo: [{ type: String, enum: ["clt", "temporario", "sazonal"] }],
      imediata: { type: Boolean, default: true },
      dataDisponivel: { type: Date, default: null },
    },
    experiencias: [ExperienciaSchema],
    formacao: { type: [FormacaoSchema], default: [] },
    habilidades: [{ type: String }],
    linkedinUrl: { type: String, default: null },
    curriculoUrl: { type: String, default: null },
    completude: { type: Number, default: 0, min: 0, max: 100 },
    videoApresentacao: { type: VideoSchema, default: null },
    curriculoModelo: { type: String, enum: MODELO_VALUES, default: MODELO_PADRAO },
    curriculoCores: { type: Map, of: String, default: {} },
    curriculoPublico: {
      type: new Schema(
        {
          token: { type: String, required: true },
          ativo: { type: Boolean, default: true },
          criadoEm: { type: Date, default: Date.now },
        },
        { _id: false }
      ),
      default: null,
    },

    // ─── Sinais usados pelo motor de match ────────────────────────────────────
    // Sem defaults de propósito: um `{ type: "Point" }` sem coordinates quebra
    // o índice 2dsphere. O pre-save abaixo preenche o objeto inteiro ou null.
    localizacao: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number], default: undefined }, // [lng, lat]
    },
    raioKm: { type: Number, default: RAIO_PADRAO_KM, min: 1, max: 500 },
    cidadesInteresse: {
      type: [
        new Schema(
          {
            cidade: { type: String, required: true },
            estado: { type: String, required: true },
            localizacao: {
              type: { type: String, enum: ["Point"] },
              coordinates: { type: [Number] },
            },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    pretensaoSalarial: {
      min: { type: Number, default: null },
      periodo: { type: String, enum: ["hora", "dia", "mes"], default: "mes" },
    },
    turnos: [{ type: String, enum: TURNO_VALUES }],
    escalas: [{ type: String, enum: ESCALA_VALUES }],
    idiomas: { type: [IdiomaSchema], default: [] },
    anosExperiencia: { type: Number, default: 0, min: 0 },
    match: {
      ativo: { type: Boolean, default: true },
      motivoPausa: { type: String, enum: ["manual", "contratado", "inatividade", null], default: null },
      pausadoEm: { type: Date, default: null },
      ultimaAtividade: { type: Date, default: null },
      avisoInatividadeEm: { type: Date, default: null },
      resumoSemanalEm: { type: Date, default: null },
    },
    reputacao: {
      media: { type: Number, default: null },
      total: { type: Number, default: 0 },
      recomendacoes: { type: Number, default: 0 },
      porCriterio: { type: Map, of: Number, default: {} },
      pontosFortes: { type: [String], default: [] },
      atualizadoEm: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

ProfissionalSchema.index({ estado: 1, especialidades: 1 });
ProfissionalSchema.index({ "disponibilidade.tipo": 1 });
// Pré-filtro geográfico do feed.
ProfissionalSchema.index({ localizacao: "2dsphere" });
ProfissionalSchema.index({ "cidadesInteresse.localizacao": "2dsphere" });
// Deck da empresa: candidatos ativos de uma especialidade.
ProfissionalSchema.index({ "match.ativo": 1, especialidades: 1 });
// Página pública do currículo (/cv/[token]).
ProfissionalSchema.index({ "curriculoPublico.token": 1 }, { unique: true, sparse: true });

/** Soma os meses de todas as experiências, sem contar sobreposições em dobro. */
export function calcularAnosExperiencia(experiencias: IExperiencia[]): number {
  if (!experiencias?.length) return 0;

  const periodos = experiencias
    .filter((e) => e.dataInicio)
    .map((e) => ({
      inicio: new Date(e.dataInicio).getTime(),
      fim: (e.dataFim ? new Date(e.dataFim) : new Date()).getTime(),
    }))
    .filter((p) => p.fim > p.inicio)
    .sort((a, b) => a.inicio - b.inicio);

  if (!periodos.length) return 0;

  // Mescla intervalos sobrepostos (dois empregos ao mesmo tempo contam uma vez).
  const mesclados: { inicio: number; fim: number }[] = [periodos[0]];
  for (const p of periodos.slice(1)) {
    const ultimo = mesclados[mesclados.length - 1];
    if (p.inicio <= ultimo.fim) ultimo.fim = Math.max(ultimo.fim, p.fim);
    else mesclados.push({ ...p });
  }

  const ms = mesclados.reduce((acc, p) => acc + (p.fim - p.inicio), 0);
  return Math.round((ms / (1000 * 60 * 60 * 24 * 365.25)) * 10) / 10;
}

// Mantém geo e anos de experiência sincronizados sem exigir nada das rotas.
// (Mongoose 9: middleware é async, sem callback `next`.)
ProfissionalSchema.pre("save", async function () {
  if (this.isModified("cidade") || this.isModified("estado") || !this.localizacao?.coordinates) {
    const coords = geocodificarCidade(this.cidade, this.estado);
    this.localizacao = coords
      ? { type: "Point", coordinates: [coords.lng, coords.lat] }
      : null;
  }
  if (this.isModified("experiencias")) {
    this.anosExperiencia = calcularAnosExperiencia(this.experiencias);
  }
});

// As rotas de edição usam findByIdAndUpdate, que não passa pelo pre-save.
// Este hook cobre esse caminho: se cidade/estado/experiencias mudaram no
// update, recalcula os campos derivados e injeta no $set.
ProfissionalSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() as Record<string, unknown> | null;
  if (!update || Array.isArray(update)) return;

  const set = (update.$set ?? update) as Record<string, unknown>;
  const mudouLocal = "cidade" in set || "estado" in set;
  const mudouExp = "experiencias" in set;
  if (!mudouLocal && !mudouExp) return;

  // Precisa dos dois campos para geocodificar; busca o que não veio no update.
  const atual = mudouLocal && !("cidade" in set && "estado" in set)
    ? await this.model.findOne(this.getQuery()).select("cidade estado").lean<{ cidade: string; estado: string }>()
    : null;

  const derivados: Record<string, unknown> = {};

  if (mudouLocal) {
    const cidade = (set.cidade as string | undefined) ?? atual?.cidade;
    const estado = (set.estado as string | undefined) ?? atual?.estado;
    const coords = geocodificarCidade(cidade, estado);
    derivados.localizacao = coords
      ? { type: "Point", coordinates: [coords.lng, coords.lat] }
      : null;
  }

  if (mudouExp) {
    derivados.anosExperiencia = calcularAnosExperiencia(
      (set.experiencias as IExperiencia[]) ?? []
    );
  }

  this.set(derivados);
});

const Profissional: Model<IProfissional> =
  mongoose.models.Profissional ??
  mongoose.model<IProfissional>("Profissional", ProfissionalSchema);

export default Profissional;
