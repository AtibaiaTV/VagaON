import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { planosAtivos, resolverPlano } from "@/lib/planos";
import Candidatura from "@/models/Candidatura";
import Empresa from "@/models/Empresa";
import Match from "@/models/Match";
import User from "@/models/User";
import Vaga from "@/models/Vaga";

export const dynamic = "force-dynamic";

/** Contagem por empresa a partir de um aggregate `$group: { _id: "$empresaId" }`. */
async function contarPorEmpresa(
  modelo: typeof Vaga | typeof Candidatura | typeof Match,
  filtro: Record<string, unknown>
): Promise<Map<string, number>> {
  const linhas = (await modelo.aggregate([{ $match: filtro }, { $group: { _id: "$empresaId", n: { $sum: 1 } } }])) as {
    _id: Types.ObjectId;
    n: number;
  }[];
  return new Map(linhas.map((l) => [String(l._id), l.n]));
}

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    await connectDB();

    const empresas = await Empresa.find().sort({ createdAt: -1 }).lean();

    const userIds = empresas.map((e) => e.userId);
    const [users, vagasAtivas, candidaturas, contratacoes] = await Promise.all([
      User.find({ _id: { $in: userIds } }).select("_id status email").lean(),
      contarPorEmpresa(Vaga, { status: "ativa" }),
      contarPorEmpresa(Candidatura, {}),
      contarPorEmpresa(Match, { contratadoEm: { $ne: null } }),
    ]);
    const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));
    const ativos = planosAtivos();

    const resultado = empresas.map((e) => {
      const id = e._id.toString();
      const plano = resolverPlano(e.assinatura, new Date(), ativos);
      return {
        ...e,
        _id: id,
        userId: e.userId?.toString(),
        userStatus: userMap[e.userId?.toString()]?.status ?? "desconhecido",
        userEmail: userMap[e.userId?.toString()]?.email ?? "",
        // Valor entregue — é o que decide o preço quando os planos ligarem.
        vagasAtivas: vagasAtivas.get(id) ?? 0,
        candidaturas: candidaturas.get(id) ?? 0,
        contratacoes: contratacoes.get(id) ?? 0,
        plano: { plano: plano.plano, motivo: plano.motivo, ate: plano.ate ? plano.ate.toISOString() : null },
        planosAtivos: ativos,
      };
    });

    return NextResponse.json(resultado);
  } catch (err) {
    console.error("[admin/empresas]", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
