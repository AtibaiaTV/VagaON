import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { filtroEmpresaDoUsuario, listarEquipe, papelNaEmpresa, MAX_MEMBROS } from "@/lib/servicos/equipe";
import { acessoDaEmpresa } from "@/lib/servicos/planos";
import Empresa from "@/models/Empresa";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import GerenciarEquipe from "./GerenciarEquipe";

export const dynamic = "force-dynamic";

export const metadata = { title: "Equipe — VagaON" };

/**
 * Quem opera a empresa. O dono convida e remove gerentes; o gerente só vê.
 */
export default async function EquipePage() {
  const session = await auth();
  if (!session) redirect("/entrar");
  if (session.user.role !== "empresa") redirect("/painel");

  await connectDB();
  const empresa = await Empresa.findOne(filtroEmpresaDoUsuario(session.user.id));
  if (!empresa) redirect("/perfil/editar");

  const papel = papelNaEmpresa(empresa, session.user.id) ?? "gerente";
  const { membros, convites } = await listarEquipe(empresa);
  const podeConvidar = acessoDaEmpresa(empresa).limites.multiusuario;

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <Navbar />

      <div style={{ backgroundColor: "#143f28" }} className="relative overflow-hidden py-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.04] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Equipe</h1>
            <p className="text-white/70 text-sm mt-1">{empresa.nomeFantasia}</p>
          </div>
          <Link href="/perfil">
            <Button size="sm" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white gap-2">
              <ArrowLeft className="h-4 w-4" />
              Perfil
            </Button>
          </Link>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <GerenciarEquipe
          papel={papel}
          meuId={session.user.id}
          membrosIniciais={membros}
          convitesIniciais={convites}
          podeConvidar={podeConvidar}
          maxMembros={MAX_MEMBROS}
        />
      </main>

      <Footer />
    </div>
  );
}
