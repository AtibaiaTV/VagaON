import { notFound } from "next/navigation";
import CandidaturaRapida from "@/app/vagas/[id]/CandidaturaRapida";

/**
 * Playground do formulário de candidatura rápida — renderiza o componente
 * mesmo com sessão ativa. Só fora de produção. ATENÇÃO: enviar cria conta
 * e candidatura REAIS no banco configurado.
 */
export default function CandidaturaRapidaDevPage({ searchParams }: { searchParams: { vagaId?: string } }) {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <div style={{ backgroundColor: "#1a5c38" }} className="py-3">
        <div className="max-w-2xl mx-auto px-4 text-white text-sm font-bold">DEV · Candidatura rápida preview</div>
      </div>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <CandidaturaRapida
            vagaId={searchParams.vagaId ?? "000000000000000000000000"}
            vagaTitulo="Garçom/garçonete"
            cidade="Jaguariúna"
            estado="SP"
            especialidade="garcom"
          />
        </div>
      </main>
    </div>
  );
}
