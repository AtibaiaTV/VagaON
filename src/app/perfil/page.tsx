import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Empresa, { IEmpresa } from "@/models/Empresa";
import Profissional, { IProfissional } from "@/models/Profissional";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ESPECIALIDADES } from "@/constants/especialidades";
import { SETORES } from "@/constants/setores";
import { MapPin, Phone, Globe, Mail, Pencil, Building2, ChefHat } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default async function PerfilPage() {
  const session = await auth();
  if (!session) redirect("/entrar");

  await connectDB();

  if (session.user.role === "empresa") {
    const empresa = await Empresa.findOne({ userId: session.user.id }).lean<IEmpresa>();
    if (!empresa) redirect("/perfil/editar");

    const setor = SETORES.find((s) => s.value === empresa.setor)?.label ?? empresa.setor;

    return (
      <div className="min-h-screen bg-[#f4f7f5]">
        <Navbar />

        {/* Hero */}
        <div style={{ backgroundColor: "#143f28" }} className="relative overflow-hidden py-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.04] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/[0.04] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
          <div className="max-w-3xl mx-auto px-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Perfil da Empresa</h1>
              <p className="text-white/70 text-sm mt-1">{empresa.nomeFantasia}</p>
            </div>
            <Link href="/perfil/editar">
              <Button size="sm" className="bg-white text-[#143f28] hover:bg-white/90 font-semibold gap-2">
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </Link>
          </div>
        </div>

        <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{empresa.nomeFantasia}</h2>
                  {empresa.razaoSocial && (
                    <p className="text-muted-foreground text-sm">{empresa.razaoSocial}</p>
                  )}
                  <Badge variant="secondary" className="mt-2">{setor}</Badge>
                </div>
              </div>

              {empresa.descricao && (
                <p className="mt-4 text-muted-foreground">{empresa.descricao}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                {(empresa.cidade || empresa.estado) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-primary/60" />
                    {[empresa.cidade, empresa.estado].filter(Boolean).join(", ")}
                  </span>
                )}
                {empresa.telefone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4 text-primary/60" />
                    {empresa.telefone}
                  </span>
                )}
                {empresa.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4 text-primary/60" />
                    {empresa.email}
                  </span>
                )}
                {empresa.website && (
                  <span className="flex items-center gap-1">
                    <Globe className="h-4 w-4 text-primary/60" />
                    {empresa.website}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    );
  }

  if (session.user.role === "profissional") {
    const prof = await Profissional.findOne({ userId: session.user.id }).lean<IProfissional>();
    if (!prof) redirect("/perfil/editar");

    const disponTipos = prof.disponibilidade?.tipo ?? [];
    const TIPOS_LABEL: Record<string, string> = {
      clt: "CLT",
      temporario: "Temporário",
      sazonal: "Sazonal",
    };

    return (
      <div className="min-h-screen bg-[#f4f7f5]">
        <Navbar />

        {/* Hero */}
        <div style={{ backgroundColor: "#1a5c38" }} className="relative overflow-hidden py-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.04] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/[0.04] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
          <div className="max-w-3xl mx-auto px-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
              <p className="text-white/70 text-sm mt-1">{prof.nomeCompleto}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-white/60 text-xs">Perfil completo</p>
                <p className="text-xl font-bold text-[#4ade80]">{prof.completude}%</p>
              </div>
              <Link href="/perfil/editar">
                <Button size="sm" className="bg-white text-[#1a5c38] hover:bg-white/90 font-semibold gap-2">
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <ChefHat className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{prof.nomeCompleto}</h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(prof.especialidades ?? []).slice(0, 3).map((e) => (
                      <Badge key={e}>
                        {ESPECIALIDADES.find((esp) => esp.value === e)?.label ?? e}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {(prof.cidade || prof.estado) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-primary/60" />
                        {[prof.cidade, prof.estado].filter(Boolean).join(", ")}
                      </span>
                    )}
                    {prof.telefone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4 text-primary/60" />
                        {prof.telefone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {prof.resumoProfissional && (
                <p className="mt-4 text-muted-foreground text-sm">{prof.resumoProfissional}</p>
              )}
            </CardContent>
          </Card>

          {disponTipos.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Disponibilidade</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {disponTipos.map((t) => (
                    <Badge key={t} variant="outline">{TIPOS_LABEL[t] ?? t}</Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {prof.disponibilidade?.imediata
                    ? "Disponível imediatamente"
                    : `Disponível a partir de ${prof.disponibilidade?.dataDisponivel}`}
                </p>
              </CardContent>
            </Card>
          )}

          {(prof.experiencias ?? []).length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Experiências</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {prof.experiencias.map((exp, i) => (
                  <div key={i} className={i > 0 ? "pt-4 border-t" : ""}>
                    <p className="font-semibold">{exp.cargo}</p>
                    <p className="text-sm text-muted-foreground">
                      {exp.empresa} · {[exp.cidade, exp.estado].filter(Boolean).join(", ")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {exp.dataInicio?.toString().slice(0, 7)} — {exp.dataFim ? exp.dataFim.toString().slice(0, 7) : "Atual"}
                    </p>
                    {exp.descricao && <p className="text-sm mt-2">{exp.descricao}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {(prof.habilidades ?? []).length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Habilidades</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {prof.habilidades.map((h) => (
                    <Badge key={h} variant="secondary">{h}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </main>

        <Footer />
      </div>
    );
  }

  redirect("/painel");
}
