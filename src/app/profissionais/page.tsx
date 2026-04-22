import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Profissional from "@/models/Profissional";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ESPECIALIDADES } from "@/constants/especialidades";
import { MapPin, Users } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface IProfissionalLean {
  _id: string;
  nomeCompleto: string;
  fotoPerfil: string | null;
  especialidades: string[];
  cidade: string;
  estado: string;
  resumoProfissional: string;
  disponibilidade: { tipo: string[]; imediata: boolean };
}

const DISPON_LABEL: Record<string, string> = {
  clt: "CLT", temporario: "Temporário", sazonal: "Sazonal",
};

const DISPON_COR: Record<string, string> = {
  clt:        "bg-blue-100 text-blue-700",
  temporario: "bg-orange-100 text-orange-700",
  sazonal:    "bg-purple-100 text-purple-700",
};

export default async function ProfissionaisPage() {
  const session = await auth();
  if (!session || session.user.role !== "empresa") redirect("/painel");

  await connectDB();

  const raw = await Profissional.find({})
    .select("-cpf -experiencias -habilidades -dataNascimento -cep")
    .sort({ completude: -1, createdAt: -1 })
    .limit(48)
    .lean();

  const profissionais = JSON.parse(JSON.stringify(raw)) as IProfissionalLean[];

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <Navbar />

      {/* Hero */}
      <div className="bg-[#143f28] relative overflow-hidden py-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.04] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/[0.04] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between relative">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-5 w-5 text-white/70" />
              <h1 className="text-2xl font-bold text-white">Banco de Profissionais</h1>
            </div>
            <p className="text-white/60 text-sm">
              {profissionais.length} profissional{profissionais.length !== 1 ? "is" : ""} cadastrado{profissionais.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {profissionais.length === 0 ? (
          <div className="text-center py-20">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Nenhum profissional cadastrado ainda</h2>
            <p className="text-muted-foreground text-sm">
              Divulgue a plataforma para que profissionais se cadastrem!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profissionais.map((prof) => (
              <Link key={prof._id} href={`/profissionais/${prof._id}`}>
                <Card className="hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer h-full">
                  <CardContent className="pt-5">
                    {/* Cabeçalho do card */}
                    <div className="flex items-center gap-3 mb-3">
                      {prof.fotoPerfil ? (
                        <img
                          src={prof.fotoPerfil}
                          alt={prof.nomeCompleto}
                          className="w-11 h-11 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-base font-bold text-primary">
                            {prof.nomeCompleto.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold leading-tight truncate">{prof.nomeCompleto}</p>
                        {(prof.cidade || prof.estado) && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {[prof.cidade, prof.estado].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Especialidades */}
                    {(prof.especialidades ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {prof.especialidades.slice(0, 2).map((e) => (
                          <Badge key={e} variant="secondary" className="text-xs font-normal">
                            {ESPECIALIDADES.find((esp) => esp.value === e)?.label ?? e}
                          </Badge>
                        ))}
                        {prof.especialidades.length > 2 && (
                          <Badge variant="outline" className="text-xs font-normal">
                            +{prof.especialidades.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Resumo */}
                    {prof.resumoProfissional && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                        {prof.resumoProfissional}
                      </p>
                    )}

                    {/* Disponibilidade */}
                    {(prof.disponibilidade?.tipo ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-3 border-t">
                        {prof.disponibilidade.tipo.map((t) => (
                          <span
                            key={t}
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${DISPON_COR[t] ?? "bg-muted text-muted-foreground"}`}
                          >
                            {DISPON_LABEL[t] ?? t}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
