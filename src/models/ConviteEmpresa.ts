import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Convite para alguém operar uma empresa como gerente. O link
 * /convite/[token] cria a conta (ou vincula a existente) e entra.
 * Vale 7 dias; aceito ou cancelado não pode ser reusado.
 */
export interface IConviteEmpresa extends Document {
  empresaId: mongoose.Types.ObjectId;
  email: string;
  nome: string;
  token: string;
  convidadoPor: mongoose.Types.ObjectId;
  expiraEm: Date;
  aceitoEm: Date | null;
  aceitoPor: mongoose.Types.ObjectId | null;
  canceladoEm: Date | null;
  createdAt: Date;
}

const ConviteEmpresaSchema = new Schema<IConviteEmpresa>(
  {
    empresaId: { type: Schema.Types.ObjectId, ref: "Empresa", required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    nome: { type: String, default: "", maxlength: 120 },
    token: { type: String, required: true, unique: true },
    convidadoPor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expiraEm: { type: Date, required: true },
    aceitoEm: { type: Date, default: null },
    aceitoPor: { type: Schema.Types.ObjectId, ref: "User", default: null },
    canceladoEm: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ConviteEmpresaSchema.index({ empresaId: 1, createdAt: -1 });
// Convites velhos somem sozinhos 90 dias depois de vencer.
ConviteEmpresaSchema.index({ expiraEm: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const ConviteEmpresa: Model<IConviteEmpresa> =
  mongoose.models.ConviteEmpresa ??
  mongoose.model<IConviteEmpresa>("ConviteEmpresa", ConviteEmpresaSchema);

export default ConviteEmpresa;
