import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEmpresa extends Document {
  userId: mongoose.Types.ObjectId;
  redesaId?: string;
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
  telefone: string;
  email: string;
  website: string | null;
  logo: string | null;
  setor: "restaurante" | "hotel" | "bar" | "eventos" | "outros";
  descricao: string;
  cidade: string;
  estado: string;
  cep: string;
  endereco: string;
  verificada: boolean;
  documentos: string[];
  createdAt: Date;
  updatedAt: Date;
}

const EmpresaSchema = new Schema<IEmpresa>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    redesaId: { type: String, index: true, sparse: true },
    nomeFantasia: { type: String, required: true },
    razaoSocial: { type: String, default: "" },
    cnpj: { type: String, default: "" },
    telefone: { type: String, default: "" },
    email: { type: String, default: "" },
    website: { type: String, default: null },
    logo: { type: String, default: null },
    setor: {
      type: String,
      enum: ["restaurante", "hotel", "bar", "eventos", "outros"],
      default: "outros",
    },
    descricao: { type: String, default: "" },
    cidade: { type: String, default: "" },
    estado: { type: String, default: "" },
    cep: { type: String, default: "" },
    endereco: { type: String, default: "" },
    verificada: { type: Boolean, default: false },
    documentos: [{ type: String }],
  },
  { timestamps: true }
);

EmpresaSchema.index({ estado: 1, setor: 1 });

const Empresa: Model<IEmpresa> =
  mongoose.models.Empresa ?? mongoose.model<IEmpresa>("Empresa", EmpresaSchema);

export default Empresa;
