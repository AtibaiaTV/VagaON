import mongoose, { Schema, Document, Model } from "mongoose";

export type CategoriaNotificacao = "match" | "mensagem" | "candidatura" | "sistema";

/**
 * Notificação in-app. É o canal que sempre existe: mesmo sem e-mail, push
 * ou WhatsApp configurados, o sino no Navbar mostra o que aconteceu.
 */
export interface INotificacao extends Document {
  userId: mongoose.Types.ObjectId;
  categoria: CategoriaNotificacao;
  titulo: string;
  corpo: string;
  /** Caminho relativo para onde o clique leva (ex.: /matches/abc). */
  url: string;
  lidaEm: Date | null;
  createdAt: Date;
}

const NotificacaoSchema = new Schema<INotificacao>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    categoria: {
      type: String,
      enum: ["match", "mensagem", "candidatura", "sistema"],
      required: true,
    },
    titulo: { type: String, required: true, maxlength: 200 },
    corpo: { type: String, required: true, maxlength: 1000 },
    url: { type: String, required: true, maxlength: 500 },
    lidaEm: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Lista do sino (mais recentes primeiro) e contagem de não lidas.
NotificacaoSchema.index({ userId: 1, createdAt: -1 });
NotificacaoSchema.index({ userId: 1, lidaEm: 1 });
// Limpeza automática: 90 dias.
NotificacaoSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const Notificacao: Model<INotificacao> =
  mongoose.models.Notificacao ??
  mongoose.model<INotificacao>("Notificacao", NotificacaoSchema);

export default Notificacao;
