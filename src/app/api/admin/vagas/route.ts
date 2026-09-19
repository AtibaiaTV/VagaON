import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Vaga from "@/models/Vaga";
import Empresa from "@/models/Empresa";
import { contarInteressadosPorVaga } from "@/lib/servicos/interesse";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    await connectDB();

    const vagas = await Vaga.find().sort({ createdAt: -1 }).lean();

    const empresaIds = vagas.map((v) => v.empresaId);
    const [empresas, interessados] = await Promise.all([
      Empresa.find({ _id: { $in: empresaIds } }).select("_id nomeFantasia").lean(),
      contarInteressadosPorVaga(vagas.map((v) => v._id)),
    ]);
    const empresaMap = Object.fromEntries(
      empresas.map((e) => [e._id.toString(), e.nomeFantasia])
    );

    const resultado = vagas.map((v) => ({
      ...v,
      _id: v._id.toString(),
      empresaId: v.empresaId?.toString(),
      nomeEmpresa: empresaMap[v.empresaId?.toString()] ?? "—",
      interessados: interessados.get(v._id.toString()) ?? 0,
    }));

    return NextResponse.json(resultado);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
