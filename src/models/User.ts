import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  password: string | null;
  role: "profissional" | "empresa" | "admin";
  profileId: mongoose.Types.ObjectId | null;
  status: "pendente" | "ativo" | "suspenso";
  /** Canais que o usuário aceita receber. A notificação in-app não é opcional. */
  notificacoes: {
    email: boolean;
    whatsapp: boolean;
    push: boolean;
  };
  /** De onde veio o cadastro (QR do cartaz, link do Instagram…) — `?origem=` na entrada rápida. */
  origemCadastro: string | null;
  /** Confirmação do número de WhatsApp por código (ver servicos/whatsapp-verificacao.ts). */
  whatsapp: {
    /** Número confirmado (55+DDD+número) e quando. null = nunca confirmou. */
    numeroVerificado: string | null;
    verificadoEm: Date | null;
    codigoHash: string | null;
    codigoExpiraEm: Date | null;
    tentativas: number;
    enviadoEm: Date | null;
    /** Envios no dia (limite anti-abuso); `enviosDia` é a data (AAAA-MM-DD) do contador. */
    envios: number;
    enviosDia: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    emailVerified: { type: Date, default: null },
    image: { type: String, default: null },
    password: { type: String, default: null },
    role: {
      type: String,
      enum: ["profissional", "empresa", "admin"],
      required: true,
    },
    profileId: { type: Schema.Types.ObjectId, default: null },
    status: {
      type: String,
      enum: ["pendente", "ativo", "suspenso"],
      default: "ativo",
    },
    notificacoes: {
      email: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    },
    origemCadastro: { type: String, default: null },
    whatsapp: {
      numeroVerificado: { type: String, default: null },
      verificadoEm: { type: Date, default: null },
      codigoHash: { type: String, default: null },
      codigoExpiraEm: { type: Date, default: null },
      tentativas: { type: Number, default: 0 },
      enviadoEm: { type: Date, default: null },
      envios: { type: Number, default: 0 },
      enviosDia: { type: String, default: null },
    },
  },
  { timestamps: true }
);

// Listagem do admin ordena por data de cadastro; sem índice o sort é em memória.
UserSchema.index({ createdAt: -1 });

const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export default User;
