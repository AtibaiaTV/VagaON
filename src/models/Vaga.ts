import mongoose, { Schema, Document, Model } from "mongoose";
import { AFIRMATIVA_VALUES, ESCALA_VALUES, TURNO_VALUES } from "@/constants/match";
import { geocodificarCidade } from "@/constants/municipios";
import type { StatusVaga } from "@/lib/vagas-estado";

export interface IVaga extends Document {
  empresaId: mongoose.Types.ObjectId;
  titulo: string;
  descricao: string;
  requisitos: string;
  tipo: "clt" | "temporario" | "sazonal";
  especialidade: string;
  salario: {
    tipo: "fixo" | "faixa" | "a_combinar";
    min: number | null;
    max: number | null;
    moeda: string;
    periodo: "hora" | "dia" | "mes";
  };
  periodo: {
    dataInicio: Date | null;
    dataFim: Date | null;
  };
  cidade: string;
  estado: string;
  remoto: boolean;
  /** Até quantos km da vaga a empresa aceita candidatos; null = sem limite. O motor rebaixa além disso e elimina além de 1,5×. */
  raioKm: number | null;
  /** Ciclo de vida em src/lib/vagas-estado.ts. Só `ativa` aparece no Descobrir e no site. */
  status: StatusVaga;
  motivoRejeicao: string | null;
  aprovadaPorAdmin: boolean;
  totalCandidaturas: number;
  visualizacoes: number;
  ultimaVisualizacaoEm: Date | null;
  /** Validade: 60 dias (CLT) ou a data de término (temporária/sazonal). O cron expira. */
  expiresAt: Date | null;
  /** Quando o aviso "expira em 3 dias" foi enviado (uma vez por validade). */
  expiraAvisoEm: Date | null;
  /** Contratações registradas (chat ou funil). Ao atingir `posicoes`, a empresa é avisada. */
  preenchidas: number;
  /** Quando saiu de `ativa` pela última vez (preenchida, encerrada ou expirada). */
  encerradaEm: Date | null;

