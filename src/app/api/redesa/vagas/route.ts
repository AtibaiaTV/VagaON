import { NextRequest, NextResponse } from "next/server";
import { verifyCrossPlatformToken } from "@/lib/cross-platform-auth";
import { connectDB } from "@/lib/db";
import Empresa from "@/models/Empresa";
import Vaga from "@/models/Vaga";
import { ErroAtor } from "@/lib/servicos/erros";
import { garantirContaRedesa } from "@/lib/servicos/sso-redesa";
import { alertarSemFalhar } from "@/lib/servicos/alerta-vaga";
import { inferirEspecialidade } from "@/lib/especialidade-inferida";
import { REDESA, registrarHistoricoVaga } from "@/lib/servicos/historico-vaga";

// GET /api/redesa/vagas — lista vagas do estabelecimento Redesa
export async function GET(req: NextRequest) {
  try {
    const payload = verifyCrossPlatformToken(req.headers.get("authorization"));
    await connectDB();

    const empresa = await Empresa.findOne({ redesaId: payload.establishmentId });
    if (!empresa) {
      return NextResponse.json({ vagas: [], total: 0 });
    }

    const pagina = parseInt(req.nextUrl.searchParams.get("pagina") ?? "1");
    const limite = 12;
    const skip = (pagina - 1) * limite;

    const [vagas, total] = await Promise.all([
      Vaga.find({ empresaId: empresa._id }).sort({ createdAt: -1 }).skip(skip).limit(limite).lean(),
      Vaga.countDocuments({ empresaId: empresa._id }),
    ]);

    return NextResponse.json({ vagas, total, pagina, limite });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

// POST /api/redesa/vagas — cria uma nova vaga
export async function POST(req: NextRequest) {
  try {
    const payload = verifyCrossPlatformToken(req.headers.get("authorization"));
    await connectDB();

    // Garante User + Empresa (o mesmo caminho do SSO), para que o dono
    // consiga entrar depois e gerenciar o que a RedeSA publicou aqui.
    const { empresa } = await garantirContaRedesa(payload);

    const body = await req.json();
    // status e aprovadaPorAdmin sempre forçados — vagas da Redesa são confiáveis.
    // A RedeSA manda a função em texto livre ("Gastronomia"); o motor precisa do value da tabela.
    const vaga = await Vaga.create({
      ...body,
      especialidade: inferirEspecialidade(String(body?.titulo ?? ""), body?.especialidade, body?.especialidade),
      empresaId: empresa._id,
      status: "ativa",
      aprovadaPorAdmin: true,
    });

    await registrarHistoricoVaga(vaga._id, "criada", REDESA, "publicada pela RedeSA");
    await alertarSemFalhar(vaga._id, "redesa");

    return NextResponse.json(vaga, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    const status = err instanceof ErroAtor ? err.status : message.includes("Token") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
