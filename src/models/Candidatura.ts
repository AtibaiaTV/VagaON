import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICandidatura extends Document {
  vagaId: mongoose.Types.ObjectId;
  profissionalId: mongoose.Types.ObjectId;
  empresaId: mongoose.Types.ObjectId;
  status: "enviada" | "visualizada" | "em_analise" | "aprovada" | "recusada";
  mensagem: string | null;
  notaEmpresa: string | null;
  snapshotProfissional: {
    nomeCompleto: string;
    especialidades: string[];
    cidade: string;
    estado: string;
    fotoPerfil: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CandidaturaSchema = new Schema<ICandidatura>(
  {
    vagaId: { type: Schema.Types.ObjectId, ref: "Vaga", required: true },
    profissionalId: {
      type: Schema.Types.ObjectId,
      ref: "Profissional",
      required: true,
    },
    empresaId: { type: Schema.Types.ObjectId, ref: "Empresa", required: true },
    status: {
      type: String,
      enum: ["enviada", "visualizada", "em_analise", "aprovada", "recusada"],
      default: "enviada",
    },
    mensagem: { type: String, default: null },
    notaEmpresa: { type: String, default: null },
    snapshotProfissional: {
      nomeCompleto: { type: String, required: true },
      especialidades: [{ type: String }],
      cidade: { type: String, default: "" },
      estado: { type: String, default: "" },
      fotoPerfil: { type: String, default: null },
    },
  },
  { timestamps: true }
);

// Impede candidatura duplicada (mesma vaga + mesmo profissional)
CandidaturaSchema.index(
  { vagaId: 1, profissionalId: 1 },
  { unique: true }
);
CandidaturaSchema.index({ profissionalId: 1, status: 1 });
CandidaturaSchema.index({ empresaId: 1, status: 1 });
CandidaturaSchema.index({ vagaId: 1 });

const Candidatura: Model<ICandidatura> =
  mongoose.models.Candidatura ??
  mongoose.model<ICandidatura>("Candidatura", CandidaturaSchema);

export default Candidatura;
