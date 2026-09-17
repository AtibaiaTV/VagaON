import mongoose, { Schema, Document, Model } from "mongoose";

/** Leitura das respostas feita pela IA — apoio à empresa, nunca decisão. */
export interface ITriagemIA {
  resumo: string;
  pontosFortes: string[];
  ressalvas: string[];
  /** 1 a 5. */
  nota: number;
  recomendaEntrevista: boolean;
  modelo: string;
  geradoEm: Date;
}

/** Perguntas da vaga no momento da resposta + o que o candidato respondeu. */
export interface ITriagem {
  perguntas: string[];
  respostas: string[];
  respondidaEm: Date;
  ia: ITriagemIA | null;
}

export interface ICandidatura extends Document {
  vagaId: mongoose.Types.ObjectId;
  profissionalId: mongoose.Types.ObjectId;
  empresaId: mongoose.Types.ObjectId;
  status: "enviada" | "visualizada" | "em_analise" | "entrevista" | "aprovada" | "recusada";
  mensagem: string | null;
  notaEmpresa: string | null;
  snapshotProfissional: {
    nomeCompleto: string;
    especialidades: string[];
    cidade: string;
    estado: string;
    fotoPerfil: string | null;
  };
  triagem: ITriagem | null;
  createdAt: Date;
  updatedAt: Date;
}

const TriagemIASchema = new Schema<ITriagemIA>(
  {
    resumo: { type: String, default: "" },
    pontosFortes: { type: [String], default: [] },
    ressalvas: { type: [String], default: [] },
    nota: { type: Number, min: 1, max: 5, default: 3 },
    recomendaEntrevista: { type: Boolean, default: false },
    modelo: { type: String, default: "" },
    geradoEm: { type: Date, default: Date.now },
  },
  { _id: false }
);

const TriagemSchema = new Schema<ITriagem>(
  {
    perguntas: { type: [String], default: [] },
    respostas: { type: [String], default: [] },
    respondidaEm: { type: Date, default: Date.now },
    ia: { type: TriagemIASchema, default: null },
  },
  { _id: false }
);

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
      enum: ["enviada", "visualizada", "em_analise", "entrevista", "aprovada", "recusada"],
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
    triagem: { type: TriagemSchema, default: null },
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
