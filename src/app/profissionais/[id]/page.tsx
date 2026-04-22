import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Profissional from "@/models/Profissional";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ESPECIALIDADES } from "@/constants/especialidades";
import { MapPin, Phone, ArrowLeft, Briefcase, CheckCircle, Clock, Plane, Star } from "lucide-react";
import Navbar from "@/components/layout/Navbar";

interface IExperiencia {
  cargo: string;
  empresa: string;
  cidade: string;
  estado: string;
  dataInicio: string;
  dataFim: string | null;
  descricao: string;
}

interface IProfissionalLean {
  _id: string;
  nomeCompleto: string;
  telefone: string;
  fotoPerfil: string | null;
  cidade: string;
  estado: string;
  dispostoViajar: boolean;
  especialidades: string[];
  resumoProfissional: string;
  disponibilidade: { tipo: string[]; imediata: boolean; dataDisponivel: string | null };
  experiencias: IExperiencia[];
  habilidades: string[];
}

const TIPOS_LABEL: Record<string, string> = {
  clt: "CLT", temporario: "Temporário", sazonal: "Sazonal",
};

function formatMes(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

export default async function PerfilProfissionalPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "empresa") redirect("/painel");

  await connectDB();

  const rawProf = await Profissional.findById(params.id)
    .select("-cpf -dataNascimento -cep")
    .lean();

  if (!rawProf) notFound();

  const prof = JSON.parse(JSON.stringify(rawProf)) as IProfissionalLean;

  const inicial = prof.nomeCompleto.charAt(0).toUpperCase();
  const disponTipos = prof.disponibilidade?.tipo ?? [];

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <Navbar />

      {/* Hero */}
      <div className="bg-[#1a5c38] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/[0.04] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/[0.04] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="max-w-3xl mx-auto px-4 py-8 relative">
          <Link
            href="/profissionais"
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Banco de Profissionais
          </Link>

          <div className="flex items-start gap-5">
            {/* Avatar */}
            {prof.fotoPerfil ? (
              <img
                src={prof.fotoPerfil}
                alt={prof.nomeCompleto}
                className="w-20 h-20 rounded-full object-cover shrink-0 border-2 border-white/20"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center shrink-0 border-2 border-white/20">
                <span className="text-3xl font-bold text-white">{inicial}</span>
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white">{prof.nomeCompleto}</h1>

              <div className="flex flex-wrap gap-1.5 mt-2">
                {(prof.especialidades ?? []).map((e) => (
                  <span
                    key={e}
                    className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 text-white font-medium"
                  >
                    {ESPECIALIDADES.find((esp) => esp.value === e)?.label ?? e}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 mt-3 text-sm text-white/70">
                {(prof.cidade || prof.estado) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {[prof.cidade, prof.estado].filter(Boolean).join(", ")}
                  </span>
                )}
                {prof.telefone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    {prof.telefone}
                  </span>
                )}
                {prof.dispostoViajar && (
                  <span className="flex items-center gap-1 text-white/80">
                    <Plane className="h-3.5 w-3.5" />
                    Disposto(a) a viajar
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-5">

        {/* Resumo */}
        {prof.resumoProfissional && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                Sobre
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {prof.resumoProfissional}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Disponibilidade */}
        {disponTipos.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Disponibilidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-3">
                {disponTipos.map((t) => (
                  <Badge key={t} variant="outline" className="border-primary/30 text-primary">
                    {TIPOS_LABEL[t] ?? t}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
                {prof.disponibilidade?.imediata
                  ? "Disponível imediatamente"
                  : "Disponível em breve"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Experiências */}
        {(prof.experiencias ?? []).length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Experiências
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {prof.experiencias.map((exp, i) => (
                <div key={i} className={`relative pl-4 border-l-2 border-primary/20 ${i > 0 ? "pt-5" : ""}`}>
                  <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-primary" />
                  <p className="font-semibold">{exp.cargo}</p>
                  <p className="text-sm text-muted-foreground">
                    {exp.empresa}
                    {(exp.cidade || exp.estado) && (
                      <span> · {[exp.cidade, exp.estado].filter(Boolean).join(", ")}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatMes(exp.dataInicio)}
                    {" — "}
                    {exp.dataFim ? formatMes(exp.dataFim) : "Atual"}
                  </p>
                  {exp.descricao && (
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      {exp.descricao}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Habilidades */}
        {(prof.habilidades ?? []).length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                Habilidades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {prof.habilidades.map((h) => (
                  <Badge key={h} variant="secondary" className="text-xs">
                    {h}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </main>
    </div>
  );
}
