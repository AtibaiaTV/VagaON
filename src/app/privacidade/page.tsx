import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Política de Privacidade — VagaON",
  description: "Como o VagaON coleta, usa e protege os dados de profissionais e empresas.",
};

const ATUALIZADA_EM = "18 de setembro de 2026";
const CONTATO = "atibaiatv2013@gmail.com";

/**
 * Política de privacidade (LGPD). Exigida também pela Meta para publicar o
 * app do WhatsApp. Texto direto, sem juridiquês: diz o que coletamos, para
 * quê, com quem compartilhamos e como a pessoa sai.
 */
export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <article className="bg-white rounded-2xl border border-border/40 shadow-sm p-6 sm:p-10 space-y-8 text-[15px] leading-relaxed text-foreground/90">
          <header>
            <h1 className="text-2xl sm:text-3xl font-bold">Política de Privacidade</h1>
            <p className="text-sm text-muted-foreground mt-1">Atualizada em {ATUALIZADA_EM}</p>
          </header>

          <section className="space-y-3">
            <p>
              O VagaON é uma plataforma que conecta profissionais de gastronomia, hotelaria e eventos a empresas que
              contratam. Esta política explica quais dados coletamos, para que usamos, com quem compartilhamos e como
              você controla isso, nos termos da Lei Geral de Proteção de Dados (Lei 13.709/2018).
            </p>
          </section>

          <Secao titulo="1. Quais dados coletamos">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Conta:</strong> nome, e-mail, senha (guardada de forma criptografada) e telefone/WhatsApp.
              </li>
              <li>
                <strong>Perfil profissional:</strong> cidade, bairro e endereço, data de nascimento, funções e
                experiências, formação, habilidades, disponibilidade, pretensão salarial, foto e vídeo de apresentação,
                cidades em que aceita trabalhar. Você decide o quanto preenche.
              </li>
              <li>
                <strong>Perfil da empresa:</strong> nome fantasia, razão social, CNPJ, endereço, telefone, e-mail, site,
                logo e as vagas publicadas.
              </li>
              <li>
                <strong>Uso da plataforma:</strong> candidaturas, curtidas e matches, mensagens trocadas no chat,
                entrevistas marcadas, avaliações, notificações recebidas e a confirmação do seu número de WhatsApp.
              </li>
              <li>
                <strong>Técnicos:</strong> endereço IP, navegador e dispositivo, para segurança e funcionamento.
              </li>
            </ul>
          </Secao>

          <Secao titulo="2. Para que usamos">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Aproximar profissionais e vagas: o motor de match usa função, cidade, distância e experiência.</li>
              <li>Mostrar seu perfil às empresas que buscam candidatos, e as vagas aos profissionais.</li>
              <li>
                Avisar sobre novidades da sua conta: match, mensagem, entrevista, candidatura, vaga nova que combina com
                você e resumos periódicos.
              </li>
              <li>Melhorar a plataforma e evitar fraudes e abusos.</li>
            </ul>
          </Secao>

          <Secao titulo="3. Avisos por WhatsApp, e-mail e notificações">
            <p>
              Com o telefone que você informa no cadastro, enviamos avisos pelo <strong>WhatsApp</strong> usando a API
              oficial da Meta. As mensagens são sobre a sua conta (match, mensagem, entrevista, candidatura, vaga
              compatível, código de confirmação do número). Não enviamos propaganda de terceiros.
            </p>
            <p>
              Você pode desligar cada canal em <strong>Perfil → Notificações</strong>, e pode parar os avisos por
              WhatsApp a qualquer momento respondendo <strong>PARAR</strong> à mensagem. Para voltar, responda{" "}
              <strong>VOLTAR</strong>. O aviso dentro do site continua disponível independentemente dos canais.
            </p>
          </Secao>

          <Secao titulo="4. Com quem compartilhamos">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Empresas cadastradas:</strong> veem o perfil profissional (nome, função, cidade e bairro, resumo,
                experiências, foto e vídeo) para avaliar candidatos. O endereço completo não é exibido a empresas.
              </li>
              <li>
                <strong>Profissionais:</strong> veem a página pública da empresa e as vagas.
              </li>
              <li>
                <strong>RedeSA:</strong> plataforma parceira do mesmo grupo. Empresas que já têm conta na RedeSA podem
                entrar no VagaON por ela, e novos profissionais e candidaturas são informados ao banco de talentos da
                RedeSA.
              </li>
              <li>
                <strong>Fornecedores que operam a plataforma:</strong> hospedagem (Vercel), banco de dados (MongoDB
                Atlas), imagens e vídeos (Cloudinary), e-mail (Resend), WhatsApp (Meta) e inteligência artificial
                (Anthropic) para estruturar currículos e vagas. Cada um recebe só o necessário para o serviço.
              </li>
              <li>Autoridades, quando houver obrigação legal.</li>
            </ul>
            <p>Não vendemos dados pessoais.</p>
          </Secao>

          <Secao titulo="5. Por quanto tempo guardamos">
            <p>
              Enquanto a conta existir. Notificações somem em 90 dias; registros de mensagens de WhatsApp em 90 dias;
              perfis sem atividade por 180 dias são pausados (não apagados) e a pessoa é avisada antes. Ao excluir a
              conta, apagamos os dados, salvo o que a lei exigir guardar.
            </p>
          </Secao>

          <Secao titulo="6. Seus direitos">
            <p>
              Você pode acessar, corrigir, exportar ou excluir seus dados, pausar a visibilidade do perfil e revogar
              consentimentos. A maior parte se faz no próprio perfil. Para o resto, escreva para{" "}
              <a href={`mailto:${CONTATO}`} className="text-primary underline underline-offset-2">
                {CONTATO}
              </a>
              .
            </p>
          </Secao>

          <Secao titulo="7. Segurança">
            <p>
              Senhas são guardadas com hash, o tráfego é criptografado (HTTPS), o acesso administrativo é restrito e os
              códigos de confirmação de WhatsApp nunca são guardados em texto claro.
            </p>
          </Secao>

          <Secao titulo="8. Mudanças nesta política">
            <p>
              Quando mudar algo relevante, atualizamos a data no topo e avisamos pela plataforma. Os{" "}
              <Link href="/termos" className="text-primary underline underline-offset-2">
                Termos de Uso
              </Link>{" "}
              complementam este documento.
            </p>
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
