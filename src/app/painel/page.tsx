import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { signOut } from "@/lib/auth";

export default async function PainelPage() {
  const session = await auth();

  if (!session) redirect("/entrar");

  const { role, name } = session.user;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header simples */}
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-primary">VagaON</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Olá, {name}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button variant="outline" size="sm" type="submit">
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-2">
          Bem-vindo ao seu painel{role === "empresa" ? " da empresa" : ""}!
        </h1>
        <p className="text-muted-foreground mb-8">
          {role === "profissional"
            ? "Gerencie seu perfil e acompanhe suas candidaturas."
            : role === "empresa"
            ? "Publique vagas e encontre profissionais qualificados."
            : "Painel de administração da plataforma."}
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {role === "profissional" && (
            <>
              <Link href="/perfil/editar">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base">Meu Perfil</CardTitle>
                    <CardDescription>Complete seu currículo para aparecer para as empresas.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/vagas">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base">Buscar Vagas</CardTitle>
                    <CardDescription>Encontre oportunidades de trabalho na sua área.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/candidaturas">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader>
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
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base">Perfil da Empresa</CardTitle>
                    <CardDescription>Complete os dados da sua empresa.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/vagas/nova">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base">Publicar Vaga</CardTitle>
                    <CardDescription>Crie uma nova vaga e encontre candidatos.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/profissionais">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base">Buscar Profissionais</CardTitle>
                    <CardDescription>Acesse o banco de talentos da plataforma.</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </>
          )}

          {role === "admin" && (
            <Link href="/admin">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-base">Administração</CardTitle>
                  <CardDescription>Gerencie usuários, vagas e empresas.</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
