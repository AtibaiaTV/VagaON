import { notFound } from "next/navigation";
import KanbanCandidatos from "@/components/candidaturas/KanbanCandidatos";
import type { CandidatoKanban } from "@/lib/servicos/candidaturas";

/** Playground do funil com dados fictícios — sem banco, sem login. Só fora de produção. */
export default function KanbanDevPage({ searchParams }: { searchParams: { cego?: string } }) {
  if (process.env.NODE_ENV === "production") notFound();
  const cego = searchParams.cego === "1";

  const base = (i: number, extra: Partial<CandidatoKanban>): CandidatoKanban => ({
    id: `c${i}`,
    status: "visualizada",
    criadoEm: new Date().toISOString(),
    mensagem: null,
    notaEmpresa: null,
    profissionalId: `p${i}`,
    nome: cego && ["enviada", "visualizada", "em_analise"].includes(extra.status ?? "visualizada") ? `Candidato ${i}` : `Pessoa ${i}`,
    foto: null,
    cidade: "Atibaia",
    estado: "SP",
    especialidades: ["Garçom / Garçonete", "Cumim"],
    anosExperiencia: i,
    score: { total: 95 - i * 7, faixa: i < 2 ? "Match excelente" : i < 4 ? "Match forte" : "Bom match", explicacao: "Cargo exato: Garçom / Garçonete" },
    matchId: i % 2 === 0 ? `m${i}` : null,
    oculto: cego && ["enviada", "visualizada", "em_analise"].includes(extra.status ?? "visualizada"),
    triagem: null,
    video: null,
    ...extra,
  });

  const perguntas = ["Você tem disponibilidade para o turno da noite (16h–1h)?", "Já trabalhou com serviço à francesa? Conte em uma frase."];

  const candidatos: CandidatoKanban[] = [
    base(1, {
      nome: cego ? "Candidato 1" : "Mariana Costa",
      mensagem: "Tenho disponibilidade imediata.",
      video: cego ? null : { url: "https://res.cloudinary.com/demo/video/upload/dog.mp4", duracao: 27 },
      triagem: {
        perguntas,
        respostas: ["Sim, moro perto e já trabalho à noite há 3 anos.", "Sim, 2 anos no Hotel Villa Verde com serviço à francesa e empratado."],
        ia: {
          resumo: "As respostas atendem diretamente aos dois pontos da vaga: disponibilidade noturna confirmada e experiência específica com serviço à francesa em hotel.",
          pontosFortes: ["Disponibilidade noturna confirmada", "Experiência com serviço à francesa"],
          ressalvas: [],
          nota: 5,
          recomendaEntrevista: true,
        },
      },
    }),
    base(2, {
      nome: cego ? "Candidato 2" : "Rafael Nunes",
      status: "em_analise",
      notaEmpresa: "Ligar terça.",
      triagem: {
        perguntas,
        respostas: ["Depende do dia.", ""],
        ia: {
          resumo: "A disponibilidade noturna ficou condicional e a pergunta sobre serviço à francesa não foi respondida. Vale confirmar os dois pontos antes de avançar.",
          pontosFortes: [],
          ressalvas: ["Disponibilidade condicional", "Não respondeu sobre serviço à francesa"],
          nota: 2,
          recomendaEntrevista: false,
        },
      },
    }),
    base(7, { nome: cego ? "Candidato 7" : "Bruna Lima", triagem: { perguntas, respostas: ["Sim, sem problema.", "Ainda não, mas aprendo rápido."], ia: null } }),
    base(3, { nome: "Diogo Santos", status: "entrevista" }),
    base(4, { nome: "Ana Caroline", status: "aprovada" }),
    base(5, { nome: cego ? "Candidato 5" : "Jean Lucas", status: "visualizada", score: null }),
    base(6, { nome: "Winnis Greyce", status: "recusada" }),
  ];

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <div style={{ backgroundColor: "#143f28" }} className="py-3">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between text-white text-sm">
          <span className="font-bold">DEV · Kanban preview {cego ? "(modo às cegas)" : ""}</span>
          <a href={cego ? "/dev/kanban" : "/dev/kanban?cego=1"} className="underline text-white/80">
            {cego ? "modo normal" : "modo às cegas"}
          </a>
        </div>
      </div>
      <main className="max-w-5xl mx-auto px-4 py-6 bg-white mt-4 rounded-2xl">
        <KanbanCandidatos candidatos={candidatos} modoCego={cego} />
      </main>
    </div>
  );
}
