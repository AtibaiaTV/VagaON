"use client";

import FormEntradaRapida from "@/components/entrada/FormEntradaRapida";

export default function FormCurriculoRapido({ origem }: { origem: string | null }) {
  return (
    <FormEntradaRapida
      rotuloNome="Nome completo"
      rotuloEspecialidade="Sua função principal"
      corpo={() => ({})}
      api="/api/comecar/profissional"
      destino={() => "/perfil/editar?boasvindas=1"}
      textoBotao="Criar meu cadastro"
      textoEnviando="Criando seu cadastro…"
      origem={origem}
    />
  );
}
