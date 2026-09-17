import FilaDisputas from "./FilaDisputas";

export const dynamic = "force-dynamic";

export default function AdminAvaliacoesPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Avaliações contestadas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Quem foi avaliado pode contestar. Aceitar remove a avaliação da reputação; rejeitar mantém. A pessoa é avisada da decisão.
        </p>
      </div>
      <FilaDisputas />
    </div>
  );
}
