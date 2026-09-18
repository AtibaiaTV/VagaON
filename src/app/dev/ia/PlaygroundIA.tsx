"use client";

import { useState } from "react";
import CriarVagaIA from "@/components/ia/CriarVagaIA";
import ImportarCurriculo from "@/components/ia/ImportarCurriculo";
import VideoApresentacao, { type VideoPerfil } from "@/components/perfil/VideoApresentacao";
import type { PerfilExtraido } from "@/lib/ia/curriculo";
import { descreverMesclagem, mesclarPerfilExtraido } from "@/lib/ia/mesclar-perfil";
import { vagaParaFormulario } from "@/lib/ia/mesclar-vaga";
import type { VagaEstruturada } from "@/lib/ia/vaga";

const PERFIL_EXEMPLO: PerfilExtraido = {
  nomeCompleto: "Mariana Costa",
  telefone: "11987654321",
  cidade: "Atibaia",
  estado: "SP",
  resumoProfissional: "Sous chef com 8 anos em cozinha italiana. Forte em fichas técnicas, custos e formação de equipe.",
  especialidades: ["sous_chef", "chef_partie", "inventada"],
  habilidades: ["Cozinha italiana", "Ficha técnica", "Custos"],
  experiencias: [
    { cargo: "Sous Chef", empresa: "Trattoria Nonna Rosa", cidade: "São Paulo", estado: "SP", dataInicio: "2021-03", dataFim: null, atual: true, descricao: "Liderança da brigada no turno da noite." },
    { cargo: "Chef de Partie", empresa: "Hotel Villa Verde", cidade: "Campos do Jordão", estado: "SP", dataInicio: null, dataFim: "2021-02", atual: false, descricao: null },
  ],
  formacao: [{ curso: "Tecnólogo em Gastronomia", instituicao: "Senac São Paulo", ano: "2017" }],
  idiomas: [{ idioma: "Italiano", nivel: "intermediario" }],
  confianca: "alta",
  observacoes: ["Não encontrei CEP no currículo."],
};

const ESTADO_FORM = {
  pessoal: { nomeCompleto: "Mariana C.", telefone: "", cidade: "", estado: "", resumoProfissional: "" },
  especialidades: ["chef_partie"],
  habilidades: "custos, Excel",
  experiencias: [{ cargo: "Chef de partie", empresa: "hotel villa verde", cidade: "", estado: "", dataInicio: "2019-01", dataFim: "2021-02", descricao: "" }],
  formacao: [],
  idiomas: [],
};

export default function PlaygroundIA({ iaConfigurada }: { iaConfigurada: boolean }) {
  const [saida, setSaida] = useState<string>("");
  const [video, setVideo] = useState<VideoPerfil | null>(null);
  const [erroVideo, setErroVideo] = useState("");

  function mostrar(titulo: string, obj: unknown) {
    setSaida(`${titulo}\n\n${JSON.stringify(obj, null, 2)}`);
  }

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <div style={{ backgroundColor: "#143f28" }} className="py-3">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between text-white text-sm">
          <span className="font-bold">DEV · IA playground</span>
          <span className="text-white/70">ANTHROPIC_API_KEY: {iaConfigurada ? "configurada" : "ausente (rotas respondem 503)"}</span>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <section className="space-y-2">
          <h2 className="font-bold">1. Currículo → perfil</h2>
          <ImportarCurriculo aoExtrair={(p) => mostrar("PerfilExtraido (da API)", p)} />
          <button
            type="button"
            className="text-sm font-semibold text-primary underline"
            onClick={() => {
              const r = mesclarPerfilExtraido(ESTADO_FORM, PERFIL_EXEMPLO);
              mostrar(`Mesclagem simulada — ${descreverMesclagem(r.relatorio)}`, r);
            }}
          >
            Simular mesclagem com um perfil de exemplo (sem API)
          </button>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold">2. Frase → vaga</h2>
          <CriarVagaIA
            aoEstruturar={(v: VagaEstruturada) =>
              mostrar("VagaEstruturada (da API) → formulário", {
                vaga: v,
                formulario: vagaParaFormulario(v, {
                  titulo: "", descricao: "", requisitos: "", tipo: "", especialidade: "", cidade: "Atibaia", estado: "SP", remoto: false,
                  salarioTipo: "a_combinar", salarioMin: "", salarioMax: "", salarioPeriodo: "mes", periodoInicio: "", periodoFim: "",
                  anosExperienciaMin: "", habilidadesDesejadas: "", turno: "", escala: "", posicoes: "1",
                }),
              })
            }
          />
        </section>

        <section className="space-y-2">
          <h2 className="font-bold">3. Vídeo de apresentação</h2>
          <VideoApresentacao video={video} onChange={(v) => { setVideo(v); mostrar("VideoPerfil", v); }} onErro={setErroVideo} />
          {erroVideo && <p className="text-sm text-destructive">{erroVideo}</p>}
        </section>

        <pre className="text-xs bg-white border rounded-xl p-4 overflow-auto max-h-[480px] whitespace-pre-wrap" data-testid="saida">
          {saida || "Saída aparece aqui."}
        </pre>
      </main>
    </div>
  );
}
