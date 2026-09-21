import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Profissional from "@/models/Profissional";
import { contarEmpresasPorProfissional } from "@/lib/servicos/interesse";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    await connectDB();

    // Só o que a tela usa. Sem projeção e sem índice, o sort em memória do
    // Mongo estourava os 32 MB (era o "Erro interno" do /admin/usuarios).
    // allowDiskUse cobre o caso de a coleção crescer antes do índice existir.
    const usuarios = await User.find()
      .select("name email role status createdAt profileId origemCadastro")
      .sort({ createdAt: -1 })
      .allowDiskUse(true)
      .lean();

    // Quantas empresas curtiram cada profissional (profileId = Profissional._id)
    // e quando cada profissional usou o VagaON pela última vez.
    const [interesse, profs] = await Promise.all([
      contarEmpresasPorProfissional().catch(() => new Map<string, number>()),
      Profissional.find().select("_id match.ultimaAtividade updatedAt").lean().catch(() => []),
    ]);
    const atividade = new Map(profs.map((p) => [String(p._id), p.match?.ultimaAtividade ?? p.updatedAt ?? null]));
    const resultado = usuarios.map((u) => ({
      ...u,
      empresasInteressadas:
        u.role === "profissional" && u.profileId ? (interesse.get(String(u.profileId)) ?? 0) : null,
      ultimaAtividade: u.role === "profissional" && u.profileId ? (atividade.get(String(u.profileId)) ?? null) : null,
    }));

    return NextResponse.json(resultado);
  } catch (err) {
    // Rota só de admin: a mensagem real ajuda a diagnosticar e não vaza para usuário comum.
    console.error("[admin/usuarios]", err);
    const detalhe = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Erro interno: ${detalhe}` }, { status: 500 });
  }
}
