import mongoose, { Schema, Document, Model } from "mongoose";

interface IExperiencia {
  _id?: mongoose.Types.ObjectId;
  cargo: string;
  empresa: string;
  cidade: string;
  estado: string;
  dataInicio: Date;
  dataFim: Date | null;
  descricao: string;
}

export interface IProfissional extends Document {
  userId: mongoose.Types.ObjectId;
  nomeCompleto: string;
  cpf: string;
  dataNascimento: Date | null;
  telefone: string;
  fotoPerfil: string | null;
  cidade: string;
  estado: string;
  cep: string;
  dispostoViajar: boolean;
  especialidades: string[];
  resumoProfissional: string;
  disponibilidade: {
    tipo: string[];
    imediata: boolean;
    dataDisponivel: Date | null;
  };
  experiencias: IExperiencia[];
  habilidades: string[];
  completude: number;
  createdAt: Date;
  updatedAt: Date;
}

const ExperienciaSchema = new Schema<IExperiencia>({
  cargo: { type: String, required: true },
  empresa: { type: String, required: true },
  cidade: { type: String, required: true },
  estado: { type: String, required: true },
  dataInicio: { type: Date, required: true },
  dataFim: { type: Date, default: null },
  descricao: { type: String, default: "" },
});

const ProfissionalSchema = new Schema<IProfissional>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    nomeCompleto: { type: String, required: true },
    cpf: { type: String, default: "" },
    dataNascimento: { type: Date, default: null },
    telefone: { type: String, default: "" },
    fotoPerfil: { type: String, default: null },
    cidade: { type: String, default: "" },
    estado: { type: String, default: "" },
    cep: { type: String, default: "" },
    dispostoViajar: { type: Boolean, default: false },
    especialidades: [{ type: String }],
    resumoProfissional: { type: String, default: "" },
    disponibilidade: {
      tipo: [{ type: String, enum: ["clt", "temporario", "sazonal"] }],
      imediata: { type: Boolean, default: true },
      dataDisponivel: { type: Date, default: null },
    },
    experiencias: [ExperienciaSchema],
    habilidades: [{ type: String }],
    completude: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

ProfissionalSchema.index({ estado: 1, especialidades: 1 });
ProfissionalSchema.index({ "disponibilidade.tipo": 1 });

const Profissional: Model<IProfissional> =
  mongoose.models.Profissional ??
  mongoose.model<IProfissional>("Profissional", ProfissionalSchema);

export default Profissional;
