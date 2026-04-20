import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVaga extends Document {
  empresaId: mongoose.Types.ObjectId;
  titulo: string;
  descricao: string;
  requisitos: string;
  tipo: "clt" | "temporario" | "sazonal";
  especialidade: string;
  salario: {
    tipo: "fixo" | "faixa" | "a_combinar";
    min: number | null;
    max: number | null;
    moeda: string;
    periodo: "hora" | "dia" | "mes";
  };
  periodo: {
    dataInicio: Date | null;
    dataFim: Date | null;
  };
  cidade: string;
  estado: string;
  remoto: boolean;
  status: "rascunho" | "ativa" | "pausada" | "encerrada" | "rejeitada";
  motivoRejeicao: string | null;
  aprovadaPorAdmin: boolean;
  totalCandidaturas: number;
  visualizacoes: number;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const VagaSchema = new Schema<IVaga>(
  {
    empresaId: { type: Schema.Types.ObjectId, ref: "Empresa", required: true },
    titulo: { type: String, required: true },
    descricao: { type: String, required: true },
    requisitos: { type: String, default: "" },
    tipo: {
      type: String,
      enum: ["clt", "temporario", "sazonal"],
      required: true,
    },
    especialidade: { type: String, required: true },
    salario: {
      tipo: {
        type: String,
        enum: ["fixo", "faixa", "a_combinar"],
        default: "a_combinar",
      },
      min: { type: Number, default: null },
      max: { type: Number, default: null },
      moeda: { type: String, default: "BRL" },
      periodo: {
        type: String,
        enum: ["hora", "dia", "mes"],
        default: "mes",
      },
    },
    periodo: {
      dataInicio: { type: Date, default: null },
      dataFim: { type: Date, default: null },
    },
    cidade: { type: String, required: true },
    estado: { type: String, required: true },
    remoto: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["rascunho", "ativa", "pausada", "encerrada", "rejeitada"],
      default: "ativa",
    },
    motivoRejeicao: { type: String, default: null },
    aprovadaPorAdmin: { type: Boolean, default: true }, // auto-aprovação no início
    totalCandidaturas: { type: Number, default: 0 },
    visualizacoes: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

VagaSchema.index({ status: 1, estado: 1, especialidade: 1 });
VagaSchema.index({ empresaId: 1 });
VagaSchema.index({ tipo: 1 });
VagaSchema.index({ createdAt: -1 });

const Vaga: Model<IVaga> =
  mongoose.models.Vaga ?? mongoose.model<IVaga>("Vaga", VagaSchema);

export default Vaga;
