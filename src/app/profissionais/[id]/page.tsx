import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Profissional, { IProfissional } from "@/models/Profissional";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ESPECIALIDADES } from "@/constants/especialidades";
import { MapPin, Phone, ArrowLeft, ChefHat } from "lucide-react";

export default async function PerfilProfissionalPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "empresa") redirect("/painel");

  await connectDB();

  const prof = await Profissional.findById(params.id)
    .select("-cpf")
    .lean<IProfissional>();

  if (!prof) notFound();

  const disponTipos = prof.disponibilidade?.tipo ?? [];
  const TIPOS_LABEL: Record<string, string> = { clt: "CLT", temporario: "Temporário", sazonal: "Sazonal" };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/profissionais" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <ChefHat className="h-5 w-5 text-primary" />
          <span className="font-semibold">Perfil do Profissional</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold text-primary">
                  {prof.nomeCompleto.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{prof.nomeCompleto}</h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(prof.especialidades ?? []).map((e) => (
                    <Badge key={e}>
                      {ESPECIALIDADES.find((esp) => esp.value === e)?.label ?? e}
                    </Badge>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {(prof.cidade || prof.estado) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {[prof.cidade, prof.estado].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {prof.telefone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
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
                {prof.disponibilidade?.imediata ? "Disponível imediatamente" : "Disponível em breve"}
              </p>
              {prof.dispostoViajar && (
                <p className="text-sm text-primary mt-1">✓ Disposto(a) a viajar</p>
              )}
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
    </div>
  );
}
