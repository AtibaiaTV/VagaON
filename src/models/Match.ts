import mongoose, { Schema, Document, Model } from "mongoose";

export type StatusMatch =
  | "novo"
  | "conversando"
  | "entrevista"
  | "contratado"
  | "encerrado";

/**
 * Interesse mútuo confirmado: profissional deu like na vaga E a empresa deu
 * like no profissional para aquela vaga. O Match é também a conversa — não
 * existe coleção separada; as mensagens apontam para cá.
 */
export interface IMatch extends Document {
  vagaId: mongoose.Types.ObjectId;
  profissionalId: mongoose.Types.ObjectId;
  empresaId: mongoose.Types.ObjectId;
  /** Aderência no momento do match. */
  score: number;
  explicacoes: string[];
  status: StatusMatch;
  encerradoPor: "profissional" | "empresa" | "sistema" | null;
  /** Candidatura formal criada junto com o match — mantém o painel e o webhook funcionando. */
  candidaturaId: mongoose.Types.ObjectId | null;
  /** Cópia do que aparece na lista de matches, para não popular 3 coleções por linha. */
  snapshot: {
    vagaTitulo: string;
    empresaNome: string;
    empresaLogo: string | null;
    profissionalNome: string;
    profissionalFoto: string | null;
    cidade: string;
    estado: string;
  };
  ultimaMensagem: {
    texto: string;
    autorTipo: "profissional" | "empresa" | "sistema";
    em: Date;
  } | null;
  naoLidas: {
    profissional: number;
    empresa: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const MatchSchema = new Schema<IMatch>(
  {
    vagaId: { type: Schema.Types.ObjectId, ref: "Vaga", required: true },
    profissionalId: { type: Schema.Types.ObjectId, ref: "Profissional", required: true },
    empresaId: { type: Schema.Types.ObjectId, ref: "Empresa", required: true },
    score: { type: Number, default: 0, min: 0, max: 100 },
    explicacoes: [{ type: String }],
    status: {
      type: String,
      enum: ["novo", "conversando", "entrevista", "contratado", "encerrado"],
      default: "novo",
    },
    encerradoPor: {
      type: String,
      enum: ["profissional", "empresa", "sistema", null],
      default: null,
    },
    candidaturaId: { type: Schema.Types.ObjectId, ref: "Candidatura", default: null },
    snapshot: {
      vagaTitulo: { type: String, default: "" },
      empresaNome: { type: String, default: "" },
      empresaLogo: { type: String, default: null },
      profissionalNome: { type: String, default: "" },
      profissionalFoto: { type: String, default: null },
      cidade: { type: String, default: "" },
      estado: { type: String, default: "" },
    },
    ultimaMensagem: {
      type: {
        texto: { type: String, required: true },
        autorTipo: { type: String, enum: ["profissional", "empresa", "sistema"], required: true },
        em: { type: Date, required: true },
      },
      default: null,
    },
    naoLidas: {
      profissional: { type: Number, default: 0 },
      empresa: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

MatchSchema.index({ vagaId: 1, profissionalId: 1 }, { unique: true });
// Listas de matches ordenadas por atividade, por lado.
MatchSchema.index({ profissionalId: 1, status: 1, updatedAt: -1 });
MatchSchema.index({ empresaId: 1, status: 1, updatedAt: -1 });

const Match: Model<IMatch> =
  mongoose.models.Match ?? mongoose.model<IMatch>("Match", MatchSchema);

export default Match;
