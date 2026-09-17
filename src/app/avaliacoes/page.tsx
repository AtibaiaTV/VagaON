import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { auth } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PainelAvaliacoes from "@/components/avaliacoes/PainelAvaliacoes";

export const dynamic = "force-dynamic";

export const metadata = { title: "Avaliações — VagaON" };

export default async function AvaliacoesPage({ searchParams }: { searchParams: { match?: string } }) {
  const session = await auth();
  if (!session) redirect("/entrar");
  const { role } = session.user;
  if (role === "admin") redirect("/admin/avaliacoes");

  return (
    <div className="min-h-screen bg-[#f4f7f5] flex flex-col">
      <Navbar />
      <div style={{ backgroundColor: role === "empresa" ? "#143f28" : "#1a5c38" }} className="py-6">
        <div className="max-w-2xl mx-auto px-4 flex items-center gap-2.5">
          <Star className="h-6 w-6 text-[#4ade80]" />
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">Avaliações</h1>
            <p className="text-white/60 text-xs">
              {role === "empresa"
                ? "Avalie quem você contratou e veja como sua empresa é avaliada"
                : "Avalie onde trabalhou e veja como as empresas avaliam você"}
            </p>
          </div>
        </div>
      </div>
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">
        <PainelAvaliacoes lado={role} matchDestacado={searchParams.match ?? null} />
      </main>
      <Footer />
    </div>
  );
}
