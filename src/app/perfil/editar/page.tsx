import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Empresa from "@/models/Empresa";
import Profissional from "@/models/Profissional";
import FormEmpresa from "./FormEmpresa";
import FormProfissional from "./FormProfissional";

export default async function PerfilEditarPage() {
  const session = await auth();
  if (!session) redirect("/entrar");

  await connectDB();

  if (session.user.role === "empresa") {
    const empresa = await Empresa.findOne({ userId: session.user.id }).lean();
    return (
      <FormEmpresa
        profileId={session.user.profileId ?? ""}
        dados={empresa ? JSON.parse(JSON.stringify(empresa)) : null}
      />
    );
  }

  if (session.user.role === "profissional") {
    const profissional = await Profissional.findOne({ userId: session.user.id }).lean();
    return (
      <FormProfissional
        profileId={session.user.profileId ?? ""}
        dados={profissional ? JSON.parse(JSON.stringify(profissional)) : null}
      />
    );
  }

  redirect("/painel");
}
