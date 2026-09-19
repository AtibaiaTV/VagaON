import mongoose, { Schema, Document, Model } from "mongoose";

export type AutorHistorico = "empresa" | "admin" | "sistema" | "redesa" | "profissional";

/**
 * Trilha de auditoria da vaga: quem fez o quê e quando. Uma linha por
 * ação (criação, edição com os campos que mudaram, mudança de status,
 * moderação do admin, cron). Não expira: é o histórico.
 */
export interface IHistoricoVaga extends Document {
  vagaId: mongoose.Types.ObjectId;
  em: Date;
  /** criada | editada | status | moderacao | validade | expirada | aviso | excluida | ... */
  acao: string;
  por: {
    tipo: AutorHistorico;
    userId: mongoose.Types.ObjectId | null;
    nome: string;
  };
  /** Frase curta para a tela ("ativa → pausada", "Cron deu validade até 26/09"). */
  detalhes: string;
  /** Campos alterados numa edição. */
  mudancas: { campo: string; de: string; para: string }[];
}

const HistoricoVagaSchema = new Schema<IHistoricoVaga>(
  {
    vagaId: { type: Schema.Types.ObjectId, ref: "Vaga", required: true },
    em: { type: Date, default: Date.now },
    acao: { type: String, required: true, maxlength: 40 },
    por: {
      tipo: { type: String, enum: ["empresa", "admin", "sistema", "redesa", "profissional"], required: true },
      userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
      nome: { type: String, default: "" },
    },
    detalhes: { type: String, default: "", maxlength: 1000 },
    mudancas: {
      type: [
        new Schema(
          { campo: { type: String }, de: { type: String, maxlength: 300 }, para: { type: String, maxlength: 300 } },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { timestamps: false }
);

HistoricoVagaSchema.index({ vagaId: 1, em: -1 });

const HistoricoVaga: Model<IHistoricoVaga> =
  mongoose.models.HistoricoVaga ?? mongoose.model<IHistoricoVaga>("HistoricoVaga", HistoricoVagaSchema);

export default HistoricoVaga;
