import { UserPlus, Search, Handshake, Building2, FileText, Users } from "lucide-react";

const passosProfissional = [
  {
    icone: UserPlus,
    titulo: "Crie seu perfil",
    texto: "Cadastre-se gratuitamente e preencha seu currículo com especialidades, experiências e disponibilidade.",
    numero: "01",
  },
  {
    icone: Search,
    titulo: "Encontre vagas",
    texto: "Explore vagas de restaurantes, hotéis, bares e eventos na sua cidade ou região.",
    numero: "02",
  },
  {
    icone: Handshake,
    titulo: "Seja contratado",
    texto: "Candidate-se com um clique. CLT, bico ou temporada — você escolhe o tipo de trabalho.",
    numero: "03",
  },
];

const passosEmpresa = [
  {
    icone: Building2,
    titulo: "Cadastre sua empresa",
    texto: "Crie o perfil do seu restaurante, hotel, bar ou evento em poucos minutos.",
    numero: "01",
  },
  {
    icone: FileText,
    titulo: "Publique suas vagas",
    texto: "Descreva a vaga, defina o contrato e a remuneração. Vai ao ar imediatamente.",
    numero: "02",
  },
  {
    icone: Users,
    titulo: "Contrate com facilidade",
    texto: "Receba candidaturas, analise perfis e contrate o profissional ideal para sua equipe.",
    numero: "03",
  },
];

export default function ComoFunciona() {
  return (
    <section className="py-20 bg-[#f0faf5]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Como funciona</h2>
          <p className="text-muted-foreground text-lg">
            Simples e rápido — para profissionais e empresas.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Card Profissional — verde */}
          <div className="relative bg-[#1a5c38] rounded-2xl p-8 text-white overflow-hidden">
            {/* Decoração */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <div>
                  <h3 className="font-bold text-white">Para profissionais</h3>
                  <p className="text-xs text-white/60">Gratuito para sempre</p>
                </div>
              </div>

              <div className="space-y-6">
                {passosProfissional.map((passo, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
                        <passo.icone className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-white/40 tracking-widest">{passo.numero}</span>
                        <p className="font-semibold text-sm text-white">{passo.titulo}</p>
                      </div>
                      <p className="text-sm text-white/65 leading-relaxed">{passo.texto}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card Empresa — escuro */}
          <div className="relative bg-[#1a2e22] rounded-2xl p-8 text-white overflow-hidden">
            {/* Decoração */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/8 rounded-full translate-y-1/2 -translate-x-1/4" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/15">
                  <span className="text-white font-bold text-sm">E</span>
                </div>
                <div>
                  <h3 className="font-bold text-white">Para empresas</h3>
                  <p className="text-xs text-white/50">Publicação rápida</p>
                </div>
              </div>

              <div className="space-y-6">
                {passosEmpresa.map((passo, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                        <passo.icone className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-white/30 tracking-widest">{passo.numero}</span>
                        <p className="font-semibold text-sm text-white">{passo.titulo}</p>
                      </div>
                      <p className="text-sm text-white/55 leading-relaxed">{passo.texto}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
