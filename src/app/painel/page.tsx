import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { User, Briefcase, ClipboardList, Building2, Plus, Users, ShieldCheck, LayoutDashboard } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default async function PainelPage() {
  const session = await auth();

  if (!session) redirect("/entrar");

  const { role, name } = session.user;

  const titleMap: Record<string, string> = {
    profissional: "Painel do Profissional",
    empresa: "Painel da Empresa",
    admin: "Painel Administrativo",
  };
  const subtitleMap: Record<string, string> = {
    profissional: "Gerencie seu perfil e acompanhe suas candidaturas.",
    empresa: "Publique vagas e encontre profissionais qualificados.",
    admin: "Gerencie usuários, vagas e empresas da plataforma.",
  };

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <Navbar />

      {/* Hero — verde escuro para empresa, verde padrão para outros */}
      <div style={{ backgroundColor: role === "empresa" ? "#143f28" : "#1a5c38" }} className="relative overflow-hidden py-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.04] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/[0.04] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {titleMap[role] ?? "Painel"}
            </h1>
            <p className="text-white/70 text-sm mt-1">
              Olá, {name} — {subtitleMap[role] ?? ""}
            </p>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button
              variant="outline"
              size="sm"
              type="submit"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
            >
              Sair
            </Button>
          </form>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {role === "profissional" && (
            <>
              <Link href="/perfil/editar">
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">Meu Perfil</CardTitle>
                    <CardDescription>Complete seu currículo para aparecer para as empresas.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/vagas">
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">Buscar Vagas</CardTitle>
                    <CardDescription>Encontre oportunidades de trabalho na sua área.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/candidaturas">
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                      <ClipboardList className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">Minhas Candidaturas</CardTitle>
                    <CardDescription>Acompanhe o status das suas candidaturas.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </>
          )}

          {role === "empresa" && (
            <>
              <Link href="/perfil/editar">
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">Perfil da Empresa</CardTitle>
                    <CardDescription>Complete os dados da sua empresa.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/vagas/nova">
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                      <Plus className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">Publicar Vaga</CardTitle>
                    <CardDescription>Crie uma nova vaga e encontre candidatos.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/profissionais">
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">Buscar Profissionais</CardTitle>
                    <CardDescription>Acesse o banco de talentos da plataforma.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/vagas">
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">Minhas Vagas</CardTitle>
                    <CardDescription>Veja e gerencie as vagas publicadas.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </>
          )}

          {role === "admin" && (
            <>
              <Link href="/admin">
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                      <LayoutDashboard className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">Dashboard</CardTitle>
                    <CardDescription>Visualize estatísticas da plataforma.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/admin/usuarios">
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">Usuários</CardTitle>
                    <CardDescription>Gerencie profissionais e empresas cadastrados.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/admin/vagas">
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">Moderação</CardTitle>
                    <CardDescription>Aprove empresas e gerencie vagas publicadas.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
