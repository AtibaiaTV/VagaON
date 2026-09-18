import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { iaConfigurada } from "@/lib/ia/cliente";
import Empresa from "@/models/Empresa";
import Profissional from "@/models/Profissional";
import User from "@/models/User";
import FormEmpresa from "./FormEmpresa";
import FormProfissional from "./FormProfissional";
import { filtroEmpresaDoUsuario } from "@/lib/servicos/equipe";

export default async function PerfilEditarPage({ searchParams }: { searchParams: { boasvindas?: string } }) {
  const session = await auth();
  if (!session) redirect("/entrar");

  await connectDB();

  // Conta criada pelo SSO da RedeSA nasce sem senha; o cartão do perfil oferece definir uma.
  const usuario = await User.findById(session.user.id).select("password").lean();
  const temSenha = Boolean(usuario?.password);

  if (session.user.role === "empresa") {
    // A empresa vem do banco, não do JWT: gerente convidado depois do login
    // e dono que trocou de conta continuam apontando para a empresa certa.
    const empresa = await Empresa.findOne(filtroEmpresaDoUsuario(session.user.id)).lean();
    return (
      <FormEmpresa
        profileId={empresa ? String(empresa._id) : session.user.profileId ?? ""}
        dados={empresa ? JSON.parse(JSON.stringify(empresa)) : null}
        temSenha={temSenha}
      />
    );
  }

  if (session.user.role === "profissional") {
    const profissional = await Profissional.findOne({ userId: session.user.id }).lean();
    return (
      <FormProfissional
        profileId={session.user.profileId ?? ""}
        dados={profissional ? JSON.parse(JSON.stringify(profissional)) : null}
        iaDisponivel={iaConfigurada()}
        boasVindas={searchParams.boasvindas === "1"}
        temSenha={temSenha}
      />
    );
  }

  redirect("/painel");
}
