import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Profissional from "@/models/Profissional";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(params.id).select("-password").lean();
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const profissional = await Profissional.findOne({ userId: params.id }).lean();
    if (!profissional) {
      return NextResponse.json({ error: "Perfil profissional não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ user, profissional });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
