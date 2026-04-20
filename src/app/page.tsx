import { connectDB } from "@/lib/db";
import Vaga from "@/models/Vaga";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/landing/Hero";
import ComoFunciona from "@/components/landing/ComoFunciona";
import Especialidades from "@/components/landing/Especialidades";
import VagasDestaque from "@/components/landing/VagasDestaque";
import CTA from "@/components/landing/CTA";
import StatsBar from "@/components/landing/StatsBar";
import CriarPerfilBox from "@/components/landing/CriarPerfilBox";

export default async function HomePage() {
  await connectDB();

  const vagasDestaque = await Vaga.find({ status: "ativa", aprovadaPorAdmin: true })
    .sort({ createdAt: -1 })
    .limit(6)
    .populate("empresaId", "nomeFantasia")
    .lean();

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
        <CTA />
      </main>
      <Footer />
    </>
  );
}
