import { notFound } from "next/navigation";
import { MODELO_PADRAO, corValida, ehModeloCurriculo, montarDadosCurriculo } from "@/lib/curriculo";
import PlaygroundCurriculo from "./PlaygroundCurriculo";

/** Playground dos modelos de currículo com dados fictícios — sem banco, sem login. Só fora de produção. */
export default function CurriculoDevPage({
  searchParams,
}: {
  searchParams: { modelo?: string; vazio?: string; cor?: string; publico?: string };
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const completo = {
    nomeCompleto: "Mariana Costa Ribeiro",
    telefone: "(11) 98765-4321",
    fotoPerfil: null,
    cidade: "Atibaia",
    estado: "SP",
    linkedinUrl: "https://www.linkedin.com/in/marianacosta",
    especialidades: ["sous_chef", "chef_partie"],
    resumoProfissional:
      "Sous chef com 8 anos de cozinha italiana contemporânea. Forte em fichas técnicas, controle de custos e formação de brigada. Busco uma cozinha com carreira real e folga fixa.",
    habilidades: ["Cozinha italiana", "Ficha técnica", "Custos", "Massas frescas", "Liderança de brigada", "BPF"],
    idiomas: [
      { idioma: "Italiano", nivel: "intermediario" },
      { idioma: "Inglês", nivel: "basico" },
    ],
    disponibilidade: { tipo: ["clt", "sazonal"], imediata: true, dataDisponivel: null },
    experiencias: [
      {
        cargo: "Sous Chef",
        empresa: "Trattoria Nonna Rosa",
        cidade: "São Paulo",
        estado: "SP",
        dataInicio: "2021-03-01",
        dataFim: null,
        descricao: "Liderança da brigada de 9 pessoas no turno da noite.\nRedução de 12% no custo de mercadoria vendida com fichas técnicas.\nTreinamento de 4 cozinheiros promovidos a praça.",
      },
      {
        cargo: "Chef de Partie",
        empresa: "Hotel Villa Verde",
        cidade: "Campos do Jordão",
        estado: "SP",
        dataInicio: "2018-01-01",
        dataFim: "2021-02-01",
        descricao: "Praça de massas e risotos em restaurante de hotel boutique (40 apartamentos).",
      },
      {
        cargo: "Cozinheira de Linha",
        empresa: "Buffet Solar",
        cidade: "Bragança Paulista",
        estado: "SP",
        dataInicio: "2016-06-01",
        dataFim: "2017-12-01",
        descricao: "",
      },
    ],
    formacao: [
      { curso: "Tecnólogo em Gastronomia", instituicao: "Senac São Paulo", ano: "2017" },
      { curso: "Curso de Cozinha Italiana Regional", instituicao: "ICIF Brasil", ano: "2019" },
    ],
  };

  const vazio = { nomeCompleto: "João Silva", especialidades: ["garcom"], cidade: "Jarinu", estado: "SP", telefone: "(11) 91234-5678" };

  const dados = montarDadosCurriculo(searchParams.vazio === "1" ? vazio : completo, "mariana.costa@email.com");
  const modelo = ehModeloCurriculo(searchParams.modelo) ? searchParams.modelo : MODELO_PADRAO;
  // ?cor=8e2a3b (sem #) força a cor de detalhe do modelo escolhido.
  const cor = searchParams.cor ? `#${searchParams.cor.replace("#", "")}` : null;

  return (
    <PlaygroundCurriculo
      dados={dados}
      modelo={modelo}
      cores={corValida(cor) ? { [modelo]: cor } : {}}
      vazio={searchParams.vazio === "1"}
      publico={searchParams.publico === "1"}
    />
  );
}
