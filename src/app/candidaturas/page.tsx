import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Candidatura from "@/models/Candidatura";
import Profissional from "@/models/Profissional";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ClipboardList, MapPin } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const STATUS_LABEL: Record<string, string> = {
  enviada: "Enviada", visualizada: "Visualizada",
  em_analise: "Em análise", aprovada: "Aprovada", recusada: "Recusada",
};
const STATUS_COR: Record<string, string> = {
  enviada: "bg-blue-100 text-blue-700",
  visualizada: "bg-gray-100 text-gray-700",
  em_analise: "bg-yellow-100 text-yellow-700",
  aprovada: "bg-green-100 text-green-700",
  recusada: "bg-red-100 text-red-700",
};

const TIPO_LABEL: Record<string, string> = {
  clt: "CLT", temporario: "Temporário", sazonal: "Sazonal",
};

interface CandidaturaPopulada {
  _id: string;
  status: string;
  createdAt: string;
  vagaId: {
    _id: string;
    titulo: string;
    tipo: string;
    cidade: string;
    estado: string;
    empresaId: { nomeFantasia: string };
  };
}

export default async function CandidaturasPage() {
  const session = await auth();
  if (!session || session.user.role !== "profissional") redirect("/painel");

  await connectDB();

  const profissional = await Profissional.findOne({ userId: session.user.id });
  if (!profissional) redirect("/perfil/editar");

  const candidaturas = await Candidatura.find({ profissionalId: profissional._id })
    .sort({ createdAt: -1 })
    .populate({
      path: "vagaId",
      select: "titulo tipo cidade estado empresaId",
      populate: { path: "empresaId", select: "nomeFantasia" },
    })
    .lean() as unknown as CandidaturaPopulada[];

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <Navbar />

      {/* Hero */}
      <div style={{ backgroundColor: "#1a5c38" }} className="py-10">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-white">Minhas Candidaturas</h1>
          <p className="text-white/70 text-sm mt-1">
            {candidaturas.length > 0
              ? `${candidaturas.length} candidatura(s) enviada(s)`
              : "Acompanhe o status das suas candidaturas"}
          </p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {candidaturas.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Nenhuma candidatura ainda</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Explore as vagas disponíveis e candidate-se!
            </p>
            <Link href="/vagas">
              <Button className="gap-2">
                Ver vagas disponíveis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {candidaturas.map((c) => (
              <Link key={c._id} href={`/vagas/${c.vagaId._id}`}>
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold leading-snug">{c.vagaId.titulo}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {c.vagaId.empresaId?.nomeFantasia}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-primary/60" />
                            {c.vagaId.cidade}, {c.vagaId.estado}
                          </span>
                          {c.vagaId.tipo && (
                            <span className="font-medium">{TIPO_LABEL[c.vagaId.tipo]}</span>
                          )}
                          <span>
                            {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap ${STATUS_COR[c.status]}`}>
                        {STATUS_LABEL[c.status]}
                      </span>
                    </div>
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
