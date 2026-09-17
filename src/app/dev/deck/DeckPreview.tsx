"use client";

import { useState } from "react";
import Link from "next/link";
import CardProfissionalSwipe from "@/components/match/CardProfissionalSwipe";
import CardVagaSwipe from "@/components/match/CardVagaSwipe";
import MatchOverlay from "@/components/match/MatchOverlay";
import SwipeDeck, { type Direcao } from "@/components/match/SwipeDeck";
import type { FeedProfissionalItem, FeedVagaItem } from "@/lib/servicos/feed";

const VAGAS: FeedVagaItem[] = [
  {
    score: {
      total: 97,
      faixa: "Match excelente",
      explicacoes: ["Cargo exato: Sous Chef", "Na sua região", "6 anos de experiência (vaga pede 5)"],
      alertas: [],
      distanciaKm: 3,
    },
    vaga: {
      id: "v1",
      titulo: "Sous Chef — Restaurante Italiano",
      descricao:
        "Buscamos sous chef para liderar a brigada no turno da noite. Cozinha italiana contemporânea, 80 lugares, equipe de 9. Responsável por mise en place, fichas técnicas, controle de custos e treinamento.\n\nAmbiente organizado, folga fixa e plano de carreira real.",
      requisitos: "Experiência em cozinha italiana; gestão de equipe; ficha técnica; disponibilidade noturna.",
      tipo: "clt",
      especialidade: "sous_chef",
      especialidadeLabel: "Sous Chef",
      especialidadesAceitas: [],
      cidade: "São Paulo",
      estado: "SP",
      remoto: false,
      salario: { tipo: "faixa", min: 5000, max: 7000, periodo: "mes" },
      periodo: { dataInicio: null, dataFim: null },
      turno: "noite",
      escala: "6x1",
      habilidadesDesejadas: ["cozinha italiana", "gestão de equipe", "custos"],
      anosExperienciaMin: 5,
      posicoes: 1,
      afirmativa: ["primeiro_emprego"],
      empresa: {
        id: "e1",
        nome: "Trattoria Nonna Rosa",
        logo: null,
        setor: "restaurante",
        verificada: true,
        reputacao: { media: 4.6, total: 7, recomendacoes: 6, pontosFortes: ["Pagamento em dia", "Respeito"], confiavel: true },
      },
      criadaEm: new Date().toISOString(),
    },
  },
  {
    score: {
      total: 85,
      faixa: "Match excelente",
      explicacoes: ["Experiência próxima: Sous Chef → Chef de Cozinha", "A 12 km de distância"],
      alertas: [],
      distanciaKm: 12,
    },
    vaga: {
      id: "v2",
      titulo: "Chef de Cozinha — Hotel Boutique",
      descricao: "Chef para comandar restaurante de hotel boutique com 40 apartamentos. Café da manhã, almoço executivo e jantar à la carte.",
      requisitos: "",
      tipo: "clt",
      especialidade: "chef_cozinha",
      especialidadeLabel: "Chef de Cozinha",
      especialidadesAceitas: ["sous_chef"],
      cidade: "Guarulhos",
      estado: "SP",
      remoto: false,
      salario: { tipo: "fixo", min: null, max: 8500, periodo: "mes" },
      periodo: { dataInicio: null, dataFim: null },
      turno: null,
      escala: "5x2",
      habilidadesDesejadas: [],
      anosExperienciaMin: 6,
      posicoes: 1,
      afirmativa: [],
      empresa: { id: "e2", nome: "Hotel Villa Verde", logo: null, setor: "hotel", verificada: false, reputacao: null },
      criadaEm: new Date().toISOString(),
    },
  },
  {
    score: {
      total: 65,
      faixa: "Bom match",
      explicacoes: ["Na sua região", "Aceita esse tipo de contrato"],
      alertas: ["Cargo fora da sua área principal", "Oferta ~30% abaixo da sua pretensão"],
      distanciaKm: 5,
    },
    vaga: {
      id: "v3",
      titulo: "Cozinheiro de Linha — Temporada de Verão",
      descricao: "Reforço de equipe para alta temporada. Dezembro a fevereiro, escala 6x1, alojamento incluso.",
      requisitos: "",
      tipo: "sazonal",
      especialidade: "cozinheiro_linha",
      especialidadeLabel: "Cozinheiro de Linha",
      especialidadesAceitas: [],
      cidade: "São Paulo",
      estado: "SP",
      remoto: false,
      salario: { tipo: "fixo", min: null, max: 3500, periodo: "mes" },
      periodo: { dataInicio: "2026-12-01T00:00:00.000Z", dataFim: "2027-02-28T00:00:00.000Z" },
      turno: "manha",
      escala: "6x1",
      habilidadesDesejadas: [],
      anosExperienciaMin: 2,
      posicoes: 4,
      afirmativa: [],
      empresa: { id: "e3", nome: "Buffet Solar", logo: null, setor: "buffet", verificada: true, reputacao: null },
      criadaEm: new Date().toISOString(),
    },
  },
];

