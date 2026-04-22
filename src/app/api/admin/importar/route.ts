import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

// ── helpers ───────────────────────────────────────────────────────────────────

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function mapSetor(classificacao: string): string {
  const c = classificacao.toLowerCase();
  if (c.includes("restaurante") || c.includes("lanchonete") || c.includes("café") ||
      c.includes("cafe") || c.includes("doceria") || c.includes("confeit") ||
      c.includes("bistrô") || c.includes("bistro") || c.includes("pizz") ||
      c.includes("churrascaria") || c.includes("grill")) return "restaurante";
  if (c.includes("bar") || c.includes("pub") || c.includes("chop") ||
      c.includes("cervej") || c.includes("cachac")) return "bar";
  if (c.includes("evento")) return "eventos";
  if (c.includes("hotel") || c.includes("pousada") || c.includes("resort") ||
      c.includes("camping") || c.includes("chalé") || c.includes("hosped")) return "hotel";
  return "outros";
}

function mapTipo(contrato: string): "clt" | "temporario" | "sazonal" {
  const c = contrato.toLowerCase();
  if (c.includes("sazonal")) return "sazonal";
  if (c.includes("tempor")) return "temporario";
  return "clt";
}

function parseSalario(remuneracao: string) {
  if (!remuneracao || remuneracao.trim().toLowerCase() === "a combinar") {
    return { tipo: "a_combinar", min: null, max: null, moeda: "BRL", periodo: "mes" };
  }
  const match = remuneracao.match(/R\$\s*([\d.,]+)\s*[–—\-]+\s*R\$\s*([\d.,]+)/);
  if (match) {
    const toNum = (s: string) => parseFloat(s.replace(/\./g, "").replace(",", "."));
    return { tipo: "faixa", min: toNum(match[1]), max: toNum(match[2]), moeda: "BRL", periodo: "mes" };
  }
  return { tipo: "a_combinar", min: null, max: null, moeda: "BRL", periodo: "mes" };
}

// ── CSV parser simples ────────────────────────────────────────────────────────

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(Boolean);
  if (lines.length < 2) return [];

  function splitLine(line: string): string[] {
    const fields: string[] = [];
    let current = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { current += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    return fields;
  }

  const headers = splitLine(lines[0]).map((h) => h.replace(/^"|"$/g, "").trim());

  // mapeamento flexível de colunas
  function col(row: string[], keywords: string[]): string {
    for (const kw of keywords) {
      const idx = headers.findIndex((h) => h.toLowerCase().includes(kw.toLowerCase()));
      if (idx !== -1) return row[idx] ?? "";
    }
    return "";
  }

  return lines.slice(1).map((line) => {
    const row = splitLine(line);
    return {
      nomeFantasia:  col(row, ["Nome Fantasia", "nome fantasia"]),
      razaoSocial:   col(row, ["Razão Social", "razao social"]),
      cnpj:          col(row, ["CNPJ"]),
      classificacao: col(row, ["Classificação", "Classificacao"]),
      descricao:     col(row, ["Descrição da Empresa", "descricao da empresa"]),
      telefone:      col(row, ["Telefone"]),
      email:         col(row, ["Email de Contato", "email"]),
      site:          col(row, ["Site"]),
      cidade:        col(row, ["Cidade"]),
      estado:        col(row, ["Estado"]),
      cep:           col(row, ["CEP"]),
      endereco:      col(row, ["Endereço", "Endereco"]),
      tituloVaga:    col(row, ["Titulo da Vaga", "título da vaga"]),
      tipoContrato:  col(row, ["Tipo de Contrato"]),
      especialidade: col(row, ["Especialidade"]),
      descricaoVaga: col(row, ["Descrição da Vaga", "descricao da vaga"]),
      requisitos:    col(row, ["Requisitos"]),
      remuneracao:   col(row, ["Remuneração", "Remuneracao"]),
      remoto:        col(row, ["remoto", "distância", "distancia"]),
    };
  }).filter((r) => r.nomeFantasia);
}

// ── POST /api/admin/importar ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("arquivo") as File | null;
  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });

  const text = await file.text();
  const registros = parseCSV(text);
  if (registros.length === 0) {
    return NextResponse.json({ error: "Nenhum registro encontrado no CSV." }, { status: 400 });
  }

  await connectDB();
  const client = new MongoClient(process.env.MONGODB_URI!);
  const senhaHash = await bcrypt.hash("VagaON@2025", 10);

  const resultados: { nome: string; status: "criado" | "pulado" | "erro"; detalhe?: string }[] = [];

  try {
    await client.connect();
    const db = client.db();
    const users    = db.collection("users");
    const empresas = db.collection("empresas");
    const vagas    = db.collection("vagas");

    for (const r of registros) {
      try {
        const emailBase = r.email || `${slugify(r.nomeFantasia)}@import.vagaon.com.br`;
        const email = emailBase.toLowerCase();

        const existente = await users.findOne({ email });
        if (existente) {
          resultados.push({ nome: r.nomeFantasia, status: "pulado", detalhe: "e-mail já cadastrado" });
          continue;
        }

        const userId    = new ObjectId();
        const empresaId = new ObjectId();

        await users.insertOne({
          _id: userId, name: r.nomeFantasia, email,
          emailVerified: null, image: null, password: senhaHash,
          role: "empresa", profileId: empresaId, status: "ativo",
          createdAt: new Date(), updatedAt: new Date(),
        });

        await empresas.insertOne({
          _id: empresaId, userId,
          nomeFantasia: r.nomeFantasia,
          razaoSocial:  r.razaoSocial  || "",
          cnpj:         r.cnpj         || "",
          telefone:     r.telefone     || "",
          email:        r.email        || "",
          website:      r.site         || null,
          logo:         null,
          setor:        mapSetor(r.classificacao),
          descricao:    r.descricao    || "",
          cidade:       r.cidade       || "Atibaia",
          estado:       r.estado       || "SP",
          cep:          r.cep          || "",
          endereco:     r.endereco     || "",
          verificada:   false,
          documentos:   [],
          createdAt: new Date(), updatedAt: new Date(),
        });

        await vagas.insertOne({
          _id: new ObjectId(), empresaId,
          titulo:        r.tituloVaga    || "Vaga em aberto",
          descricao:     r.descricaoVaga || "",
          requisitos:    r.requisitos    || "",
          tipo:          mapTipo(r.tipoContrato),
          especialidade: r.especialidade || "outro",
          salario:       parseSalario(r.remuneracao),
          periodo:       { dataInicio: null, dataFim: null },
          cidade:        r.cidade  || "Atibaia",
          estado:        r.estado  || "SP",
          remoto:        r.remoto?.toUpperCase() === "S",
          status:        "ativa",
          motivoRejeicao:   null,
          aprovadaPorAdmin: true,
          totalCandidaturas: 0,
          visualizacoes:    0,
          expiresAt:        null,
          createdAt: new Date(), updatedAt: new Date(),
        });

        resultados.push({ nome: r.nomeFantasia, status: "criado", detalhe: email });
      } catch (err: unknown) {
        resultados.push({
          nome: r.nomeFantasia,
          status: "erro",
          detalhe: err instanceof Error ? err.message : "erro desconhecido",
        });
      }
    }
  } finally {
    await client.close();
  }

  const criados = resultados.filter((r) => r.status === "criado").length;
  const pulados = resultados.filter((r) => r.status === "pulado").length;
  const erros   = resultados.filter((r) => r.status === "erro").length;

  return NextResponse.json({ criados, pulados, erros, resultados });
}
