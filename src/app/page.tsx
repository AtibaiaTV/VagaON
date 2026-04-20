import { connectDB } from "@/lib/db";
import Vaga from "@/models/Vaga";
import "@/models/Empresa"; // registra o modelo para o populate funcionar
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/landing/Hero";
import ComoFunciona from "@/components/landing/ComoFunciona";
import Especialidades from "@/components/landing/Especialidades";
import VagasDestaque from "@/components/landing/VagasDestaque";
import StatsBar from "@/components/landing/StatsBar";
import CriarPerfilBox from "@/components/landing/CriarPerfilBox";

export default async function HomePage() {
  let vagasDestaque: any[] = [];

  try {
    await connectDB();
    vagasDestaque = await Vaga.find({ status: "ativa", aprovadaPorAdmin: true })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("empresaId", "nomeFantasia")
      .lean();
  } catch (err) {
    console.error("Erro ao buscar vagas destaque:", err);
  }

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <StatsBar />
        <ComoFunciona />
        <Especialidades />
        <CriarPerfilBox />
        <VagasDestaque vagas={JSON.parse(JSON.stringify(vagasDestaque))} />
      </main>
      <Footer />
    </>
  );
}
