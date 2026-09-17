import mongoose, { Schema, Document, Model } from "mongoose";
import { MAX_TEXTO } from "@/constants/avaliacao";

export type AutorAvaliacao = "empresa" | "profissional";
export type StatusDisputa = "aberta" | "aceita" | "rejeitada";

/**
 * Uma avaliação de um lado sobre o outro, ligada ao vínculo (match contratado
 * pela plataforma). Uma por (match, autor). Publicada quando os dois avaliam
 * ou após a janela duplo-cega; só as publicadas entram na reputação.
 */
export interface IAvaliacao extends Document {
  matchId: mongoose.Types.ObjectId;
  vagaId: mongoose.Types.ObjectId;
  empresaId: mongoose.Types.ObjectId;
  profissionalId: mongoose.Types.ObjectId;
  autorTipo: AutorAvaliacao;
  tipoVinculo: "clt" | "temporario" | "sazonal";
  /** chave do critério → nota 1–5 */
  criterios: Map<string, number>;
  media: number;
  recomendaria: boolean;
  /** Privado ao avaliado. Nunca exibido a terceiros. */
  comentario: string | null;
  publicadaEm: Date | null;
  resposta: { texto: string; em: Date } | null;
  disputa: {
    motivo: string;
    em: Date;
    status: StatusDisputa;
    notaAdmin: string | null;
    resolvidaEm: Date | null;
  } | null;
  /** Disputa aceita: a avaliação sai da reputação e da vitrine. */
  excluidaEm: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const AvaliacaoSchema = new Schema<IAvaliacao>(
  {
    matchId: { type: Schema.Types.ObjectId, ref: "Match", required: true },
    vagaId: { type: Schema.Types.ObjectId, ref: "Vaga", required: true },
    empresaId: { type: Schema.Types.ObjectId, ref: "Empresa", required: true },
    profissionalId: { type: Schema.Types.ObjectId, ref: "Profissional", required: true },
    autorTipo: { type: String, enum: ["empresa", "profissional"], required: true },
    tipoVinculo: { type: String, enum: ["clt", "temporario", "sazonal"], required: true },
    criterios: { type: Map, of: Number, required: true },
    media: { type: Number, required: true, min: 1, max: 5 },
    recomendaria: { type: Boolean, required: true },
    comentario: { type: String, default: null, maxlength: MAX_TEXTO },
    publicadaEm: { type: Date, default: null },
    resposta: {
      type: { texto: { type: String, required: true, maxlength: MAX_TEXTO }, em: { type: Date, required: true } },
      default: null,
    },
    disputa: {
      type: {
        motivo: { type: String, required: true, maxlength: MAX_TEXTO },
        em: { type: Date, required: true },
        status: { type: String, enum: ["aberta", "aceita", "rejeitada"], default: "aberta" },
        notaAdmin: { type: String, default: null, maxlength: MAX_TEXTO },
        resolvidaEm: { type: Date, default: null },
      },
      default: null,
    },
    excluidaEm: { type: Date, default: null },
  },
  { timestamps: true }
);

// Uma avaliação por lado por vínculo.
AvaliacaoSchema.index({ matchId: 1, autorTipo: 1 }, { unique: true });
// Reputação e vitrine.
AvaliacaoSchema.index({ profissionalId: 1, autorTipo: 1, publicadaEm: 1, excluidaEm: 1 });
AvaliacaoSchema.index({ empresaId: 1, autorTipo: 1, publicadaEm: 1, excluidaEm: 1 });
// Cron de publicação da janela duplo-cega.
AvaliacaoSchema.index({ publicadaEm: 1, createdAt: 1 });
// Fila de disputas do admin.
AvaliacaoSchema.index({ "disputa.status": 1, "disputa.em": -1 });

const Avaliacao: Model<IAvaliacao> =
  mongoose.models.Avaliacao ?? mongoose.model<IAvaliacao>("Avaliacao", AvaliacaoSchema);

export default Avaliacao;
