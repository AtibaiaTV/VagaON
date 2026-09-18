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
  },
  { timestamps: true }
);

// Listagem do admin ordena por data de cadastro; sem índice o sort é em memória.
UserSchema.index({ createdAt: -1 });

const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export default User;
