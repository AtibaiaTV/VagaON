import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Empresa from "@/models/Empresa";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    await connectDB();

    const empresas = await Empresa.find().sort({ createdAt: -1 }).lean();

    // Enrich with user status
    const userIds = empresas.map((e) => e.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select("_id status email")
      .lean();
    const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

    const resultado = empresas.map((e) => ({
      ...e,
      _id: e._id.toString(),
      userId: e.userId?.toString(),
      userStatus: userMap[e.userId?.toString()]?.status ?? "desconhecido",
      userEmail: userMap[e.userId?.toString()]?.email ?? "",
    }));

    return NextResponse.json(resultado);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
