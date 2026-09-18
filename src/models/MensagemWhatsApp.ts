import mongoose, { Schema, Document, Model } from "mongoose";

export type DirecaoWhatsApp = "saida" | "entrada";
export type StatusWhatsApp = "enviada" | "entregue" | "lida" | "falhou" | "recebida";

/**
 * Registro de cada mensagem trocada com a Cloud API da Meta. Serve para:
 * - casar os status do webhook (entregue/lida/falhou) com o envio original;
 * - guardar o que o usuário respondeu (opt-out, dúvidas);
 * - limitar a resposta automática a uma por dia por telefone.
 * Some sozinho depois de 90 dias.
 */
export interface IMensagemWhatsApp extends Document {
  direcao: DirecaoWhatsApp;
  /** Id da mensagem na Meta (wamid...). Único quando presente. */
  waId: string | null;
  /** Telefone no formato da Meta: 55 + DDD + número, sem "+". */
  telefone: string;
  userId: mongoose.Types.ObjectId | null;
  /** template | texto | auto (resposta automática) | text | button | ... */
  tipo: string;
  texto: string;
  status: StatusWhatsApp;
  erro: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const MensagemWhatsAppSchema = new Schema<IMensagemWhatsApp>(
  {
    direcao: { type: String, enum: ["saida", "entrada"], required: true },
    waId: { type: String, default: null },
    telefone: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    tipo: { type: String, default: "texto", maxlength: 40 },
    texto: { type: String, default: "", maxlength: 2000 },
    status: {
      type: String,
      enum: ["enviada", "entregue", "lida", "falhou", "recebida"],
      required: true,
    },
    erro: { type: String, default: null, maxlength: 500 },
  },
  { timestamps: true }
);

MensagemWhatsAppSchema.index({ waId: 1 }, { unique: true, sparse: true });
MensagemWhatsAppSchema.index({ telefone: 1, createdAt: -1 });
MensagemWhatsAppSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const MensagemWhatsApp: Model<IMensagemWhatsApp> =
  mongoose.models.MensagemWhatsApp ??
  mongoose.model<IMensagemWhatsApp>("MensagemWhatsApp", MensagemWhatsAppSchema);

export default MensagemWhatsApp;
