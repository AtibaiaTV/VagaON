import { notFound } from "next/navigation";
import FormularioAvaliacaoDev from "./FormularioAvaliacaoDev";

/** Playground do formulário de avaliação (sem match real). Só fora de produção. */
export default function AvaliacaoDevPage({ searchParams }: { searchParams: { lado?: string } }) {
  if (process.env.NODE_ENV === "production") notFound();
  const lado = searchParams.lado === "profissional" ? "profissional" : "empresa";
  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <div style={{ backgroundColor: "#1a5c38" }} className="py-3">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between text-white text-sm">
          <span className="font-bold">DEV · Formulário de avaliação ({lado})</span>
          <a href={lado === "empresa" ? "/dev/avaliacao?lado=profissional" : "/dev/avaliacao"} className="underline text-white/80">
            ver {lado === "empresa" ? "profissional" : "empresa"}
          </a>
        </div>
      </div>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <FormularioAvaliacaoDev lado={lado} />
      </main>
    </div>
  );
}
