import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Termos de Uso — VagaON",
  description: "Regras de uso do VagaON para profissionais e empresas.",
};

const ATUALIZADA_EM = "18 de setembro de 2026";
const CONTATO = "atibaiatv2013@gmail.com";

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <article className="bg-white rounded-2xl border border-border/40 shadow-sm p-6 sm:p-10 space-y-8 text-[15px] leading-relaxed text-foreground/90">
          <header>
            <h1 className="text-2xl sm:text-3xl font-bold">Termos de Uso</h1>
            <p className="text-sm text-muted-foreground mt-1">Atualizados em {ATUALIZADA_EM}</p>
          </header>

          <Secao titulo="1. O que é o VagaON">
            <p>
              Uma plataforma que aproxima profissionais de gastronomia, hotelaria e eventos de empresas que contratam.
              O VagaON <strong>não é empregador nem intermediário de mão de obra</strong>: a relação de trabalho é
              sempre entre o profissional e a empresa, que decidem entre si contratação, remuneração e condições.
            </p>
          </Secao>

          <Secao titulo="2. Contas">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Profissionais usam a plataforma gratuitamente.</li>
              <li>
                Empresas podem publicar vagas e buscar profissionais. Recursos pagos, quando existirem, serão
                informados antes da contratação.
              </li>
              <li>Você é responsável pela veracidade dos dados e pela guarda da sua senha.</li>
              <li>Uma empresa pode ter mais de uma pessoa operando a conta (dono e gerentes), sob responsabilidade do dono.</li>
            </ul>
          </Secao>

          <Secao titulo="3. Uso aceitável">
            <p>Não é permitido:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>publicar vagas falsas, discriminatórias ou que violem a lei;</li>
              <li>criar perfis falsos ou em nome de terceiros;</li>
              <li>usar o chat para assédio, spam ou ofertas fora do propósito da plataforma;</li>
              <li>copiar ou extrair dados de outros usuários;</li>
              <li>cobrar qualquer valor do profissional para participar de processo seletivo.</li>
            </ul>
            <p>Contas que descumprirem podem ser suspensas sem aviso.</p>
          </Secao>

          <Secao titulo="4. Avaliações">
            <p>
              Após uma contratação, os dois lados podem se avaliar. As avaliações são publicadas só quando os dois
              avaliam ou após 14 dias, podem ser respondidas e contestadas, e devem ser honestas e respeitosas.
            </p>
          </Secao>

          <Secao titulo="5. Avisos e comunicação">
            <p>
              Ao se cadastrar, você aceita receber avisos sobre a sua conta pelo site, e-mail, notificações e
              WhatsApp. Cada canal pode ser desligado no perfil; o WhatsApp também respondendo PARAR. Detalhes na{" "}
              <Link href="/privacidade" className="text-primary underline underline-offset-2">
                Política de Privacidade
              </Link>
              .
            </p>
          </Secao>

          <Secao titulo="6. Responsabilidade">
            <p>
              O VagaON faz o possível para manter a plataforma no ar e os dados corretos, mas não garante contratação,
              disponibilidade ininterrupta nem a conduta de outros usuários. Confira sempre a empresa ou o candidato
              antes de fechar qualquer acordo.
            </p>
          </Secao>

          <Secao titulo="7. Encerramento">
            <p>
              Você pode excluir sua conta a qualquer momento pelo perfil ou escrevendo para{" "}
              <a href={`mailto:${CONTATO}`} className="text-primary underline underline-offset-2">
                {CONTATO}
              </a>
              .
            </p>
          </Secao>

          <Secao titulo="8. Foro">
            <p>Estes termos seguem a lei brasileira. Fica eleito o foro da comarca de Atibaia, SP.</p>
          </Secao>
        </article>
      </main>
      <Footer />
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">{titulo}</h2>
      {children}
    </section>
  );
}
