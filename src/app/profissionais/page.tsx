import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Profissional from "@/models/Profissional";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ESPECIALIDADES } from "@/constants/especialidades";
import { MapPin, ArrowLeft, Users } from "lucide-react";

interface IProfissionalLean {
  _id: string;
  nomeCompleto: string;
  especialidades: string[];
  cidade: string;
  estado: string;
  resumoProfissional: string;
  disponibilidade: { tipo: string[]; imediata: boolean };
  completude: number;
}

const DISPON_LABEL: Record<string, string> = {
  clt: "CLT", temporario: "Temporário", sazonal: "Sazonal",
};

export default async function ProfissionaisPage() {
  const session = await auth();
  if (!session || session.user.role !== "empresa") redirect("/painel");

  await connectDB();

  const profissionais = await Profissional.find({})
    .select("-cpf -experiencias -habilidades")
    .sort({ completude: -1, createdAt: -1 })
    .limit(24)
    .lean() as unknown as IProfissionalLean[];

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/painel" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Users className="h-5 w-5 text-primary" />
          <span className="font-semibold">Banco de Profissionais</span>
          <span className="text-sm text-muted-foreground">({profissionais.length} cadastrados)</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {profissionais.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold">Nenhum profissional cadastrado ainda</h2>
            <p className="text-muted-foreground text-sm mt-2">
              Divulgue a plataforma para que profissionais se cadastrem!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profissionais.map((prof) => (
              <Link key={prof._id} href={`/profissionais/${prof._id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">
                          {prof.nomeCompleto.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{prof.nomeCompleto}</p>
                        {(prof.cidade || prof.estado) && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {[prof.cidade, prof.estado].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {prof.especialidades.slice(0, 2).map((e) => (
                        <Badge key={e} variant="secondary" className="text-xs">
                          {ESPECIALIDADES.find((esp) => esp.value === e)?.label ?? e}
                        </Badge>
                      ))}
                      {prof.especialidades.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{prof.especialidades.length - 2}
                        </Badge>
                      )}
                    </div>

                    {prof.resumoProfissional && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {prof.resumoProfissional}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1">
                      {(prof.disponibilidade?.tipo ?? []).map((t) => (
                        <span key={t} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                          {DISPON_LABEL[t] ?? t}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
