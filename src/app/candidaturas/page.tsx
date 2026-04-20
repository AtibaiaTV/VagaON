import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import Candidatura from "@/models/Candidatura";
import Profissional from "@/models/Profissional";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ClipboardList } from "lucide-react";

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
    <div className="min-h-screen bg-muted/30">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/painel" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <ClipboardList className="h-5 w-5 text-primary" />
          <span className="font-semibold">Minhas Candidaturas</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {candidaturas.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Nenhuma candidatura ainda</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Explore as vagas disponíveis e candidate-se!
            </p>
            <Link href="/vagas" className="text-primary hover:underline text-sm font-medium">
              Ver vagas disponíveis →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {candidaturas.map((c) => (
              <Link key={c._id} href={`/vagas/${c.vagaId._id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{c.vagaId.titulo}</p>
                        <p className="text-sm text-muted-foreground">
                          {c.vagaId.empresaId?.nomeFantasia} · {c.vagaId.cidade}, {c.vagaId.estado}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Candidatado em {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${STATUS_COR[c.status]}`}>
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
    </div>
  );
}
