import mongoose, { Schema, Document, Model } from "mongoose";

export type LadoSwipe = "profissional" | "empresa";
export type DirecaoSwipe = "like" | "pass" | "super";

/**
 * Registro de cada decisão no deck. É um log append-only: nunca se edita um
 * swipe, só se cria outro. É daqui que saem as métricas de conversão e a
 * calibragem dos pesos — e a prova de que o ranking não usou critérios
 * indevidos, se algum dia for preciso demonstrar.
 *
 * O par avaliado é sempre (vaga, profissional). `autorTipo` diz qual dos dois
 * lados decidiu.
 */
export interface ISwipe extends Document {
  vagaId: mongoose.Types.ObjectId;
  profissionalId: mongoose.Types.ObjectId;
  /** Dona da vaga — desnormalizado para listar sem populate. */
  empresaId: mongoose.Types.ObjectId;
  autorTipo: LadoSwipe;
  direcao: DirecaoSwipe;
  /** Score no momento do swipe, para análise posterior (o perfil pode mudar). */
  score: number;
  createdAt: Date;
}

const SwipeSchema = new Schema<ISwipe>(
  {
    vagaId: { type: Schema.Types.ObjectId, ref: "Vaga", required: true },
    profissionalId: { type: Schema.Types.ObjectId, ref: "Profissional", required: true },
    empresaId: { type: Schema.Types.ObjectId, ref: "Empresa", required: true },
    autorTipo: { type: String, enum: ["profissional", "empresa"], required: true },
    direcao: { type: String, enum: ["like", "pass", "super"], required: true },
    score: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Um swipe por lado por par: o profissional decide uma vez sobre a vaga,
// a empresa decide uma vez sobre o profissional naquela vaga.
SwipeSchema.index({ vagaId: 1, profissionalId: 1, autorTipo: 1 }, { unique: true });
// Excluir do feed o que o profissional já viu.
SwipeSchema.index({ profissionalId: 1, autorTipo: 1, createdAt: -1 });
// Excluir do deck da empresa quem ela já avaliou naquela vaga.
SwipeSchema.index({ vagaId: 1, autorTipo: 1, direcao: 1 });
// Métricas por empresa.
SwipeSchema.index({ empresaId: 1, createdAt: -1 });

const Swipe: Model<ISwipe> =
  mongoose.models.Swipe ?? mongoose.model<ISwipe>("Swipe", SwipeSchema);

export default Swipe;
