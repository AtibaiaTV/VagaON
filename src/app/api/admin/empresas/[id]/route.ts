import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { diasAFrente } from "@/lib/planos";
import Empresa from "@/models/Empresa";
import User from "@/models/User";

const ACOES_PLANO = ["pro30", "pro365", "trial60", "gratis"] as const;
type AcaoPlano = (typeof ACOES_PLANO)[number];

/**
 * Venda manual, enquanto não há provedor de pagamento: o admin concede Pro
 * por 30 dias ou 1 ano, trial de 60 dias, ou volta ao Grátis.
 */
function atualizacaoDePlano(acao: AcaoPlano): Record<string, unknown> {
  const agora = new Date();
  const base = { "assinatura.provedor": "manual", "assinatura.referenciaExterna": null, "assinatura.atualizadoEm": agora };
  switch (acao) {
    case "pro30":
      return { ...base, "assinatura.plano": "pro", "assinatura.status": "ativa", "assinatura.ativoAte": diasAFrente(30, agora) };
    case "pro365":
      return { ...base, "assinatura.plano": "pro", "assinatura.status": "ativa", "assinatura.ativoAte": diasAFrente(365, agora) };
    case "trial60":
      return { ...base, "assinatura.plano": "gratis", "assinatura.status": "trial", "assinatura.trialAte": diasAFrente(60, agora) };
    case "gratis":
      return {
        ...base,
        "assinatura.plano": "gratis",
        "assinatura.status": "cancelada",
        "assinatura.ativoAte": null,
        "assinatura.trialAte": null,
      };
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { verificada, userStatus, acaoPlano } = await req.json();

    await connectDB();

    const atualizacao: Record<string, unknown> = {};
    if (verificada !== undefined) atualizacao.verificada = verificada;
    if (acaoPlano !== undefined) {
      if (!ACOES_PLANO.includes(acaoPlano)) return NextResponse.json({ error: "Ação de plano inválida." }, { status: 400 });
      Object.assign(atualizacao, atualizacaoDePlano(acaoPlano));
    }

    const empresa = await Empresa.findByIdAndUpdate(
      params.id,
      { $set: atualizacao },
      { new: true }
    ).lean();

    if (!empresa) {
      return NextResponse.json({ error: "Empresa não encontrada." }, { status: 404 });
    }

    // Optionally update the linked user's status (ativo/suspenso)
    if (userStatus && ["ativo", "suspenso", "pendente"].includes(userStatus)) {
      await User.findByIdAndUpdate(empresa.userId, { $set: { status: userStatus } });
    }

    return NextResponse.json(empresa);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
