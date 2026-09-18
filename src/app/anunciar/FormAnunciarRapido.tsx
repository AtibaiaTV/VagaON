"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import FormEntradaRapida from "@/components/entrada/FormEntradaRapida";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const TIPOS = [
  { value: "temporario", label: "Bico / diária" },
  { value: "clt", label: "Fixo (CLT)" },
  { value: "sazonal", label: "Temporada / evento" },
];

export default function FormAnunciarRapido({ origem, comIA }: { origem: string | null; comIA: boolean }) {
  const [vagaTexto, setVagaTexto] = useState("");
  const [tipo, setTipo] = useState("temporario");

  return (
    <FormEntradaRapida
      rotuloNome="Nome do estabelecimento"
      rotuloEspecialidade="Função da vaga"
      api="/api/comecar/empresa"
      corpo={() => ({ vagaTexto: vagaTexto.trim(), tipo })}
      validarExtras={() => (vagaTexto.trim().length < 8 ? "Descreva a vaga com um pouco mais de detalhe." : null)}
      destino={(r) => (typeof r.vagaId === "string" ? `/vagas/${r.vagaId}` : "/painel")}
      textoBotao="Publicar minha vaga"
      textoEnviando={comIA ? "Criando a conta e montando a vaga…" : "Publicando…"}
      origem={origem}
      extras={
        <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
          <div className="space-y-1">
            <Label htmlFor="er-vaga">Descreva a vaga *</Label>
            <Textarea
              id="er-vaga"
              value={vagaTexto}
              onChange={(e) => setVagaTexto(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Ex.: preciso de 2 garçons pro sábado, das 18h à 1h, R$ 180 a diária, com experiência em eventos"
              className="bg-white"
              required
            />
            {comIA && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" /> A IA transforma isso num anúncio completo, com salário, datas e perguntas de triagem. Você ajusta depois.
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label>Tipo de contrato *</Label>
            <div className="flex flex-wrap gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTipo(t.value)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    tipo === t.value ? "bg-[#1a5c38] text-white border-[#1a5c38]" : "bg-white border-border hover:border-primary/50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      }
    />
  );
}
