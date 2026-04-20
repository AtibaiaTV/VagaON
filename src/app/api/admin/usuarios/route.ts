import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    await connectDB();

    const usuarios = await User.find()
      .sort({ createdAt: -1 })
      .select("-password")
      .lean();

    return NextResponse.json(usuarios);
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
