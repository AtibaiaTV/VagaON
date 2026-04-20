import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Vaga from "@/models/Vaga";
import Empresa from "@/models/Empresa";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ESPECIALIDADES } from "@/constants/especialidades";
import { MapPin, Clock, Plus, ArrowLeft, Briefcase } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const TIPO_LABEL: Record<string, string> = {
  clt: "CLT", temporario: "Temporário", sazonal: "Sazonal",
};
const TIPO_COR: Record<string, string> = {
  clt: "bg-blue-100 text-blue-700",
  temporario: "bg-orange-100 text-orange-700",
  sazonal: "bg-purple-100 text-purple-700",
};

interface VagaPopulada {
  _id: string;
  titulo: string;
  tipo: string;
  especialidade: string;
  cidade: string;
  estado: string;
  status: string;
  totalCandidaturas: number;
  createdAt: string;
  empresaId: { nomeFantasia: string; cidade: string; estado: string };
  salario: { tipo: string; min: number | null; max: number | null; periodo: string };
}

function formatarSalario(salario: VagaPopulada["salario"]) {
  if (salario.tipo === "a_combinar") return "A combinar";
  const periodoLabel: Record<string, string> = { hora: "/h", dia: "/dia", mes: "/mês" };
  if (salario.tipo === "fixo") return `R$ ${salario.max?.toLocaleString("pt-BR")}${periodoLabel[salario.periodo]}`;
  return `R$ ${salario.min?.toLocaleString("pt-BR")} – ${salario.max?.toLocaleString("pt-BR")}${periodoLabel[salario.periodo]}`;
}

export default async function VagasPage() {
  const session = await auth();
  await connectDB();

  let vagas: VagaPopulada[] = [];
  let isEmpresa = false;

  if (session?.user.role === "empresa") {
    isEmpresa = true;
    const empresa = await Empresa.findOne({ userId: session.user.id });
    if (empresa) {
      vagas = await Vaga.find({ empresaId: empresa._id })
        .sort({ createdAt: -1 })
        .populate("empresaId", "nomeFantasia cidade estado")
        .lean() as unknown as VagaPopulada[];
    }
  } else {
    vagas = await Vaga.find({ status: "ativa", aprovadaPorAdmin: true })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("empresaId", "nomeFantasia cidade estado")
      .lean() as unknown as VagaPopulada[];
  }

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <Navbar />

      {/* Hero da página */}
      <div style={{ backgroundColor: isEmpresa ? "#143f28" : "#1a5c38" }} className="relative overflow-hidden py-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.04] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/[0.04] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isEmpresa ? "Minhas Vagas" : "Vagas disponíveis"}
            </h1>
            <p className="text-white/70 text-sm mt-1">
              {isEmpresa ? "Gerencie suas oportunidades publicadas" : "Encontre sua próxima oportunidade"}
            </p>
          </div>
          {isEmpresa && (
            <Link href="/vagas/nova">
              <Button size="sm" className="bg-white text-[#1a5c38] hover:bg-white/90 font-semibold gap-2">
                <Plus className="h-4 w-4" />Nova Vaga
              </Button>
            </Link>
          )}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {vagas.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              {isEmpresa ? "Você ainda não publicou vagas" : "Nenhuma vaga disponível"}
            </h2>
            {isEmpresa && (
              <Link href="/vagas/nova">
                <Button className="mt-4">Publicar primeira vaga</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {vagas.map((vaga) => (
              <Link key={vaga._id} href={`/vagas/${vaga._id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-semibold leading-tight">{vaga.titulo}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${TIPO_COR[vaga.tipo]}`}>
                        {TIPO_LABEL[vaga.tipo]}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      {vaga.empresaId?.nomeFantasia}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="secondary" className="text-xs">
                        {ESPECIALIDADES.find((e) => e.value === vaga.especialidade)?.label ?? vaga.especialidade}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {vaga.cidade}, {vaga.estado}
                      </span>
                      <span>{formatarSalario(vaga.salario)}</span>
                    </div>

                    {isEmpresa && (
                      <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                        <span className={`font-medium ${vaga.status === "ativa" ? "text-green-600" : "text-muted-foreground"}`}>
                          {vaga.status === "ativa" ? "Ativa" : vaga.status}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {vaga.totalCandidaturas} candidatura(s)
                        </span>
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
