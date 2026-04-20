import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Empresa from "@/models/Empresa";
import Profissional from "@/models/Profissional";
import Vaga from "@/models/Vaga";
import Candidatura from "@/models/Candidatura";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    await connectDB();

    const [totalUsuarios, totalEmpresas, totalProfissionais, totalVagas, totalVagasAtivas, totalCandidaturas] =
      await Promise.all([
        User.countDocuments(),
        Empresa.countDocuments(),
        Profissional.countDocuments(),
        Vaga.countDocuments(),
        Vaga.countDocuments({ status: "ativa" }),
        Candidatura.countDocuments(),
      ]);

    return NextResponse.json({
      totalUsuarios,
      totalEmpresas,
      totalProfissionais,
      totalVagas,
      totalVagasAtivas,
      totalCandidaturas,
    });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
