import mongoose, { Schema, Document, Model } from "mongoose";
import slugify from "slugify";

export interface IEmpresa extends Document {
  userId: mongoose.Types.ObjectId;
  redesaId?: string;
  /** Identificador da página pública (/empresas/[slug]). Gerado do nome; estável depois de criado. */
  slug: string | null;
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
    slug: { type: String, unique: true, sparse: true, default: null },
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

export function slugBase(nome: string): string {
  const s = slugify(nome ?? "", { lower: true, strict: true, locale: "pt", trim: true }).slice(0, 60);
  return s || "empresa";
}

/**
 * Slug único e estável: gerado uma vez a partir do nome fantasia. Mudar o
 * nome depois não muda o slug — links compartilhados continuam valendo.
 * Empresas antigas recebem o seu via src/scripts/backfill-empresas-slug.mjs.
 */
EmpresaSchema.pre("save", async function () {
  if (this.slug || !this.nomeFantasia) return;
  const base = slugBase(this.nomeFantasia);
  const Modelo = this.constructor as Model<IEmpresa>;
  let candidato = base;
  for (let n = 2; await Modelo.exists({ slug: candidato, _id: { $ne: this._id } }); n++) {
    candidato = `${base}-${n}`;
  }
  this.slug = candidato;
});

const Empresa: Model<IEmpresa> =
  mongoose.models.Empresa ?? mongoose.model<IEmpresa>("Empresa", EmpresaSchema);

export default Empresa;