const PROFISSIONAIS: FeedProfissionalItem[] = [
  {
    score: {
      total: 94,
      faixa: "Match excelente",
      explicacoes: ["Cargo exato: Sous Chef", "8 anos de experiência (vaga pede 5)", "Tem todas as habilidades pedidas"],
      alertas: [],
      distanciaKm: 4,
    },
    jaCurtiu: true,
    profissional: {
      id: "p1",
      nome: "Mariana Costa",
      foto: null,
      cidade: "São Paulo",
      estado: "SP",
      especialidades: ["sous_chef", "chef_partie"],
      especialidadesLabels: ["Sous Chef", "Cozinheiro (Chef de Partie)"],
      resumo: "Sous chef com passagem por dois restaurantes italianos premiados. Forte em fichas técnicas, custos e formação de equipe.",
      anosExperiencia: 8,
      habilidades: ["Cozinha italiana", "Gestão de equipe", "Ficha técnica", "Custos", "Massas frescas"],
      idiomas: [{ idioma: "Italiano", nivel: "intermediario" }],
      disponibilidade: { tipo: ["clt"], imediata: true },
      dispostoViajar: false,
      turnos: ["tarde", "noite"],
      escalas: ["6x1", "5x2"],
      ultimosCargos: ["Sous Chef", "Chef de Partie", "Cozinheiro de Linha"],
      completude: 95,
      oculto: false,
      reputacao: { media: 4.8, total: 5, recomendacoes: 5, pontosFortes: ["Pontualidade", "Trabalho em equipe"], confiavel: true },
    },
  },
  {
    score: {
      total: 72,
      faixa: "Match forte",
      explicacoes: ["Mesma área: Cozinheiro de Linha", "Na sua região"],
      alertas: ["Vaga pede 5 anos; seu perfil registra 3"],
      distanciaKm: 2,
    },
    jaCurtiu: false,
    profissional: {
      id: "p2",
      nome: "Rafael Nunes",
      foto: null,
      cidade: "São Paulo",
      estado: "SP",
      especialidades: ["cozinheiro_linha"],
      especialidadesLabels: ["Cozinheiro de Linha"],
      resumo: "Cozinheiro de linha buscando crescer para praça de liderança.",
      anosExperiencia: 3,
      habilidades: ["Grelhados", "Molhos"],
      idiomas: [],
      disponibilidade: { tipo: ["clt", "temporario"], imediata: false },
      dispostoViajar: true,
      turnos: ["noite"],
      escalas: ["6x1"],
      ultimosCargos: ["Cozinheiro de Linha", "Auxiliar de Cozinha"],
      completude: 70,
      oculto: true,
      reputacao: null,
    },
  },
];

export default function DeckPreview({ modo }: { modo: "profissional" | "empresa" }) {
  const [log, setLog] = useState<string[]>([]);
  const [match, setMatch] = useState<{ id: string; score: number; snapshot: MatchSnapshot } | null>(null);

  function registrar(rotulo: string, direcao: Direcao, dispararMatch: boolean, score: number) {
    setLog((l) => [`${direcao.toUpperCase()} → ${rotulo}`, ...l]);
    if (dispararMatch && direcao !== "pass") {
      setMatch({
        id: "m1",
        score,
        snapshot: {
          vagaTitulo: "Sous Chef — Restaurante Italiano",
          empresaNome: "Trattoria Nonna Rosa",
          empresaLogo: null,
          profissionalNome: "Mariana Costa",
          profissionalFoto: null,
          cidade: "São Paulo",
          estado: "SP",
        },
      });
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <div style={{ backgroundColor: "#1a5c38" }} className="py-3">
        <div className="max-w-md mx-auto px-4 flex items-center justify-between text-white text-sm">
          <span className="font-bold">DEV · Deck preview ({modo})</span>
          <Link href={modo === "empresa" ? "/dev/deck" : "/dev/deck?modo=empresa"} className="underline text-white/80">
            ver {modo === "empresa" ? "profissional" : "empresa"}
          </Link>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 py-5">
        {modo === "profissional" ? (
          <SwipeDeck
            itens={VAGAS}
            chave={(i) => i.vaga.id}
            renderizar={(item, topo) => <CardVagaSwipe item={item} topo={topo} />}
            aoDecidir={(item, d) => registrar(item.vaga.titulo, d, item.vaga.id === "v1", item.score.total)}
            rotulos={{ like: "TENHO INTERESSE", pass: "PASSAR", super: "MUITO INTERESSE" }}
            vazio={<p className="text-muted-foreground">Fim do deck (mock).</p>}
          />
        ) : (
          <SwipeDeck
            itens={PROFISSIONAIS}
            chave={(i) => i.profissional.id}
            renderizar={(item, topo) => <CardProfissionalSwipe item={item} topo={topo} />}
            aoDecidir={(item, d) => registrar(item.profissional.nome, d, item.jaCurtiu, item.score.total)}
            rotulos={{ like: "QUERO CONVERSAR", pass: "PASSAR", super: "PRIORIDADE" }}
            vazio={<p className="text-muted-foreground">Fim do deck (mock).</p>}
          />
        )}

        <div className="mt-6 text-xs text-muted-foreground" data-testid="log">
          <p className="font-semibold mb-1">Decisões:</p>
          {log.length === 0 ? <p>nenhuma ainda</p> : log.map((l, i) => <p key={i}>{l}</p>)}
        </div>
      </main>

      {match && <MatchOverlay match={match} lado={modo} aoFechar={() => setMatch(null)} />}
    </div>
  );
}

type MatchSnapshot = {
  vagaTitulo: string;
  empresaNome: string;
  empresaLogo: string | null;
  profissionalNome: string;
  profissionalFoto: string | null;
  cidade: string;
  estado: string;
};
