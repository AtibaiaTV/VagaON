import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMensagem extends Document {
  matchId: mongoose.Types.ObjectId;
  autorTipo: "profissional" | "empresa" | "sistema";
  /** User._id de quem enviou; null para mensagens do sistema. */
  autorUserId: mongoose.Types.ObjectId | null;
  texto: string;
  lidaEm: Date | null;
  createdAt: Date;
}

const MensagemSchema = new Schema<IMensagem>(
  {
    matchId: { type: Schema.Types.ObjectId, ref: "Match", required: true },
    autorTipo: {
      type: String,
      enum: ["profissional", "empresa", "sistema"],
      required: true,
    },
    autorUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    texto: { type: String, required: true, maxlength: 2000, trim: true },
    lidaEm: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Histórico da conversa em ordem; também serve o polling ("depois de X").
MensagemSchema.index({ matchId: 1, createdAt: 1 });

const Mensagem: Model<IMensagem> =
  mongoose.models.Mensagem ?? mongoose.model<IMensagem>("Mensagem", MensagemSchema);

export default Mensagem;