  // ─── Sinais usados pelo motor de match ──────────────────────────────────────
  /** Especialidades adicionais que a empresa também aceita além da principal. */
  especialidadesAceitas: string[];
  anosExperienciaMin: number;
  /** Lista estruturada — `requisitos` continua sendo o texto livre exibido. */
  habilidadesDesejadas: string[];
  turno: string | null;
  escala: string | null;
  idiomasDesejados: string[];
  /** Quantas posições a vaga tem — limita quantos matches fazem sentido. */
  posicoes: number;
  /** Vaga afirmativa para estes grupos (ver AFIRMATIVAS). Vazio = aberta a todos. */
  afirmativa: string[];
  /** Até 3 perguntas curtas feitas a quem se candidata (respostas ficam na candidatura). */
  perguntasTriagem: string[];
  /** GeoJSON Point [lng, lat]. */
  localizacao: { type: "Point"; coordinates: [number, number] } | null;
  match: {
    ativo: boolean;
    totalLikesRecebidos: number;
    totalMatches: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

const VagaSchema = new Schema<IVaga>(
  {
    empresaId: { type: Schema.Types.ObjectId, ref: "Empresa", required: true },
    titulo: { type: String, required: true },
    descricao: { type: String, required: true },
    requisitos: { type: String, default: "" },
    tipo: {
      type: String,
      enum: ["clt", "temporario", "sazonal"],
      required: true,
    },
    especialidade: { type: String, required: true },
    salario: {
      tipo: {
        type: String,
        enum: ["fixo", "faixa", "a_combinar"],
        default: "a_combinar",
      },
      min: { type: Number, default: null },
      max: { type: Number, default: null },
      moeda: { type: String, default: "BRL" },
      periodo: {
        type: String,
        enum: ["hora", "dia", "mes"],
        default: "mes",
      },
    },
    periodo: {
      dataInicio: { type: Date, default: null },
      dataFim: { type: Date, default: null },
    },
    cidade: { type: String, required: true },
    estado: { type: String, required: true },
    remoto: { type: Boolean, default: false },
    raioKm: { type: Number, default: null, min: 1, max: 1000 },
    status: {
      type: String,
      enum: ["rascunho", "ativa", "pausada", "preenchida", "encerrada", "expirada", "rejeitada"],
      default: "ativa",
    },
    motivoRejeicao: { type: String, default: null },
    aprovadaPorAdmin: { type: Boolean, default: true }, // auto-aprovação no início
    totalCandidaturas: { type: Number, default: 0 },
    visualizacoes: { type: Number, default: 0 },
    /** Última vez que alguém que não é a empresa dona abriu a vaga. */
    ultimaVisualizacaoEm: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    expiraAvisoEm: { type: Date, default: null },
    preenchidas: { type: Number, default: 0, min: 0 },
    encerradaEm: { type: Date, default: null },

    // ─── Sinais usados pelo motor de match ────────────────────────────────────
    especialidadesAceitas: [{ type: String }],
    anosExperienciaMin: { type: Number, default: 0, min: 0 },
    habilidadesDesejadas: [{ type: String }],
    turno: { type: String, enum: [...TURNO_VALUES, null], default: null },
    escala: { type: String, enum: [...ESCALA_VALUES, null], default: null },
    idiomasDesejados: [{ type: String }],
    posicoes: { type: Number, default: 1, min: 1 },
    afirmativa: [{ type: String, enum: AFIRMATIVA_VALUES }],
    perguntasTriagem: [{ type: String, maxlength: 200 }],
    // Sem defaults de propósito: um `{ type: "Point" }` sem coordinates quebra
    // o índice 2dsphere. O pre-save abaixo preenche o objeto inteiro ou null.
    localizacao: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number], default: undefined }, // [lng, lat]
    },
    match: {
      ativo: { type: Boolean, default: true },
      totalLikesRecebidos: { type: Number, default: 0 },
      totalMatches: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

VagaSchema.index({ status: 1, estado: 1, especialidade: 1 });
VagaSchema.index({ empresaId: 1 });
VagaSchema.index({ tipo: 1 });
VagaSchema.index({ createdAt: -1 });
// Pré-filtro geográfico do feed.
VagaSchema.index({ localizacao: "2dsphere" });
// Deck do profissional: vagas ativas e abertas ao match.
VagaSchema.index({ status: 1, "match.ativo": 1, especialidade: 1 });
// Cron de expiração.
VagaSchema.index({ status: 1, expiresAt: 1 });

// Mantém as coordenadas sincronizadas com cidade/estado.
// (Mongoose 9: middleware é async, sem callback `next`.)
VagaSchema.pre("save", async function () {
  if (this.isModified("cidade") || this.isModified("estado") || !this.localizacao?.coordinates) {
    const coords = geocodificarCidade(this.cidade, this.estado);
    this.localizacao = coords
      ? { type: "Point", coordinates: [coords.lng, coords.lat] }
      : null;
  }
});

// Edição de vaga e upsert da Redesa usam findOneAndUpdate, que não passa pelo
// pre-save. Este hook recalcula a geo quando cidade/estado vêm no update.
VagaSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() as Record<string, unknown> | null;
  if (!update || Array.isArray(update)) return;

  const set = (update.$set ?? update) as Record<string, unknown>;
  const setOnInsert = (update.$setOnInsert ?? {}) as Record<string, unknown>;
  const cidadeNova = (set.cidade ?? setOnInsert.cidade) as string | undefined;
  const estadoNovo = (set.estado ?? setOnInsert.estado) as string | undefined;
  if (cidadeNova === undefined && estadoNovo === undefined) return;

  const atual = cidadeNova === undefined || estadoNovo === undefined
    ? await this.model.findOne(this.getQuery()).select("cidade estado").lean<{ cidade: string; estado: string }>()
    : null;

  const coords = geocodificarCidade(cidadeNova ?? atual?.cidade, estadoNovo ?? atual?.estado);
  this.set({
    localizacao: coords ? { type: "Point", coordinates: [coords.lng, coords.lat] } : null,
  });
});

const Vaga: Model<IVaga> =
  mongoose.models.Vaga ?? mongoose.model<IVaga>("Vaga", VagaSchema);

export default Vaga;
