import { NextRequest, NextResponse } from "next/server";
import { verifyCrossPlatformToken } from "@/lib/cross-platform-auth";
import { connectDB } from "@/lib/db";
import Empresa from "@/models/Empresa";
import Vaga from "@/models/Vaga";

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

    // Auto-provisiona a Empresa se ainda não existir no VagaON
    let empresa = await Empresa.findOne({ redesaId: payload.establishmentId });
    if (!empresa) {
      empresa = await Empresa.create({
        redesaId: payload.establishmentId,
        nomeFantasia: payload.establishmentName,
        razaoSocial: payload.establishmentName,
        email: payload.email ?? "",
        telefone: payload.phone ?? "",
        cidade: payload.city ?? "",
        estado: payload.state,
        setor: mapCategory(payload.category),
        userId: new (await import("mongoose")).default.Types.ObjectId(),
      });
    }

    const body = await req.json();
    const vaga = await Vaga.create({ ...body, empresaId: empresa._id });

    return NextResponse.json(vaga, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    const status = message.includes("Token") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

function mapCategory(category?: string): "restaurante" | "hotel" | "bar" | "eventos" | "outros" {
  if (!category) return "outros";
  const map: Record<string, "restaurante" | "hotel" | "bar" | "eventos" | "outros"> = {
    gastronomy: "restaurante",
    accommodation: "hotel",
  };
  return map[category] ?? "outros";
}
