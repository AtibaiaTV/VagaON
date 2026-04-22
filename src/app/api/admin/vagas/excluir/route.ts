import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Vaga from "@/models/Vaga";
import Empresa from "@/models/Empresa";
import mongoose from "mongoose";

// POST /api/admin/vagas/excluir
// body: { ids?: string[], filtros?: { empresa?, titulo?, dataInicio?, dataFim?, status?, tipo? } }
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await req.json() as {
      ids?: string[];
      filtros?: {
        empresa?: string;
        titulo?: string;
        dataInicio?: string;
        dataFim?: string;
        status?: string;
        tipo?: string;
      };
    };

    await connectDB();

    let idsParaExcluir: mongoose.Types.ObjectId[] = [];

    if (body.ids && body.ids.length > 0) {
      idsParaExcluir = body.ids
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
    } else if (body.filtros) {
      const f = body.filtros;
      const query: Record<string, unknown> = {};

      if (f.status)  query.status = f.status;
      if (f.tipo)    query.tipo   = f.tipo;
      if (f.titulo)  query.titulo = { $regex: f.titulo, $options: "i" };

      if (f.dataInicio || f.dataFim) {
        query.createdAt = {};
        if (f.dataInicio) (query.createdAt as Record<string, unknown>).$gte = new Date(f.dataInicio);
        if (f.dataFim) {
          const fim = new Date(f.dataFim);
          fim.setHours(23, 59, 59, 999);
          (query.createdAt as Record<string, unknown>).$lte = fim;
        }
      }

      if (f.empresa) {
        const empresas = await Empresa.find({
          nomeFantasia: { $regex: f.empresa, $options: "i" },
        }).select("_id").lean();
        const empIds = empresas.map((e) => e._id);
        query.empresaId = { $in: empIds };
      }

      const vagas = await Vaga.find(query).select("_id").lean();
      idsParaExcluir = vagas.map((v) => v._id as mongoose.Types.ObjectId);
    }

    if (idsParaExcluir.length === 0) {
      return NextResponse.json({ excluidas: 0 });
    }

    const result = await Vaga.deleteMany({ _id: { $in: idsParaExcluir } });

    return NextResponse.json({ excluidas: result.deletedCount });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

// GET /api/admin/vagas/excluir?empresa=&titulo=&dataInicio=&dataFim=&status=&tipo=
// Retorna vagas que seriam afetadas pelos filtros (preview antes de excluir)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    await connectDB();

    const p = req.nextUrl.searchParams;
    const empresa    = p.get("empresa")    || "";
    const titulo     = p.get("titulo")     || "";
    const dataInicio = p.get("dataInicio") || "";
    const dataFim    = p.get("dataFim")    || "";
    const status     = p.get("status")     || "";
    const tipo       = p.get("tipo")       || "";

    const query: Record<string, unknown> = {};

    if (status)  query.status = status;
    if (tipo)    query.tipo   = tipo;
    if (titulo)  query.titulo = { $regex: titulo, $options: "i" };

    if (dataInicio || dataFim) {
      query.createdAt = {};
      if (dataInicio) (query.createdAt as Record<string, unknown>).$gte = new Date(dataInicio);
      if (dataFim) {
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999);
        (query.createdAt as Record<string, unknown>).$lte = fim;
      }
    }

    let empresaIds: mongoose.Types.ObjectId[] | null = null;
    if (empresa) {
      const emps = await Empresa.find({
        nomeFantasia: { $regex: empresa, $options: "i" },
      }).select("_id nomeFantasia").lean();
      empresaIds = emps.map((e) => e._id as mongoose.Types.ObjectId);
      query.empresaId = { $in: empresaIds };
    }

    const vagas = await Vaga.find(query)
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    const empresaIdsResult = [...new Set(vagas.map((v) => v.empresaId?.toString()))];
    const empresas = await Empresa.find({
      _id: { $in: empresaIdsResult },
    }).select("_id nomeFantasia").lean();
    const empresaMap = Object.fromEntries(empresas.map((e) => [e._id.toString(), e.nomeFantasia]));

    const resultado = vagas.map((v) => ({
      _id:               v._id.toString(),
      titulo:            v.titulo,
      nomeEmpresa:       empresaMap[v.empresaId?.toString()] ?? "—",
      tipo:              v.tipo,
      status:            v.status,
      especialidade:     v.especialidade,
      cidade:            v.cidade,
      estado:            v.estado,
      totalCandidaturas: v.totalCandidaturas,
      createdAt:         v.createdAt,
    }));

    return NextResponse.json(resultado);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
